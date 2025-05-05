import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

// This component does not render any content directly. 
// It only handles the logic for clipping planes and communicates with the BuildingModel component through custom events.
function ClippingPlane() {
  const planeRef = useRef(null);
  const transformControlsRef = useRef(null);
  const planeHelperRef = useRef(null);
  const operationRef = useRef('translate');
  const isActiveRef = useRef(false);
  const isSelectedRef = useRef(false);

  // Initialize the clipping plane
  useEffect(() => {
    // Listen for the creation of a clipping plane
    const handleCreateClippingPlane = () => {
      // Ensure the camera has been initialized
      if (!window.camera || !getActiveCamera()) {
        console.error('Camera not initialized yet');
        return;
      }
      
      if (isActiveRef.current) return;
      
      // Create the clipping plane
      const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), -2);
      planeRef.current = plane;
      
      // Create the plane helper
      const planeHelper = new THREE.PlaneHelper(plane, 10, 0xff0000);
      planeHelperRef.current = planeHelper;
      
      // Set the plane position
      planeHelper.position.set(10, 2, 10);
      plane.normal.set(0, -1, 0);
      plane.constant = -2;
      
      // Create the transform controls
      const transformControls = new TransformControls(
        getActiveCamera(), 
        window.renderer.domElement
      );
      transformControlsRef.current = transformControls;
      transformControls.attach(planeHelper);
      transformControls.updateMatrixWorld(true);
      transformControls.setMode('translate');
      transformControls.addEventListener('dragging-changed', handleDraggingChanged);
      transformControls.addEventListener('objectChange', handleObjectChange);
      
      // Add the plane helper and transform controls to the scene
      window.scene.add(planeHelper);
      window.scene.add(transformControls);
      
      // Update all clipping planes for materials
      updateMaterialsClippingPlane(plane);
      
      isActiveRef.current = true;
      
      // Notify the BuildingModel component that the clipping plane has been created
      window.dispatchEvent(new CustomEvent('clippingPlaneCreated'));
    };
    
    // Listen for the removal of a clipping plane
    const handleRemoveClippingPlane = () => {
      if (!isActiveRef.current) return;
      
      // Remove the plane helper and transform controls
      if (planeHelperRef.current && window.scene) {
        window.scene.remove(planeHelperRef.current);
      }
      
      if (transformControlsRef.current && window.scene) {
        window.scene.remove(transformControlsRef.current);
      }
      
      // Clear all clipping planes for materials
      clearMaterialsClippingPlane();
      
      isActiveRef.current = false;
      isSelectedRef.current = false;
      
      // Notify the BuildingModel component that the clipping plane has been removed
      window.dispatchEvent(new CustomEvent('clippingPlaneRemoved'));
    };
    
    // Listen for the switching of operation mode events
    const handleChangeOperation = (event) => {
      if (!isActiveRef.current) return;
      
      const operation = event.detail.operation;
      operationRef.current = operation;
      
      if (transformControlsRef.current) {
        transformControlsRef.current.setMode(operation);
      }
    };
    
    // Listen for the deselection of a clipping plane
    const handleDeselectPlane = () => {
      if (!isActiveRef.current) return;
      
      isSelectedRef.current = false;
      
      // Notify the BuildingModel component that the clipping plane has been deselected
      window.dispatchEvent(new CustomEvent('clippingPlaneSelected', { 
        detail: { selected: false } 
      }));
    };
    
    // Handle the change of dragging state
    const handleDraggingChanged = (event) => {
      if (window.orbitControls) {
        window.orbitControls.enabled = !event.value;
      }
    };
    
    // Handle the change of object
    const handleObjectChange = () => {
      if (!planeHelperRef.current || !planeRef.current) return;
      
      // Update the plane position and direction
      const position = planeHelperRef.current.position;
      const quaternion = planeHelperRef.current.quaternion;
      
      // Extract the normal direction from the quaternion
      const normal = new THREE.Vector3(0, 1, 0);
      normal.applyQuaternion(quaternion);
      
      // Update the plane
      planeRef.current.normal.copy(normal);
      planeRef.current.constant = -normal.dot(position);
      
      // Update all clipping planes for materials
      updateMaterialsClippingPlane(planeRef.current);
    };
    
    // Add event listeners
    window.addEventListener('createClippingPlane', handleCreateClippingPlane);
    window.addEventListener('removeClippingPlane', handleRemoveClippingPlane);
    window.addEventListener('changeClippingPlaneOperation', handleChangeOperation);
    window.addEventListener('deselectClippingPlane', handleDeselectPlane);
    
    // Add a click event listener, used to select the clipping plane
    const handleClick = (event) => {
      if (!isActiveRef.current) return;
      
      // Check if the clipping plane was clicked
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      
      // Calculate the mouse position
      const rect = window.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Set the ray
      raycaster.setFromCamera(mouse, getActiveCamera());
      
      // Check if the ray intersects with the plane helper
      const intersects = raycaster.intersectObject(planeHelperRef.current);
      
      if (intersects.length > 0) {
        isSelectedRef.current = true;
        
        // Notify the BuildingModel component that the clipping plane has been selected
        window.dispatchEvent(new CustomEvent('clippingPlaneSelected', { 
          detail: { selected: true } 
        }));
      }
    };
    
    window.addEventListener('click', handleClick);
    
    // Cleanup function
    return () => {
      window.removeEventListener('createClippingPlane', handleCreateClippingPlane);
      window.removeEventListener('removeClippingPlane', handleRemoveClippingPlane);
      window.removeEventListener('changeClippingPlaneOperation', handleChangeOperation);
      window.removeEventListener('deselectClippingPlane', handleDeselectPlane);
      window.removeEventListener('click', handleClick);
      
      // Remove the clipping plane
      if (isActiveRef.current) {
        handleRemoveClippingPlane();
      }
    };
  }, []);
  
  // Update all clipping planes for materials
  const updateMaterialsClippingPlane = (plane) => {
    if (!window.scene) return;
    
    window.scene.traverse((object) => {
      if (object.isMesh) {
        // Ensure the material supports clipping
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            if (material) {
              material.clippingPlanes = [plane];
              material.needsUpdate = true;
            }
          });
        } else if (object.material) {
          object.material.clippingPlanes = [plane];
          object.material.needsUpdate = true;
        }
      }
    });
  };
  
  // Clear all clipping planes for materials
  const clearMaterialsClippingPlane = () => {
    if (!window.scene) return;
    
    window.scene.traverse((object) => {
      if (object.isMesh) {
        // Clear the clipping planes for the material
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            if (material) {
              material.clippingPlanes = [];
              material.needsUpdate = true;
            }
          });
        } else if (object.material) {
          object.material.clippingPlanes = [];
          object.material.needsUpdate = true;
        }
      }
    });
  };
  
  // Update any instances of window.camera to ensure the active camera is used
  const getActiveCamera = () => {
    return window.camera ? window.camera.active : null;
  };
  
  // This component does not render any content
  return null;
}

export default ClippingPlane; 