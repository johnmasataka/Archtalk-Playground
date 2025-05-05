import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './ViewCube.css';

function ViewCube() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const cubeRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const animationFrameRef = useRef(null);

  // Initialize the view cube
  useEffect(() => {
    if (!containerRef.current) return;

    // Create the scene
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    sceneRef.current = scene;

    // Create an orthographic camera (to achieve isometric view)
    const aspect = 1;
    const viewSize = 3;
    const camera = new THREE.OrthographicCamera(
      -viewSize * aspect / 2,
      viewSize * aspect / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      1000
    );
    camera.position.set(2.5, 2.5, 2.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Set the initial position of the cube to match the isometric view
    const initialOrientation = () => {
      if (cubeRef.current) {
        cubeRef.current.rotation.set(
          Math.PI / 6,  // X-axis rotation
          -Math.PI / 4, // Y-axis rotation
          0             // Z-axis rotation
        );
      }
    };

    // Create the renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
    });
    renderer.setSize(80, 80); // Set a fixed size
    renderer.setClearColor(0x000000, 0); // Transparent background
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Handle window size changes, keep the renderer size
    const handleResize = () => {
      if (containerRef.current && rendererRef.current) {
        rendererRef.current.setSize(80, 80, false);
      }
    };
    window.addEventListener('resize', handleResize);

    // Create the controller
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false; // Disable zoom
    controls.enablePan = false; // Disable panning
    controls.rotateSpeed = 0.5; // Reduce rotation speed
    controls.autoRotate = false; // Auto-rotate
    controls.minPolarAngle = Math.PI / 6; // Limit vertical rotation
    controls.maxPolarAngle = Math.PI / 1.5;
    controlsRef.current = controls;

    // Create the cube material
    const materials = [
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false }), // Right - Light gray
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false }), // Left - Light gray
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false }), // Top - Light gray
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false }), // Bottom - Light gray
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false }), // Front - Light gray
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.6, depthWrite: false })  // Back - Light gray
    ];

    // Create the cube geometry
    const geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
    cubeRef.current = cube;
    
    // Add edge lines
    const edges = new THREE.EdgesGeometry(geometry, 1); // Threshold of 1, only show sharp edges
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x777777,    // Medium gray
      linewidth: 1,       // Set to standard line width
      transparent: false, // Not transparent
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    wireframe.renderOrder = 1; // Ensure lines are rendered after the cube faces
    cube.add(wireframe);
    
    // Add face labels to the cube
    const labelContainer = new THREE.Group();
    cube.add(labelContainer);
    
    // Add the function to add face labels to the cube, add labels to the label container
    addFaceLabels(labelContainer);

    // Set the initial direction of the cube to the standard isometric view
    cube.rotation.set(
      Math.PI / 6,  // X-axis rotation
      -Math.PI / 4, // Y-axis rotation
      0             // Z-axis rotation
    );

    // Set the camera position to match the isometric view
    camera.position.set(2.2, 2.2, 2.2);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix(); // Ensure the projection matrix is updated
    controls.update();

    // Add the coordinate axis helper
    const axesHelper = new THREE.AxesHelper(1.2);
    scene.add(axesHelper);

    // Add the ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Add the directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 2, 3);
    scene.add(directionalLight);

    // Render loop
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Add the click event
    const handleClick = (event) => {
      if (!cubeRef.current || !raycasterRef.current || !cameraRef.current) {
        console.warn('ViewCube: Required references not available');
        return;
      }
      
      try {
        // Calculate the position of the mouse on the canvas
        const rect = rendererRef.current.domElement.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
        // Set the ray
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
  
        // Get the cube and all its child objects
        const allObjects = [];
        cubeRef.current.traverse(object => {
          if (object.isMesh) {
            allObjects.push(object);
          }
        });
        
        // Calculate the intersection point with all objects
        const intersects = raycasterRef.current.intersectObjects(allObjects);
        
        if (intersects.length > 0) {
          // Find the first intersection point with the cube body
          let cubeIntersect = null;
          for (const intersect of intersects) {
            // Check if it is the cube body (not the label or border)
            if (intersect.object === cubeRef.current) {
              cubeIntersect = intersect;
              break;
            }
          }
          
          // If there is no direct intersection with the cube, take the first intersection point
          const intersect = cubeIntersect || intersects[0];
          
          // Determine the face index based on the click position
          const localPoint = new THREE.Vector3().copy(intersect.point);
          cubeRef.current.worldToLocal(localPoint);
          
          // Find the nearest face - calculate the distance to each face
          const faces = [
            { axis: 'x', direction: 1, index: 0 },  // Right (+X)
            { axis: 'x', direction: -1, index: 1 }, // Left (-X)
            { axis: 'y', direction: 1, index: 2 },  // Top (+Y)
            { axis: 'y', direction: -1, index: 3 }, // Bottom (-Y)
            { axis: 'z', direction: 1, index: 4 },  // Front (+Z)
            { axis: 'z', direction: -1, index: 5 }  // Back (-Z)
          ];
          
          // The half size of the cube
          const halfSize = 0.9; // Use the size of 1.8, half size is 0.9
          
          // Calculate the distance to each face
          const distances = faces.map(face => {
            const coordinate = localPoint[face.axis];
            const facePosition = face.direction * halfSize;
            return {
              index: face.index,
              distance: Math.abs(coordinate - facePosition)
            };
          });
          
          // Sort to find the nearest face
          distances.sort((a, b) => a.distance - b.distance);
          const faceIndex = distances[0].index;
          
          console.log(`Clicked position: (${localPoint.x.toFixed(2)}, ${localPoint.y.toFixed(2)}, ${localPoint.z.toFixed(2)}), Face: ${faceIndex}`);
          
          // Switch the camera view
          changeCameraView(faceIndex);
        }
      } catch (error) {
        console.error('ViewCube: Error in click handler:', error);
      }
    };

    rendererRef.current.domElement.addEventListener('click', handleClick);

    // Listen for changes in the main scene view, set the initial direction of the cube
    const handleMainViewChange = (event) => {
      const mode = event.detail.mode;
      
      if (mode === 'isometric') {
        // Set the cube rotation to the fixed isometric view angle
        if (cubeRef.current) {
          cubeRef.current.rotation.set(
            Math.PI / 6,  // X-axis rotation
            -Math.PI / 4, // Y-axis rotation
            0             // Z-axis rotation
          );
          controlsRef.current.update();
        }
      }
    };

    window.addEventListener('changeViewMode', handleMainViewChange);

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && rendererRef.current.domElement) {
        try {
          rendererRef.current.domElement.removeEventListener('click', handleClick);
        } catch (error) {
          console.warn('ViewCube: Error removing click listener:', error);
        }
        if (containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('changeViewMode', handleMainViewChange);
      if (geometry) geometry.dispose();
      if (materials && Array.isArray(materials)) {
        materials.forEach(material => {
          if (material) material.dispose();
        });
      }
    };
  }, []);

  // Add labels to each face
  const addFaceLabels = (container) => {
    const targetContainer = container || cubeRef.current;
    if (!targetContainer) return;
    
    const faces = [
      { text: "Right", color: "#333333", position: [0.9, 0, 0], rotation: [0, Math.PI/2, 0], size: 1.5 },
      { text: "Left", color: "#333333", position: [-0.9, 0, 0], rotation: [0, -Math.PI/2, 0], size: 1.5 },
      { text: "Top", color: "#333333", position: [0, 0.9, 0], rotation: [-Math.PI/2, 0, 0], size: 1.5 },
      { text: "Bottom", color: "#333333", position: [0, -0.9, 0], rotation: [Math.PI/2, 0, 0], size: 1.5 },
      { text: "Front", color: "#333333", position: [0, 0, 0.9], rotation: [0, 0, 0], size: 1.5 },
      { text: "Back", color: "#333333", position: [0, 0, -0.9], rotation: [0, Math.PI, 0], size: 1.5 }
    ];

    faces.forEach(face => {
      // Create a canvas to draw text
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      
      // Clear the canvas - transparent background
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set the text
      context.fillStyle = face.color;
      context.font = 'bold 80px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(face.text, canvas.width/2, canvas.height/2);
      
      // Create a texture
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      // Create a material
      const material = new THREE.MeshBasicMaterial({
        map: texture, 
        transparent: true,
        renderOrder: 2 // Ensure it is rendered after the lines
      });
      
      // Create a geometry
      const geometry = new THREE.PlaneGeometry(face.size, face.size);
      const plane = new THREE.Mesh(geometry, material);
      plane.renderOrder = 2; // Ensure it is rendered after the lines
      
      // Set the position and rotation
      plane.position.set(...face.position);
      plane.rotation.set(...face.rotation);
      
      // Add to the specified container
      targetContainer.add(plane);
    });
  };

  // Switch the camera view based on the clicked face
  const changeCameraView = (faceIndex) => {
    if (!window.camera || !window.camera.active || !window.orbitControls) return;
    
    let viewName = '';
    let position = new THREE.Vector3();
    let lookAt = new THREE.Vector3(0, 0, 0);
    let upVector = new THREE.Vector3(0, 1, 0); // Default Y-axis up
    const cameraDistance = 20; // Keep consistent camera distance
    
    // Determine which face was clicked, set the corresponding view
    switch (faceIndex) {
      case 0: // Right (+X)
        viewName = 'right';
        position.set(cameraDistance, 0, 0);
        break;
      case 1: // Left (-X)
        viewName = 'left';
        position.set(-cameraDistance, 0, 0);
        break;
      case 2: // Top (+Y)
        viewName = 'top';
        position.set(0, cameraDistance, 0);
        upVector.set(0, 0, -1); // Adjust the up vector to negative Z-axis
        break;
      case 3: // Bottom (-Y)
        viewName = 'bottom';
        position.set(0, -cameraDistance, 0);
        upVector.set(0, 0, 1); // Adjust the up vector to positive Z-axis
        break;
      case 4: // Front (+Z)
        viewName = 'front';
        position.set(0, 0, cameraDistance);
        break;
      case 5: // Back (-Z)
        viewName = 'back';
        position.set(0, 0, -cameraDistance);
        break;
      default:
        return;
    }
    
    console.log(`Switch to ${viewName} view`);
    
    // Get the current camera
    const camera = window.camera.active;
    const controls = window.orbitControls;
    
    // Disable the controller to prevent user interference with the animation
    controls.enabled = false;
    
    // Animate to the target position
    const startPosition = camera.position.clone();
    const startQuaternion = camera.quaternion.clone();
    const endQuaternion = new THREE.Quaternion();
    
    // Create a temporary camera to calculate the target direction
    const tempCamera = camera.clone();
    tempCamera.position.copy(position);
    tempCamera.up.copy(upVector); // Ensure the up vector is set before lookAt
    tempCamera.lookAt(lookAt);
    endQuaternion.copy(tempCamera.quaternion);
    
    // Interpolation animation time
    const duration = 500; // Milliseconds
    const startTime = Date.now();
    
    function animateCamera() {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Use the easing function to make the animation smoother
      const easeOutCubic = function(t) {
        return 1 - Math.pow(1 - t, 3);
      };
      
      const easedT = easeOutCubic(t);
      
      // Interpolate position and rotation
      camera.position.lerpVectors(startPosition, position, easedT);
      camera.quaternion.slerpQuaternions(startQuaternion, endQuaternion, easedT);
      
      // Update the camera's up vector
      camera.up.copy(upVector);
      
      // Update the target of the orbit controller
      controls.target.copy(lookAt);
      controls.update();
      
      // Continue the animation or complete
      if (t < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        // After the animation is complete, re-enable the controller
        controls.enabled = true;
        // Ensure the final camera up vector is set correctly
        camera.up.copy(upVector);
        controls.update();
      }
    }
    
    // Start the animation
    animateCamera();
  };

  return (
    <div ref={containerRef} className="view-cube-container">
      {/* The renderer will add the Three.js canvas here */}
    </div>
  );
}

export default ViewCube; 