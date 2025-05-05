import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import useStore from '../store';
import ClippingPlane from './ClippingPlane';
import ObjectTransformer from './ObjectTransformer';

const BuildingModel = () => {
    const containerRef = useRef();
    const sceneRef = useRef();
    const cameraRef = useRef();
    const rendererRef = useRef();
    const controlsRef = useRef();
    const animationFrameRef = useRef();
    const roomLabelsRef = useRef([]);  // References used to store room labels
    const wireframeRef = useRef([]);   // Reference for storing all contour lines
    const gridHelperRef = useRef();    // Reference for storing grid helper
    const [isLoading, setIsLoading] = useState(true);
    const [selectedObject, setSelectedObject] = useState(null);
    const [isOutlineVisible, setIsOutlineVisible] = useState(true); // Default display contour lines
    const [stats, setStats] = useState({
        totalArea: 0,
        totalFloors: 0,
        totalRooms: 0,
        totalWalls: 0,
        totalWindows: 0,
        totalDoors: 0
    });
    
    // 从 store 获取建筑数据
    const buildingData = useStore(state => state.buildingData);

    // Initialize the scene
    useEffect(() => {
        if (!containerRef.current) return;

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf0f0f0);
            sceneRef.current = scene;
            
            window.scene = scene;

            // Create the camera
            const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50000);
            camera.position.set(20, 0, 20);
            camera.lookAt(0, 0, 0);
            cameraRef.current = camera;

            // Create orthogonal cameras (for equirectangular views)
            const aspect = window.innerWidth / window.innerHeight;
            const frustumSize = 30; 
            const orthographicCamera = new THREE.OrthographicCamera(
                -frustumSize * aspect / 2,
                frustumSize * aspect / 2,
                frustumSize / 2,
                -frustumSize / 2,
                0.1,
                1000
            );
            // Set to typical equirectangular view position
            orthographicCamera.position.set(15, 15, 15);
            orthographicCamera.lookAt(0, 0, 0);
            orthographicCamera.updateProjectionMatrix();

            // Save references to both cameras
            cameraRef.current = {
                perspective: camera,
                orthographic: orthographicCamera,
                active: camera  
            };

            // Create renderer
            const renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                powerPreference: "high-performance"
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // Enable local clipping
            renderer.localClippingEnabled = true;
            containerRef.current.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            // Create controller - use active camera (perspective)
            const controls = new OrbitControls(cameraRef.current.active, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 5;
            controls.maxDistance = 100;  // Increase maximum distance
            controls.target.set(0, 0, 0);
            
            // Add controller change listener to update ViewCube
            controls.addEventListener('change', () => {
                // Broadcast camera change event
                window.dispatchEvent(new CustomEvent('cameraChange', {
                    detail: {
                        camera: cameraRef.current.active
                    }
                }));
            });
            
            // Listen for Room label display/hide event
            const handleToggleRoomLabels = (e) => {
                const { visible } = e.detail;
                // Iterate through all room labels and set visibility
                if (roomLabelsRef.current) {
                    roomLabelsRef.current.forEach(label => {
                        if (label) {
                            label.visible = visible;
                        }
                    });
                }
            };
            
            window.addEventListener('toggleRoomLabels', handleToggleRoomLabels);
            
            // Listen for object contour display/hide event
            const handleToggleOutlines = (e) => {
                const { visible } = e.detail;
                // Update component state
                setIsOutlineVisible(visible);
                // Iterate through all contour lines and set visibility
                if (wireframeRef.current) {
                    wireframeRef.current.forEach(wireframe => {
                        if (wireframe) {
                            wireframe.visible = visible;
                        }
                    });
                }
            };
            
            window.addEventListener('toggleOutlines', handleToggleOutlines);
            
            // Set mouse button mapping
            controls.mouseButtons = {
                LEFT: null,  // Disable left button
                MIDDLE: THREE.MOUSE.PAN,  // Middle button pan
                RIGHT: THREE.MOUSE.ROTATE  // Right button rotate
            };
            
            // Enable panning and zooming
            controls.enablePan = true;
            controls.enableZoom = true;
            controls.zoomSpeed = 2.0;
            controls.rotateSpeed = 0.5;
            controls.panSpeed = 1.0;  // Add panning speed
            
            // 添加 shift 键检测
            const handleKeyDown = (event) => {
                if (event.shiftKey) {
                    controls.mouseButtons = {
                        LEFT: null,
                        MIDDLE: THREE.MOUSE.PAN,
                        RIGHT: THREE.MOUSE.PAN  // shift + 右键平移
                    };
                }
            };
            
            const handleKeyUp = (event) => {
                if (!event.shiftKey) {
                    controls.mouseButtons = {
                        LEFT: null,
                        MIDDLE: THREE.MOUSE.PAN,
                        RIGHT: THREE.MOUSE.ROTATE  
                    };
                }
            };
            
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            
            controlsRef.current = controls;

            // Add ambient and parallel light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(10, 10, 10);
            directionalLight.castShadow = true;
            
            // Adjust shadow map size and properties to improve shadow quality
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 50;
            directionalLight.shadow.camera.left = -20;
            directionalLight.shadow.camera.right = 20;
            directionalLight.shadow.camera.top = 20;
            directionalLight.shadow.camera.bottom = -20;
            directionalLight.shadow.bias = -0.001; // 减少阴影伪影
            
            scene.add(directionalLight);
            
            // Add second directional light from different angle to reduce shadow artifacts
            const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.5);
            secondaryLight.position.set(-10, 5, -10);
            scene.add(secondaryLight);

            // Add grid
            const gridHelper = new THREE.GridHelper(50, 50);
            scene.add(gridHelper);
            gridHelperRef.current = gridHelper;
            
            // Listen for grid display/hide event
            const handleToggleGridMesh = (e) => {
                const { visible } = e.detail;
                if (gridHelperRef.current) {
                    gridHelperRef.current.visible = visible;
                }
            };
            
            window.addEventListener('toggleGridMesh', handleToggleGridMesh);

            // Animated Loop
            const animate = () => {
                animationFrameRef.current = requestAnimationFrame(animate);
                controls.update();
                // Use active camera for rendering
                renderer.render(scene, cameraRef.current.active);
            };

            animate();

            // Add event listeners
            window.addEventListener('createGeometry', handleCreateGeometry);
            containerRef.current.addEventListener('drop', handleDrop);
            containerRef.current.addEventListener('dragover', handleDragOver);

            // Cleanup function
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
                window.removeEventListener('toggleRoomLabels', handleToggleRoomLabels);
                window.removeEventListener('toggleOutlines', handleToggleOutlines);
                window.removeEventListener('toggleGridMesh', handleToggleGridMesh);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                if (containerRef.current && renderer.domElement) {
                    containerRef.current.removeChild(renderer.domElement);
                }
                // Clear global scene reference
                window.scene = null;
                renderer.dispose();
                window.removeEventListener('createGeometry', handleCreateGeometry);
                containerRef.current.removeEventListener('drop', handleDrop);
                containerRef.current.removeEventListener('dragover', handleDragOver);
            };
    }, []);

    // Load and render JSON data - initial load
    useEffect(() => {
        if (!sceneRef.current || !isLoading) return;

        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const controls = controlsRef.current;

        // Create materials
        const wallMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc,
            side: THREE.DoubleSide
        });
        
        const floorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x999999,
            side: THREE.DoubleSide
        });
        
        const windowMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x88ccff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        const doorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8b4513,
            side: THREE.DoubleSide
        });
        
        if (buildingData) {
            console.log('Rendering building data from store');
            
            // Render JSON data
            renderJsonModel(buildingData, scene, wallMaterial, floorMaterial, windowMaterial, doorMaterial);
            
            // Calculate model bounding box
            const boundingBox = new THREE.Box3().setFromObject(scene);
            const center = boundingBox.getCenter(new THREE.Vector3());
            const size = boundingBox.getSize(new THREE.Vector3());
            
            // Adjust camera position to fit model (only on initial load)
            if (isLoading) {
                const maxDim = Math.max(size.x, size.y, size.z);
                // Use perspective camera for calculation
                const perspCamera = cameraRef.current.perspective;
                const fov = perspCamera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
                
                // Set initial camera position
                perspCamera.position.set(20, 5, 20);
                perspCamera.lookAt(center);
                controls.target.copy(center);
            }
            controls.update();
            
            setIsLoading(false);
        } else {
            // If no building data is available, try loading directly from a file
            console.log('Loading JSON file directly...');
            fetch('/hs.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('JSON model loaded successfully', data);
                    
                    // Render JSON data
                    renderJsonModel(data, scene, wallMaterial, floorMaterial, windowMaterial, doorMaterial);
                    
                    // Calculate model bounding box
                    const boundingBox = new THREE.Box3().setFromObject(scene);
                    const center = boundingBox.getCenter(new THREE.Vector3());
                    const size = boundingBox.getSize(new THREE.Vector3());
                    
                    // Adjust camera position to fit model (only on initial load)
                    if (isLoading) {
                        const maxDim = Math.max(size.x, size.y, size.z);
                        // Use perspective camera for calculation
                        const perspCamera = cameraRef.current.perspective;
                        const fov = perspCamera.fov * (Math.PI / 180);
                        let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
                        
                        // Set initial camera position
                        perspCamera.position.set(20, 0, 20);
                        perspCamera.lookAt(center);
                        controls.target.copy(center);
                    }
                    controls.update();
                    
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Error loading JSON model:', error);
                    setIsLoading(false);
                });
        }
    }, [isLoading, buildingData]);

    // Listen for buildingData changes, re-render model
    useEffect(() => {
        if (!sceneRef.current || isLoading) return;
        
        console.log('Building data changed, re-rendering model');
        
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        
        // Clear all objects in current scene (keep lights and grid)
        const objectsToRemove = [];
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh && !(object instanceof THREE.GridHelper)) {
                objectsToRemove.push(object);
            }
            // Clear all THREE.Sprite objects (labels)
            if (object instanceof THREE.Sprite) {
                objectsToRemove.push(object);
            }
        });
        
        objectsToRemove.forEach(object => {
            scene.remove(object);
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        // Clear label reference arrays and wireframe reference arrays
        roomLabelsRef.current = [];
        wireframeRef.current = [];
        
        // Create materials
        const wallMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc,
            side: THREE.DoubleSide
        });
        
        const floorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x999999,
            side: THREE.DoubleSide
        });
        
        const windowMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x88ccff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        const doorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8b4513,
            side: THREE.DoubleSide
        });
        
        // Render new JSON data
        renderJsonModel(buildingData, scene, wallMaterial, floorMaterial, windowMaterial, doorMaterial);
        
        // Calculate model bounding box
        const boundingBox = new THREE.Box3().setFromObject(scene);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        
        // Adjust camera position to fit model (only on initial load)
        if (isLoading) {
            const maxDim = Math.max(size.x, size.y, size.z);
            // Use perspective camera for calculation
            const perspCamera = cameraRef.current.perspective;
            const fov = perspCamera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
            
            // Set initial camera position
            perspCamera.position.set(20, 0, 20);
            perspCamera.lookAt(center);
            controls.target.copy(center);
        }
        controls.update();
        
    }, [buildingData, isLoading]);

    // Render JSON model
    const renderJsonModel = (data, scene, wallMaterial, floorMaterial, windowMaterial, doorMaterial) => {
        // Before rendering new model, clear all existing labels
        const labelsToRemove = [];
        scene.traverse((object) => {
            if (object instanceof THREE.Sprite) {
                labelsToRemove.push(object);
            }
        });
        
        labelsToRemove.forEach(label => {
            scene.remove(label);
            if (label.material) {
                if (label.material.map) {
                    label.material.map.dispose();
                }
                label.material.dispose();
            }
        });
        
        // Clear label reference arrays and wireframe reference arrays
        roomLabelsRef.current = [];
        wireframeRef.current = [];
        
        // Counter
        let wallCount = 0;
        let floorCount = 0;
        let windowCount = 0;
        let doorCount = 0;
        let roomCount = 0;
        let totalArea = 0;
        
        // Check if data is valid
        if (!data || !data.building) {
            console.error('Invalid JSON data structure');
            return;
        }
        
        const building = data.building;
        
        // Render floors
        if (building.floors && Array.isArray(building.floors)) {
            floorCount = building.floors.length;
            
            // Find highest floor
            const highestFloor = building.floors.reduce((highest, floor) => {
                return (floor.level || 0) > (highest.level || 0) ? floor : highest;
            }, building.floors[0]);
            
            // Move roof properties to highest floor
            if (building.roof) {
                highestFloor.roof = building.roof;
            }
            
            building.floors.forEach((floor, floorIndex) => {
                const floorHeight = (floor.height || 3000) / 1000; // Default floor height is 3000 mm
                const floorLevel = floor.level || floorIndex; // Default floor level is index
                
                // Get floor material
                const floorMaterialColor = floor.material?.color ? parseInt(floor.material.color.replace('#', '0x')) : 0x999999;
                const floorMaterialProps = floor.material || {};
                const customFloorMaterial = new THREE.MeshPhongMaterial({ 
                    color: floorMaterialColor,
                    side: THREE.DoubleSide
                });
                
                // Render rooms
                if (floor.rooms && Array.isArray(floor.rooms)) {
                    roomCount += floor.rooms.length;
                    
                    floor.rooms.forEach((room, roomIndex) => {
                        // Render room floor (based on footprint)
                        if (room.footprint && Array.isArray(room.footprint) && room.footprint.length >= 4) {
                            // Calculate room width and depth
                            const minX = Math.min(...room.footprint.map(point => point[0]));
                            const maxX = Math.max(...room.footprint.map(point => point[0]));
                            const minY = Math.min(...room.footprint.map(point => point[1]));
                            const maxY = Math.max(...room.footprint.map(point => point[1]));
                            
                            const width = (maxX - minX) / 1000; // Convert to meters
                            const depth = (maxY - minY) / 1000; // Convert to meters
                            const floorThickness = (room.floor?.thickness || 200) / 1000; // Read floor thickness from JSON, default 200 mm
                            
                            // Calculate room center point
                            const centerX = (minX + maxX) / 2000; // Convert to meters
                            const centerY = floorLevel * floorHeight; // Floor height
                            const centerZ = (minY + maxY) / 2000; // Convert to meters
                            
                            // Get room floor material
                            const roomFloorMaterialColor = room.floor?.material?.color ? parseInt(room.floor.material.color.replace('#', '0x')) : floorMaterialColor;
                            const roomFloorMaterialProps = room.floor?.material || {};
                            const roomFloorMaterial = new THREE.MeshPhongMaterial({ 
                                color: roomFloorMaterialColor,
                                side: THREE.DoubleSide,
                                ...roomFloorMaterialProps
                            });
                            
                            // Create floor mesh
                            const floorGeometry = new THREE.BoxGeometry(width, floorThickness, depth);
                            const floorMesh = new THREE.Mesh(floorGeometry, roomFloorMaterial);
                            
                            // Set floor position
                            floorMesh.position.set(centerX, centerY, centerZ);
                            
                            // Add selectable identifier
                            floorMesh.userData.type = 'floor';
                            floorMesh.userData.selectable = true;
                            floorMesh.userData.name = `Floor_${room.name}`;
                            
                            floorMesh.receiveShadow = true;
                            
                            // Add edge lines (outline)
                            const floorEdges = new THREE.EdgesGeometry(floorGeometry, 30);
                            const floorLinesMaterial = new THREE.LineBasicMaterial({ 
                                color: 0x000000,
                                linewidth: 1
                            });
                            const floorWireframe = new THREE.LineSegments(floorEdges, floorLinesMaterial);
                            // Set visibility based on current component state
                            floorWireframe.visible = isOutlineVisible;
                            // Add identifier, indicating this is an outline
                            floorWireframe.userData.isOutline = true;
                            floorWireframe.userData.parentType = 'floor';
                            // Add outline as a child object
                            floorMesh.add(floorWireframe);
                            
                            // Add outline to reference array for visibility control
                            wireframeRef.current.push(floorWireframe);
                            
                            scene.add(floorMesh);
                            
                            // Calculate room area (square meters)
                            totalArea += width * depth;
                            
                            // Add room label - use room name
                            const roomName = room.name || `Room ${roomIndex + 1}`;
                            addLabel(scene, roomName, new THREE.Vector3(centerX, centerY + floorHeight/2, centerZ));
                        }
                        
                        // Render walls
                        if (room.walls && Array.isArray(room.walls)) {
                            wallCount += room.walls.length;
                            
                            room.walls.forEach((wall, wallIndex) => {
                                // Get wall material
                                const wallMaterialColor = wall.material?.color ? parseInt(wall.material.color.replace('#', '0x')) : 0xcccccc;
                                const wallMaterialProps = wall.material || {};
                                const customWallMaterial = new THREE.MeshPhongMaterial({ 
                                    color: wallMaterialColor,
                                    side: THREE.DoubleSide,
                                    transparent: true,
                                    opacity: wallMaterialProps.opacity || 1
                                });
                                
                                // Create wall geometry
                                const wallHeight = floorHeight; // Wall height equals floor height
                                const wallThickness = (wall.thickness || 200) / 1000; // Convert to meters, default thickness 200 mm
                                
                                // Calculate wall length and direction
                                const startX = wall.start[0] / 1000; // Convert to meters
                                const startY = wall.start[1] / 1000; // Convert to meters
                                const endX = wall.end[0] / 1000; // Convert to meters
                                const endY = wall.end[1] / 1000; // Convert to meters
                                
                                const length = Math.sqrt(
                                    Math.pow(endX - startX, 2) + 
                                    Math.pow(endY - startY, 2)
                                );
                                
                                const angle = Math.atan2(endY - startY, endX - startX);
                                
                                // Create wall mesh
                                const wallGeometry = new THREE.BoxGeometry(length, wallHeight, wallThickness);
                                const wallMesh = new THREE.Mesh(wallGeometry, customWallMaterial);
                                
                                // Set wall position and rotation
                                wallMesh.position.set(
                                    (startX + endX) / 2,
                                    floorLevel * floorHeight + wallHeight / 2,
                                    (startY + endY) / 2
                                );
                                wallMesh.rotation.y = angle;
                                
                                // Add selectable identifier
                                wallMesh.userData.type = 'wall';
                                wallMesh.userData.selectable = true;
                                wallMesh.userData.name = `Wall_${wallIndex}_${room.name}`;
                                
                                wallMesh.castShadow = true;
                                wallMesh.receiveShadow = true;
                                
                                // Add edge lines (outline)
                                const wallEdges = new THREE.EdgesGeometry(wallGeometry, 30);
                                const wallLinesMaterial = new THREE.LineBasicMaterial({ 
                                    color: 0x000000,
                                    linewidth: 1
                                });
                                const wallWireframe = new THREE.LineSegments(wallEdges, wallLinesMaterial);
                                // Set visibility based on current component state
                                wallWireframe.visible = isOutlineVisible;
                                // Add identifier, indicating this is an outline
                                wallWireframe.userData.isOutline = true;
                                wallWireframe.userData.parentType = 'wall';
                                wallMesh.add(wallWireframe);
                                
                                // Add outline to reference array for visibility control
                                wireframeRef.current.push(wallWireframe);
                                
                                scene.add(wallMesh);
                                
                                // Render windows (if wall has windows)
                                if (wall.window) {
                                    windowCount++;
                                    
                                    const windowWidth = (wall.window.width || 1000) / 1000; // Convert to meters, default width 1000 mm
                                    const windowHeight = (wall.window.height || 1000) / 1000; // Convert to meters, default height 1000 mm
                                    const windowDepth = (wall.window.depth || 100) / 1000; // Read window depth from JSON, default 100 mm
                                    
                                    // Get window material
                                    const windowMaterialColor = wall.window.material?.color ? parseInt(wall.window.material.color.replace('#', '0x')) : 0x88ccff;
                                    const windowMaterialProps = wall.window.material || {};
                                    const customWindowMaterial = new THREE.MeshPhongMaterial({ 
                                        color: windowMaterialColor,
                                        side: THREE.DoubleSide,
                                        transparent: true,
                                        opacity: windowMaterialProps.opacity || 0.7
                                    });
                                    
                                    // Calculate window position (relative to wall start)
                                    const windowPosition = Math.min((wall.window.position || 0) / 1000, length - windowWidth); // Ensure window does not exceed wall length
                                    const windowVerticalPosition = (wall.window.verticalPosition || 0) / 1000; // Convert to meters
                                    
                                    // Create window mesh
                                    const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
                                    const windowMesh = new THREE.Mesh(windowGeometry, customWindowMaterial);
                                    
                                    // Calculate window position on wall
                                    const windowX = startX + (windowPosition / length) * (endX - startX);
                                    const windowY = floorLevel * floorHeight + windowVerticalPosition + windowHeight / 2;
                                    const windowZ = startY + (windowPosition / length) * (endY - startY);
                                    
                                    // Set window position and rotation
                                    windowMesh.position.set(windowX, windowY, windowZ);
                                    windowMesh.rotation.y = angle;
                                    
                                    // Add selectable identifier
                                    windowMesh.userData.type = 'window';
                                    windowMesh.userData.selectable = true;
                                    windowMesh.userData.name = `Window_${wallIndex}_${room.name}`;
                                    
                                    windowMesh.castShadow = true;
                                    windowMesh.receiveShadow = true;
                                    
                                    // Add edge lines (outline)
                                    const windowEdges = new THREE.EdgesGeometry(windowGeometry, 30);
                                    const windowLinesMaterial = new THREE.LineBasicMaterial({ 
                                        color: 0x000000,
                                        linewidth: 1
                                    });
                                    const windowWireframe = new THREE.LineSegments(windowEdges, windowLinesMaterial);
                                    // Set visibility based on current component state
                                    windowWireframe.visible = isOutlineVisible;
                                    // Add identifier, indicating this is an outline
                                    windowWireframe.userData.isOutline = true;
                                    windowWireframe.userData.parentType = 'window';
                                    windowMesh.add(windowWireframe);
                                    
                                    // Add outline to reference array for visibility control
                                    wireframeRef.current.push(windowWireframe);
                                    
                                    scene.add(windowMesh);
                                    
                                    // Add debug information
                                    console.log(`Rendering window at position (${windowX}, ${windowY}, ${windowZ}) with dimensions ${windowWidth}x${windowHeight}x${windowDepth}`);
                                }
                                
                                // Render other windows (like window2, window3, etc.)
                                Object.keys(wall).forEach(key => {
                                    if (key.startsWith('window') && key !== 'window') {
                                        windowCount++;
                                        const windowData = wall[key];
                                        
                                        const windowWidth = (windowData.width || 1000) / 1000; // Convert to meters, default width 1000 mm
                                        const windowHeight = (windowData.height || 1000) / 1000; // Convert to meters, default width 1000 mm
                                        const windowDepth = (windowData.depth || 100) / 1000; // Read window depth from JSON, default 100 mm
                                        
                                        // Get window material
                                        const windowMaterialColor = windowData.material?.color ? parseInt(windowData.material.color.replace('#', '0x')) : 0x88ccff;
                                        const windowMaterialProps = windowData.material || {};
                                        const customWindowMaterial = new THREE.MeshPhongMaterial({ 
                                            color: windowMaterialColor,
                                            side: THREE.DoubleSide,
                                            transparent: true,
                                            opacity: windowMaterialProps.opacity || 0.7
                                        });
                                        
                                        // Calculate window position (relative to wall start)
                                        const windowPosition = Math.min((windowData.position || 0) / 1000, length - windowWidth); // Ensure window does not exceed wall length
                                        const windowVerticalPosition = (windowData.verticalPosition || 0) / 1000; // Convert to meters
                                        
                                        // Create window mesh
                                        const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
                                        const windowMesh = new THREE.Mesh(windowGeometry, customWindowMaterial);
                                        
                                        // Calculate window position on wall
                                        const windowX = startX + (windowPosition / length) * (endX - startX);
                                        const windowY = floorLevel * floorHeight + windowVerticalPosition + windowHeight / 2;
                                        const windowZ = startY + (windowPosition / length) * (endY - startY);
                                        
                                        // Set window position and rotation
                                        windowMesh.position.set(windowX, windowY, windowZ);
                                        windowMesh.rotation.y = angle;
                                        
                                        // Add selectable identifier
                                        windowMesh.userData.type = 'window';
                                        windowMesh.userData.selectable = true;
                                        windowMesh.userData.name = `Window_${wallIndex}_${room.name}`;
                                        
                                        windowMesh.castShadow = true;
                                        windowMesh.receiveShadow = true;
                                        
                                        // Add edge lines (outline)
                                        const windowEdges = new THREE.EdgesGeometry(windowGeometry, 30);
                                        const windowLinesMaterial = new THREE.LineBasicMaterial({ 
                                            color: 0x000000,
                                            linewidth: 1
                                        });
                                        const windowWireframe = new THREE.LineSegments(windowEdges, windowLinesMaterial);
                                        // Set visibility based on current component state
                                        windowWireframe.visible = isOutlineVisible;
                                        // Add identifier, indicating this is an outline
                                        windowWireframe.userData.isOutline = true;
                                        windowWireframe.userData.parentType = 'window';
                                        windowMesh.add(windowWireframe);
                                        
                                        // Add outline to reference array for visibility control
                                        wireframeRef.current.push(windowWireframe);
                                        
                                        scene.add(windowMesh);
                                        
                                        // Add debug information
                                        console.log(`Rendering ${key} at position (${windowX}, ${windowY}, ${windowZ}) with dimensions ${windowWidth}x${windowHeight}x${windowDepth}`);
                                    }
                                });
                                
                                // Render door (if wall has door)
                                if (wall.door) {
                                    doorCount++;
                                    
                                    const doorWidth = (wall.door.width || 1000) / 1000; // Convert to meters, default width 1000 mm
                                    const doorHeight = (wall.door.height || 2000) / 1000; // Convert to meters, default height 2000 mm
                                    const doorDepth = (wall.door.depth || 100) / 1000; // Read door depth from JSON, default 100 mm
                                    
                                    // Get door material
                                    const doorMaterialColor = wall.door.material?.color ? parseInt(wall.door.material.color.replace('#', '0x')) : 0x8b4513;
                                    const doorMaterialProps = wall.door.material || {};
                                    const customDoorMaterial = new THREE.MeshPhongMaterial({ 
                                        color: doorMaterialColor,
                                        side: THREE.DoubleSide,
                                        transparent: true,
                                        opacity: doorMaterialProps.opacity || 0.75
                                    });
                                    
                                    // Calculate door position (relative to wall start)
                                    const doorPosition = (wall.door.position || 0) / 1000; // Convert to meters
                                    
                                    // Create door mesh
                                    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
                                    const doorMesh = new THREE.Mesh(doorGeometry, customDoorMaterial);
                                    
                                    // Calculate door position on wall
                                    const doorX = startX + (doorPosition / length) * (endX - startX);
                                    const doorY = floorLevel * floorHeight + doorHeight / 2;
                                    const doorZ = startY + (doorPosition / length) * (endY - startY);
                                    
                                    // Set door position and rotation
                                    doorMesh.position.set(doorX, doorY, doorZ);
                                    doorMesh.rotation.y = angle;
                                    
                                    // Add selectable identifier
                                    doorMesh.userData.type = 'door';
                                    doorMesh.userData.selectable = true;
                                    doorMesh.userData.name = `Door_${wallIndex}_${room.name}`;
                                    
                                    doorMesh.castShadow = true;
                                    doorMesh.receiveShadow = true;
                                    
                                    // Add edge lines (outline)
                                    const doorEdges = new THREE.EdgesGeometry(doorGeometry, 30);
                                    const doorLinesMaterial = new THREE.LineBasicMaterial({ 
                                        color: 0x000000,
                                        linewidth: 1
                                    });
                                    const doorWireframe = new THREE.LineSegments(doorEdges, doorLinesMaterial);
                                    // Set visibility based on current component state
                                    doorWireframe.visible = isOutlineVisible;
                                    // Add identifier, indicating this is an outline
                                    doorWireframe.userData.isOutline = true;
                                    doorWireframe.userData.parentType = 'door';
                                    doorMesh.add(doorWireframe);
                                    
                                    // Add outline to reference array for visibility control
                                    wireframeRef.current.push(doorWireframe);
                                    
                                    scene.add(doorMesh);
                                }
                            });
                        }
                    });

                    // Render floor roof (if floor has roof)
                    if (floor.roof) {
                        const roof = floor.roof;
                        const roofType = roof.type || 'gabled'; // Roof type
                        
                        // Calculate the boundary of the entire floor
                        const floorFootprint = floor.rooms.reduce((acc, room) => {
                            if (room.footprint && Array.isArray(room.footprint)) {
                                acc.push(...room.footprint);
                            }
                            return acc;
                        }, []);
                        
                        if (floorFootprint.length > 0) {
                            const minX = Math.min(...floorFootprint.map(point => point[0]));
                            const maxX = Math.max(...floorFootprint.map(point => point[0]));
                            const minY = Math.min(...floorFootprint.map(point => point[1]));
                            const maxY = Math.max(...floorFootprint.map(point => point[1]));
                            
                            const centerX = (minX + maxX) / 2000; // Convert to meters
                            const centerY = floorLevel * floorHeight; // Floor height
                            const centerZ = (minY + maxY) / 2000; // Convert to meters
                            
                            // Select different rendering components based on roof type
                            switch (roofType) {
                                case 'gabled':
                                    renderGabledRoof(scene, floor, floor, centerX, centerY, centerZ, floorHeight);
                                    break;
                                case 'flat':
                                    renderFlatRoof(scene, floor, floor, centerX, centerY, centerZ, floorHeight);
                                    break;
                                case 'pitched':
                                    renderPitchedRoof(scene, floor, floor, centerX, centerY, centerZ, floorHeight);
                                    break;
                                default:
                                    // Default to gabled roof
                                    renderGabledRoof(scene, floor, floor, centerX, centerY, centerZ, floorHeight);
                            }
                        }
                    }
                }
            });
        }
        
        // Update statistics
        setStats({
            totalArea: Math.round(totalArea),
            totalFloors: floorCount,
            totalRooms: roomCount,
            totalWalls: wallCount,
            totalWindows: windowCount,
            totalDoors: doorCount
        });
    };
    
    // Render gabled roof component
    const renderGabledRoof = (scene, room, floor, centerX, centerY, centerZ, floorHeight) => {
        // Get roof property from floor
        const roof = floor.roof;
        
        // Check if roof object exists, use default values for other properties
        if (!roof) {
            console.error('Missing roof object in JSON data');
            return;
        }
        
        // Use default values if properties are missing
        const roofHeight = (roof.height || 1000) / 1000; // Default height 1000 mm
        const roofOverhang = (roof.overhang || 300) / 1000; // Default overhang 300 mm
        const roofPitch = roof.pitch || 30; // Default pitch 30 degrees
        
        // Get roof material
        const roofMaterialColor = roof.material?.color ? parseInt(roof.material.color.replace('#', '0x')) : 0x8b4513;
        const roofMaterialProps = roof.material || {};
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            color: roofMaterialColor,
            side: THREE.DoubleSide,
            flatShading: true,
            transparent: true,
            opacity: roofMaterialProps.opacity || 0.75
        });
        
        // Use room's footprint to calculate roof size
        // Check if room is a room object (has footprint property) or floor object
        let footprint;
        if (room.footprint && Array.isArray(room.footprint)) {
            // If room is a room object, use its footprint directly
            footprint = room.footprint;
        } else if (room.rooms && Array.isArray(room.rooms)) {
            // If room is a floor object, collect all room's footprint points
            footprint = room.rooms.reduce((acc, r) => {
                if (r.footprint && Array.isArray(r.footprint)) {
                    acc.push(...r.footprint);
                }
                return acc;
            }, []);
        } else {
            console.error('Invalid room or floor object for roof rendering');
            return;
        }
        
        const minX = Math.min(...footprint.map(point => point[0]));
        const maxX = Math.max(...footprint.map(point => point[0]));
        const minY = Math.min(...footprint.map(point => point[1]));
        const maxY = Math.max(...footprint.map(point => point[1]));
        
        const width = (maxX - minX) / 1000; // Convert to meters
        const depth = (maxY - minY) / 1000; // Convert to meters
        
        // Calculate roof width and depth (including overhang)
        const roofWidth = width + (2 * roofOverhang);
        const roofDepth = depth + (2 * roofOverhang);
        
        // Create gabled roof - using two quadrilateral faces
        // Calculate roof height based on roof pitch
        const pitchRadians = (roofPitch * Math.PI) / 180;
        // Use roof pitch to calculate roof height, the steeper the pitch, the higher the height
        const roofHeightAtCenter = roofHeight * Math.tan(pitchRadians) + roofHeight;
        
        // Front quadrilateral
        const frontGeometry = new THREE.BufferGeometry();
        const frontVertices = new Float32Array([
            -roofWidth/2, 0, -roofDepth/2,           // Left bottom
            roofWidth/2, 0, -roofDepth/2,            // Right bottom
            roofWidth/2, 0, roofDepth/2,             // Right top
            -roofWidth/2, 0, roofDepth/2,            // Left top
            0, roofHeightAtCenter, 0                 // Center
        ]);
        
        // 定义面的索引（两个三角形组成一个四边形）
        const frontIndices = new Uint32Array([
            0, 1, 4,  // First triangle
            1, 2, 4,  // Second triangle
            2, 3, 4,  // Third triangle
            3, 0, 4   // Fourth triangle
        ]);
        
        frontGeometry.setAttribute('position', new THREE.BufferAttribute(frontVertices, 3));
        frontGeometry.setIndex(new THREE.BufferAttribute(frontIndices, 1));
        frontGeometry.computeVertexNormals();
        
        const frontRoof = new THREE.Mesh(frontGeometry, roofMaterial);
        frontRoof.position.set(centerX, centerY + floorHeight, centerZ);
        frontRoof.castShadow = true;
        frontRoof.receiveShadow = true;
        
        // Add selectable identifier
        frontRoof.userData.type = 'roof';
        frontRoof.userData.selectable = true;
        frontRoof.userData.name = `Roof_Gabled_Front`;
        
        // Add roof edge lines (outline)
        const roofEdges = new THREE.EdgesGeometry(frontGeometry, 30);
        const roofLinesMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            linewidth: 1
        });
        const roofWireframe = new THREE.LineSegments(roofEdges, roofLinesMaterial);
        // Set visibility based on current component state
        roofWireframe.visible = isOutlineVisible;
        // Add identifier, indicating this is an outline
        roofWireframe.userData.isOutline = true;
        roofWireframe.userData.parentType = 'roof';
        frontRoof.add(roofWireframe);
        
        // Add outline to reference array for visibility control
        wireframeRef.current.push(roofWireframe);
        
        scene.add(frontRoof);
        
        // Back quadrilateral
        const backGeometry = new THREE.BufferGeometry();
        const backVertices = new Float32Array([
            -roofWidth/2, 0, -roofDepth/2,           // Left bottom
            roofWidth/2, 0, -roofDepth/2,            // Right bottom
            roofWidth/2, 0, roofDepth/2,             // Right top
            -roofWidth/2, 0, roofDepth/2,            // Left top
            0, roofHeightAtCenter, 0                 // Center
        ]);
        
        // Define face indices (two triangles make one quadrilateral)
        const backIndices = new Uint32Array([
            0, 4, 1,  // First triangle
            1, 4, 2,  // Second triangle
            2, 4, 3,  // Third triangle
            3, 4, 0   // Fourth triangle
        ]);
        
        backGeometry.setAttribute('position', new THREE.BufferAttribute(backVertices, 3));
        backGeometry.setIndex(new THREE.BufferAttribute(backIndices, 1));
        backGeometry.computeVertexNormals();
        
        const backRoof = new THREE.Mesh(backGeometry, roofMaterial);
        backRoof.position.set(centerX, centerY + floorHeight, centerZ);
        backRoof.castShadow = true;
        backRoof.receiveShadow = true;
        
        // Add selectable identifier
        backRoof.userData.type = 'roof';
        backRoof.userData.selectable = true;
        backRoof.userData.name = `Roof_Gabled_Back`;
        
        // Add back roof edge lines (outline)
        const backRoofEdges = new THREE.EdgesGeometry(backGeometry, 30);
        const backRoofLinesMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            linewidth: 1
        });
        const backRoofWireframe = new THREE.LineSegments(backRoofEdges, backRoofLinesMaterial);
        // Set visibility based on current component state
        backRoofWireframe.visible = isOutlineVisible;
        // Add identifier, indicating this is an outline
        backRoofWireframe.userData.isOutline = true;
        backRoofWireframe.userData.parentType = 'roof';
        backRoof.add(backRoofWireframe);
        
        // Add outline to reference array for visibility control
        wireframeRef.current.push(backRoofWireframe);
        
        scene.add(backRoof);
    };
    
    // Render flat roof component
    const renderFlatRoof = (scene, room, floor, centerX, centerY, centerZ, floorHeight) => {
        // Get roof property from floor
        const roof = floor.roof;
        
        // Check if roof object exists, use default values for other properties
        if (!roof) {
            console.error('Missing roof object in JSON data');
            return;
        }
        
        // Use default values if properties are missing
        const roofThickness = (roof.thickness || 200) / 1000; // Default thickness 200 mm
        const roofOverhang = (roof.overhang || 300) / 1000; // Default overhang 300 mm
        
        // Get roof material
        const roofMaterialColor = roof.material?.color ? parseInt(roof.material.color.replace('#', '0x')) : 0x8b4513;
        const roofMaterialProps = roof.material || {};
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            color: roofMaterialColor,
            side: THREE.DoubleSide,
            flatShading: true,
            transparent: true,
            opacity: roofMaterialProps.opacity || 0.75
        });
        
        // Use room's footprint to calculate roof size
        // Check if room is a room object (has footprint property) or floor object
        let footprint;
        if (room.footprint && Array.isArray(room.footprint)) {
            // If room is a room object, use its footprint directly
            footprint = room.footprint;
        } else if (room.rooms && Array.isArray(room.rooms)) {
            // If room is a floor object, collect all room's footprint points
            footprint = room.rooms.reduce((acc, r) => {
                if (r.footprint && Array.isArray(r.footprint)) {
                    acc.push(...r.footprint);
                }
                return acc;
            }, []);
        } else {
            console.error('Invalid room or floor object for roof rendering');
            return;
        }
        
        const minX = Math.min(...footprint.map(point => point[0]));
        const maxX = Math.max(...footprint.map(point => point[0]));
        const minY = Math.min(...footprint.map(point => point[1]));
        const maxY = Math.max(...footprint.map(point => point[1]));
        
        const width = (maxX - minX) / 1000; // Convert to meters
        const depth = (maxY - minY) / 1000; // Convert to meters
        
        // Calculate roof width and depth (including overhang)
        const roofWidth = width + (2 * roofOverhang);
        const roofDepth = depth + (2 * roofOverhang);
        
        // Create flat roof
        const roofGeometry = new THREE.BoxGeometry(roofWidth, roofThickness, roofDepth);
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        
        // Set roof position
        roofMesh.position.set(centerX, centerY + floorHeight + roofThickness/2, centerZ);
        
        roofMesh.castShadow = true;
        roofMesh.receiveShadow = true;
        
        // Add selectable identifier
        roofMesh.userData.type = 'roof';
        roofMesh.userData.selectable = true;
        roofMesh.userData.name = `Roof_Flat`;
        
        // Add flat roof edge lines (outline)
        const flatRoofEdges = new THREE.EdgesGeometry(roofGeometry, 30);
        const flatRoofLinesMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            linewidth: 1
        });
        const flatRoofWireframe = new THREE.LineSegments(flatRoofEdges, flatRoofLinesMaterial);
        // Set visibility based on current component state
        flatRoofWireframe.visible = isOutlineVisible;
        // Add identifier, indicating this is an outline
        flatRoofWireframe.userData.isOutline = true;
        flatRoofWireframe.userData.parentType = 'roof';
        roofMesh.add(flatRoofWireframe);
        
        // Add outline to reference array for visibility control
        wireframeRef.current.push(flatRoofWireframe);
        
        scene.add(roofMesh);
    };
    
    // Render pitched roof component
    const renderPitchedRoof = (scene, room, floor, centerX, centerY, centerZ, floorHeight) => {
        // Get roof property from floor
        const roof = floor.roof;
        
        // Check if roof object exists, use default values for other properties
        if (!roof) {
            console.error('Missing roof object in JSON data');
            return;
        }
        
        // Use default values if properties are missing
        const roofHeight = (roof.height || 1000) / 1000; // Default height 1000 mm
        const roofOverhang = (roof.overhang || 300) / 1000; // Default overhang 300 mm
        const roofPitch = roof.pitch || 15; // Default pitch 15 degrees
        
        // Get roof material
        const roofMaterialColor = roof.material?.color ? parseInt(roof.material.color.replace('#', '0x')) : 0x8b4513;
        const roofMaterialProps = roof.material || {};
        const roofMaterial = new THREE.MeshPhongMaterial({ 
            color: roofMaterialColor,
            side: THREE.DoubleSide,
            flatShading: true,
            transparent: true,
            opacity: roofMaterialProps.opacity || 0.75
        });
        
        // Use room's footprint to calculate roof size
        // Check if room is a room object (has footprint property) or floor object
        let footprint;
        if (room.footprint && Array.isArray(room.footprint)) {
            // If room is a room object, use its footprint directly
            footprint = room.footprint;
        } else if (room.rooms && Array.isArray(room.rooms)) {
            // If room is a floor object, collect all room's footprint points
            footprint = room.rooms.reduce((acc, r) => {
                if (r.footprint && Array.isArray(r.footprint)) {
                    acc.push(...r.footprint);
                }
                return acc;
            }, []);
        } else {
            console.error('Invalid room or floor object for roof rendering');
            return;
        }
        
        const minX = Math.min(...footprint.map(point => point[0]));
        const maxX = Math.max(...footprint.map(point => point[0]));
        const minY = Math.min(...footprint.map(point => point[1]));
        const maxY = Math.max(...footprint.map(point => point[1]));
        
        const width = (maxX - minX) / 1000; // Convert to meters
        const depth = (maxY - minY) / 1000; // Convert to meters
        
        // Calculate roof width and depth (including overhang)
        const roofWidth = width + (2 * roofOverhang);
        const roofDepth = depth + (2 * roofOverhang);
        
        // Calculate pitched roof height
        const pitchRadians = (roofPitch * Math.PI) / 180;
        const roofHeightAtEnd = roofHeight * Math.tan(pitchRadians);
        
        // Create pitched roof geometry
        const roofShape = new THREE.Shape();
        roofShape.moveTo(-roofWidth/2, 0);
        roofShape.lineTo(roofWidth/2, 0);
        roofShape.lineTo(roofWidth/2, roofHeightAtEnd);
        roofShape.lineTo(-roofWidth/2, roofHeightAtEnd);
        roofShape.lineTo(-roofWidth/2, 0);
        
        const extrudeSettings = {
            steps: 1,
            depth: roofDepth,
            bevelEnabled: false
        };
        
        const roofGeometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
        const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        
        // Set roof position and rotation
        roofMesh.position.set(centerX, centerY + floorHeight, centerZ - roofDepth/2);
        roofMesh.rotation.x = -Math.PI / 2; // Rotate to horizontal plane
        
        roofMesh.castShadow = true;
        roofMesh.receiveShadow = true;
        
        // Add selectable identifier
        roofMesh.userData.type = 'roof';
        roofMesh.userData.selectable = true;
        roofMesh.userData.name = `Roof_Pitched`;
        
        // Add pitched roof edge lines (outline)
        const pitchedRoofEdges = new THREE.EdgesGeometry(roofGeometry, 30);
        const pitchedRoofLinesMaterial = new THREE.LineBasicMaterial({ 
            color: 0x000000,
            linewidth: 1
        });
        const pitchedRoofWireframe = new THREE.LineSegments(pitchedRoofEdges, pitchedRoofLinesMaterial);
        // Set visibility based on current component state
        pitchedRoofWireframe.visible = isOutlineVisible;
        // Add identifier, indicating this is an outline
        pitchedRoofWireframe.userData.isOutline = true;
        pitchedRoofWireframe.userData.parentType = 'roof';
        roofMesh.add(pitchedRoofWireframe);
        
        // Add outline to reference array for visibility control
        wireframeRef.current.push(pitchedRoofWireframe);
        
        scene.add(roofMesh);
    };
    
    // Modify addLabel function to track room labels
    const addLabel = (scene, text, position) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Increase canvas size to accommodate longer text
        canvas.width = 512;
        canvas.height = 128;
        
        // Clear the canvas with transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set text properties with Lexend font
        context.font = '36px Lexend, sans-serif';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw text in the center of the canvas
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.transparent = true;
        
        const labelMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        const label = new THREE.Sprite(labelMaterial);
        label.position.copy(position);
        label.position.y += 0; // 0: middle, 1: top
        label.scale.set(8, 2, 1); // Increased scale to make text more visible
        
        // Default hide all labels
        label.visible = false;
        // Add all labels to reference collection
        roomLabelsRef.current.push(label);
        
        scene.add(label);
    };

    // Expose scene, camera, renderer, and controls to global, so ClippingPlane component can access
    useEffect(() => {
        if (sceneRef.current && cameraRef.current && rendererRef.current && controlsRef.current) {
            window.scene = sceneRef.current;
            window.camera = cameraRef.current;
            window.renderer = rendererRef.current;
            window.orbitControls = controlsRef.current;
        }
    }, []);

    // Add event listener to handle view mode change
    useEffect(() => {
        // Handle view mode change
        const handleViewModeChange = (event) => {
            if (!cameraRef.current) return;
            
            const mode = event.detail.mode;
            const position = event.detail.position;
            
            if (mode === 'isometric') {
                // Switch to isometric (isometric) view
                const orthoCamera = cameraRef.current.orthographic;
                
                // Connect controller to orthographic camera
                controlsRef.current.object = orthoCamera;
                
                // Update active camera
                cameraRef.current.active = orthoCamera;
                
                console.log('Switch to isometric view');
            } else if (mode === 'perspective') {
                // Switch to perspective (perspective) view
                const perspCamera = cameraRef.current.perspective;
                
                // If position is provided, move camera to specified position
                if (position) {
                    perspCamera.position.set(position[0], position[1], position[2]);
                    
                    // Look at scene center
                    perspCamera.lookAt(0, 0, 0);
                    
                    // Update orbit controller target point
                    controlsRef.current.target.set(0, 0, 0);
                    
                    console.log(`Camera position set to [${position.join(', ')}]`);
                }
                
                // Connect controller to perspective camera
                controlsRef.current.object = perspCamera;
                
                // Update active camera
                cameraRef.current.active = perspCamera;
                
                console.log('Switch to perspective view');
            }
            
            // Update controller
            controlsRef.current.update();
        };
        
        // Add event listener
        window.addEventListener('changeViewMode', handleViewModeChange);
        
        // Cleanup function
        return () => {
            window.removeEventListener('changeViewMode', handleViewModeChange);
        };
    }, []);

    // Listen for object selection status changes
    useEffect(() => {
        const handleObjectSelected = (e) => {
            const { selected, info } = e.detail;
            if (selected && info) {
                setSelectedObject(info);
            } else {
                setSelectedObject(null);
            }
        };

        window.addEventListener('objectSelected', handleObjectSelected);
        return () => {
            window.removeEventListener('objectSelected', handleObjectSelected);
        };
    }, []);

    // Create geometry
    const createGeometry = (type, position) => {
        let geometry;
        let material = new THREE.MeshPhongMaterial({ 
            color: 0x808080,
            transparent: true,
            opacity: 0.8
        });

        switch (type) {
            case 'cube':
                geometry = new THREE.BoxGeometry(2, 2, 2);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(1, 32, 32);
                break;
            case 'pyramid':
                geometry = new THREE.ConeGeometry(1, 2, 4);
                break;
            default:
                return null;
        }

        const mesh = new THREE.Mesh(geometry, material);
        
        // Set position
        if (position) {
            mesh.position.copy(position);
        } else {
            // Default position in front of camera
            const camera = cameraRef.current.active;
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            mesh.position.copy(camera.position).add(direction.multiplyScalar(5));
        }

        // Add outline
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        mesh.add(line);

        // Add selectable identifier
        mesh.userData.type = 'geometry';
        mesh.userData.selectable = true;
        mesh.userData.name = `${type.charAt(0).toUpperCase() + type.slice(1)}`;

        // Enable shadow
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        sceneRef.current.add(mesh);

        // Notify object has been created
        window.dispatchEvent(new CustomEvent('objectCreated', {
            detail: {
                object: mesh,
                type: 'geometry',
                name: mesh.userData.name
            }
        }));

        return mesh;
    };

    // Handle geometry creation event
    const handleCreateGeometry = (event) => {
        const { type } = event.detail;
        createGeometry(type);
    };

    // Handle drag and drop placement event
    const handleDrop = (event) => {
        event.preventDefault();
        const geometryType = event.dataTransfer.getData('geometryType');
        
        // Ensure scene and camera exist
        if (!sceneRef.current || !cameraRef.current) {
            console.error('Scene or camera not initialized');
            return;
        }

        // Calculate placement position
        const mouse = new THREE.Vector2();
        const rect = containerRef.current.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current.active);

        // Only detect non-label objects
        const objectsToIntersect = sceneRef.current.children.filter(
            obj => !(obj instanceof THREE.Sprite)
        );

        const intersects = raycaster.intersectObjects(objectsToIntersect);
        if (intersects.length > 0) {
            createGeometry(geometryType, intersects[0].point);
        } else {
            // If no intersection, create geometry in front of camera
            const camera = cameraRef.current.active;
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            const position = camera.position.clone().add(direction.multiplyScalar(5));
            createGeometry(geometryType, position);
        }
    };

    // Handle drag and drop hover event
    const handleDragOver = (event) => {
        event.preventDefault();
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
            <ClippingPlane />
            <ObjectTransformer />
            <div style={{
                position: 'absolute',
                top: '5%',
                left: '10%',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontFamily: 'Lexend, sans-serif',
                opacity: 0.75
            }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}><strong>Statistics</strong></h3>
                <div style={{ marginBottom: '5px' }}>
                    Total Area: {stats.totalArea} m²
                </div>
                <div style={{ marginBottom: '5px' }}>
                    Total Floors: {stats.totalFloors}
                </div>
                <div style={{ marginBottom: '5px' }}>
                    Total Rooms: {stats.totalRooms}
                </div>
                {/* <div style={{ marginBottom: '5px' }}>
                    <strong>Total Walls:</strong> {stats.totalWalls}
                </div>
                <div style={{ marginBottom: '5px' }}>
                    <strong>Total Windows:</strong> {stats.totalWindows}
                </div>
                <div style={{ marginBottom: '5px' }}>
                    <strong>Total Doors:</strong> {stats.totalDoors}
                </div> */}
            </div>
            
            {selectedObject && (
                <div style={{
                    position: 'absolute',
                    top: '5%',
                    right: '5%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '15px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    fontFamily: 'Lexend, sans-serif',
                    minWidth: '200px',
                    opacity: 0.75
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}><strong>Selected Object</strong></h3>
                    <div style={{ marginBottom: '5px' }}>
                        Name: {selectedObject.name}
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                        Type: {selectedObject.type}
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                        Position: [{selectedObject.position.join(', ')}]
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuildingModel; 