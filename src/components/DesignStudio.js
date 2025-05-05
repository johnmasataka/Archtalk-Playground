import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import useStore from '../store';

const DesignStudio = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const transformControlsRef = useRef(null);
  const meshesRef = useRef([]);
  const selectedObjectRef = useRef(null);
  const { buildingData, updateBuildingData } = useStore();

  // Update model function
  const updateModel = (data) => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    
    // Clear existing meshes
    meshesRef.current.forEach(mesh => scene.remove(mesh));
    meshesRef.current = [];

    // Load model
    data.objects.forEach((obj, index) => {
      if (obj.geometry.vertices) {
        // Calculate the bounding box of the geometry
        const boundingBox = {
          min: new THREE.Vector3(Infinity, Infinity, Infinity),
          max: new THREE.Vector3(-Infinity, -Infinity, -Infinity)
        };
        
        // Find the bounding box
        obj.geometry.vertices.forEach(vertex => {
          boundingBox.min.x = Math.min(boundingBox.min.x, vertex[0]);
          boundingBox.min.y = Math.min(boundingBox.min.y, vertex[2]);
          boundingBox.min.z = Math.min(boundingBox.min.z, vertex[1]);
          boundingBox.max.x = Math.max(boundingBox.max.x, vertex[0]);
          boundingBox.max.y = Math.max(boundingBox.max.y, vertex[2]);
          boundingBox.max.z = Math.max(boundingBox.max.z, vertex[1]);
        });
        
        // Calculate the center point
        const center = new THREE.Vector3(
          (boundingBox.min.x + boundingBox.max.x) / 2,
          (boundingBox.min.y + boundingBox.max.y) / 2,
          (boundingBox.min.z + boundingBox.max.z) / 2
        );

        // Create the vertex array
        const vertexArray = new Float32Array(
          obj.geometry.vertices.flatMap(vertex => [
            vertex[0] - center.x,
            vertex[2] - center.y,
            vertex[1] - center.z
          ])
        );

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertexArray, 3));

        // Create the face index
        const indices = [];
        obj.geometry.faces.forEach(face => {
          if (face.length === 4) {
            indices.push(face[0], face[1], face[2]);
            indices.push(face[2], face[3], face[0]);
          } else {
            indices.push(...face);
          }
        });

        geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
        geometry.computeVertexNormals();

        // Create the material
        const material = new THREE.MeshPhongMaterial({
          transparent: obj.material.transparency > 0,
          opacity: 1 - obj.material.transparency,
          side: THREE.DoubleSide,
          roughness: obj.material.roughness || 0.5
        });

        // Load the texture or set the color
        if (obj.material.texture) {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(obj.material.texture, (texture) => {
            material.map = texture;
            material.needsUpdate = true;
          });
        } else {
          material.color = new THREE.Color(
            obj.material.color[0] / 255,
            obj.material.color[1] / 255,
            obj.material.color[2] / 255
          );
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(center);
        mesh.userData.id = obj.id;
        mesh.userData.layer = obj.layer;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add(mesh);
        meshesRef.current.push(mesh);
      }
    });
  };

  // Load and update model
  useEffect(() => {
    if (!sceneRef.current || !buildingData || !buildingData.building) return;

    const scene = sceneRef.current;
    
    // Clear existing objects
    scene.children = scene.children.filter(child => 
      child.type === 'GridHelper' || 
      child.type === 'TransformControls' || 
      child.type === 'DirectionalLight' || 
      child.type === 'AmbientLight'
    );

    // Create materials
    const materials = {
      wall: new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        side: THREE.DoubleSide
      }),
      floor: new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        side: THREE.DoubleSide
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        side: THREE.DoubleSide
      })
    };

    // Create room layout
    const createRoom = (position, size, type) => {
      const { width, depth, height } = size;
      const { x, y, z } = position;

      // Create the floor
      const floorGeometry = new THREE.BoxGeometry(width, 1, depth);
      const floor = new THREE.Mesh(floorGeometry, materials.floor);
      floor.position.set(x, y, z);
      floor.receiveShadow = true;
      scene.add(floor);

      // Create the ceiling
      const ceilingGeometry = new THREE.BoxGeometry(width, 1, depth);
      const ceiling = new THREE.Mesh(ceilingGeometry, materials.ceiling);
      ceiling.position.set(x, y + height, z);
      ceiling.castShadow = true;
      scene.add(ceiling);

      // Create the walls
      const wallThickness = 20;
      const wallHeight = height;

      // Front wall
      const frontWallGeometry = new THREE.BoxGeometry(width, wallHeight, wallThickness);
      const frontWall = new THREE.Mesh(frontWallGeometry, materials.wall);
      frontWall.position.set(x, y + wallHeight/2, z + depth/2);
      frontWall.castShadow = true;
      frontWall.receiveShadow = true;
      scene.add(frontWall);

      // Back wall
      const backWallGeometry = new THREE.BoxGeometry(width, wallHeight, wallThickness);
      const backWall = new THREE.Mesh(backWallGeometry, materials.wall);
      backWall.position.set(x, y + wallHeight/2, z - depth/2);
      backWall.castShadow = true;
      backWall.receiveShadow = true;
      scene.add(backWall);

      // Left wall
      const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, depth);
      const leftWall = new THREE.Mesh(leftWallGeometry, materials.wall);
      leftWall.position.set(x - width/2, y + wallHeight/2, z);
      leftWall.castShadow = true;
      leftWall.receiveShadow = true;
      scene.add(leftWall);

      // Right wall
      const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, depth);
      const rightWall = new THREE.Mesh(rightWallGeometry, materials.wall);
      rightWall.position.set(x + width/2, y + wallHeight/2, z);
      rightWall.castShadow = true;
      rightWall.receiveShadow = true;
      scene.add(rightWall);

      // Add user data to each wall
      [floor, ceiling, frontWall, backWall, leftWall, rightWall].forEach(wall => {
        wall.userData = {
          id: `${type}-${Math.random().toString(36).substr(2, 9)}`,
          type: type,
          layer: 1
        };
      });
    };

    // Create rooms based on buildingData
    const standardRoomHeight = buildingData.building.floor_height || 3000; // Use the height from the configuration file
    const standardRoomWidth = 6000;  // Standard room width
    const standardRoomDepth = 4000;  // Standard room depth
    const corridorWidth = 1500;      // Corridor width
    const wallThickness = buildingData.building.wall_thickness || 150; // 使用配置文件中的墙体厚度

    // Create the living room
    createRoom(
      { x: 0, y: 0, z: 0 },
      { width: standardRoomWidth * 2, depth: standardRoomDepth * 2, height: standardRoomHeight },
      'living-room'
    );

    // Create bedrooms based on the number of bedrooms
    const bedroomCount = buildingData.building.bedrooms || 0;
    if (bedroomCount > 0) {
      // Calculate the bedroom layout
      const bedroomsPerRow = Math.ceil(bedroomCount / 2);
      const totalWidth = (standardRoomWidth * bedroomsPerRow) + 
                        (corridorWidth * (bedroomsPerRow - 1)) + 
                        (wallThickness * bedroomsPerRow);

      // Create the bedrooms
      for (let i = 0; i < bedroomCount; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = (col === 0 ? -totalWidth/2 : totalWidth/2) + 
                 (col === 0 ? standardRoomWidth/2 : -standardRoomWidth/2);
        const z = (row * (standardRoomDepth + corridorWidth + wallThickness)) - 
                 (standardRoomDepth * (bedroomsPerRow - 1) / 2);

        createRoom(
          { x, y: 0, z },
          { width: standardRoomWidth, depth: standardRoomDepth, height: standardRoomHeight },
          'bedroom'
        );
      }
    }
  }, [buildingData]);

  // Listen for changes in buildingData
  useEffect(() => {
    if (buildingData) {
      updateModel(buildingData);
    }
  }, [buildingData]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Initialize the camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      50000
    );
    camera.position.set(15000, 15000, 15000);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Initialize the renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add the ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(10000, 20000, 10000);
    scene.add(directionalLight);

    // Add the grid helper
    const gridHelper = new THREE.GridHelper(30000, 30);
    scene.add(gridHelper);

    // Initialize the controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.mouseButtons = {
      LEFT: null,
      MIDDLE: null,
      RIGHT: THREE.MOUSE.ROTATE
    };
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.panButton = THREE.MOUSE.MIDDLE;
    controlsRef.current = controls;

    // Initialize the transform controls
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setSize(1);
    transformControls.setTranslationSnap(100);
    transformControls.setRotationSnap(THREE.MathUtils.degToRad(15));
    transformControls.setScaleSnap(0.1);
    scene.add(transformControls);
    transformControlsRef.current = transformControls;

    // Load the initial model
    fetch('/building.json')
      .then(response => response.json())
      .then(jsonModel => {
        updateBuildingData(jsonModel);
      })
      .catch(error => console.error('Error loading model:', error));

    // Add the window size change listener
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      // Update the camera
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      // Update the renderer
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controlsRef.current?.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!selectedObjectRef.current || !transformControlsRef.current) return;
      
      switch (event.key.toLowerCase()) {
        case 'g':
          transformControlsRef.current.setMode('translate');
          break;
        case 'r':
          transformControlsRef.current.setMode('rotate');
          break;
        case 's':
          transformControlsRef.current.setMode('scale');
          break;
        case 'escape':
          if (selectedObjectRef.current) {
            selectedObjectRef.current.material.emissive.setHex(0x000000);
            selectedObjectRef.current = null;
            transformControlsRef.current.detach();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      onMouseDown={(e) => {
        if (e.button === 0) { // Left click
          const raycaster = new THREE.Raycaster();
          const mouse = new THREE.Vector2();
          const rect = rendererRef.current.domElement.getBoundingClientRect();
          
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          
          raycaster.setFromCamera(mouse, cameraRef.current);
          const intersects = raycaster.intersectObjects(meshesRef.current);
          
          if (intersects.length > 0) {
            const object = intersects[0].object;
            if (selectedObjectRef.current !== object) {
              if (selectedObjectRef.current) {
                selectedObjectRef.current.material.emissive.setHex(0x000000);
              }
              selectedObjectRef.current = object;
              object.material.emissive.setHex(0x333333);
              transformControlsRef.current.attach(object);
            }
          } else {
            if (selectedObjectRef.current) {
              selectedObjectRef.current.material.emissive.setHex(0x000000);
              selectedObjectRef.current = null;
              transformControlsRef.current.detach();
            }
          }
        }
      }}
    />
  );
};

export default DesignStudio; 