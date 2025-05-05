import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

// This component does not render any content, it only handles the logic of object selection and transformation
function ObjectTransformer() {
  const transformControlsRef = useRef(null);
  const selectedObjectRef = useRef(null);
  const operationRef = useRef('translate'); // Default operation is translation
  const isActiveRef = useRef(false);
  
  // Add history for undo/redo functionality
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const isTransformingRef = useRef(false);
  const objectStartStateRef = useRef(null);

  // Get the currently active camera
  const getActiveCamera = () => {
    return window.camera ? window.camera.active : null;
  };

  // Function to record object state
  const saveObjectState = (object) => {
    if (!object) return null;
    
    return {
      position: object.position.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone()
    };
  };

  // Function to restore object state
  const restoreObjectState = (object, state) => {
    if (!object || !state) return;
    
    object.position.copy(state.position);
    object.rotation.copy(state.rotation);
    object.scale.copy(state.scale);
  };

  // Function to add to history
  const addToHistory = (oldState, newState) => {
    // If we execute a new operation in the middle of the history, we need to delete the history after that
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    
    historyRef.current.push({
      oldState: oldState,
      newState: newState,
      objectId: selectedObjectRef.current ? selectedObjectRef.current.id : null
    });
    historyIndexRef.current = historyRef.current.length - 1;
    
    console.log(`Added action to history. History length: ${historyRef.current.length}, Current index: ${historyIndexRef.current}`);
  };

  // Function to undo the previous operation
  const undo = () => {
    if (historyIndexRef.current < 0 || !historyRef.current.length) {
      console.log('Nothing to undo');
      return;
    }
    
    const action = historyRef.current[historyIndexRef.current];
    const object = findObjectById(action.objectId);
    
    if (object) {
      restoreObjectState(object, action.oldState);
      console.log('Undoing action:', historyIndexRef.current);
    } else {
      console.warn('Object not found for undo operation');
    }
    
    historyIndexRef.current--;
  };

  // Function to redo the previous operation
  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      console.log('Nothing to redo');
      return;
    }
    
    historyIndexRef.current++;
    const action = historyRef.current[historyIndexRef.current];
    const object = findObjectById(action.objectId);
    
    if (object) {
      restoreObjectState(object, action.newState);
      console.log('Redoing action:', historyIndexRef.current);
    } else {
      console.warn('Object not found for redo operation');
    }
  };

  // Function to find object by ID
  const findObjectById = (id) => {
    let foundObject = null;
    
    if (!window.scene || !id) return null;
    
    window.scene.traverse((object) => {
      if (object.id === id) {
        foundObject = object;
      }
    });
    
    return foundObject;
  };

  // Initialize object selection and transformation control
  useEffect(() => {
    // Function to handle operation mode change
    const handleOperationModeChange = (event) => {
      if (!isActiveRef.current || !transformControlsRef.current) return;
      
      const operation = event.detail.operation;
      operationRef.current = operation;
      
      if (transformControlsRef.current) {
        transformControlsRef.current.setMode(operation);
      }
    };

    // Function to handle dragging state change
    const handleDraggingChanged = (event) => {
      if (window.orbitControls) {
        window.orbitControls.enabled = !event.value;
      }
      
      // When dragging starts, save the initial state
      if (event.value && selectedObjectRef.current) {
        isTransformingRef.current = true;
        objectStartStateRef.current = saveObjectState(selectedObjectRef.current);
      } 
      // When dragging ends, record history
      else if (!event.value && isTransformingRef.current && selectedObjectRef.current) {
        isTransformingRef.current = false;
        const objectEndState = saveObjectState(selectedObjectRef.current);
        
        // Only record history if the state actually changes
        if (objectStartStateRef.current && 
            (objectStartStateRef.current.position.distanceTo(objectEndState.position) > 0.001 ||
             objectStartStateRef.current.rotation.equals(objectEndState.rotation) === false ||
             objectStartStateRef.current.scale.distanceTo(objectEndState.scale) > 0.001)) {
          
          addToHistory(objectStartStateRef.current, objectEndState);
        }
        
        objectStartStateRef.current = null;
      }
    };

    // Function to create transform controls
    const createTransformControls = () => {
      try {
        if (!window.scene || !getActiveCamera() || !window.renderer) {
          console.error('Scene, camera or renderer not initialized');
          return;
        }

        // If it already exists, remove it first
        if (transformControlsRef.current && window.scene) {
          // Ensure any attached objects are detached first
          transformControlsRef.current.detach();
          
          // Remove event listeners
          if (transformControlsRef.current._listeners && 
              transformControlsRef.current._listeners['dragging-changed']) {
            transformControlsRef.current.removeEventListener('dragging-changed', handleDraggingChanged);
          }
          
          window.scene.remove(transformControlsRef.current);
          transformControlsRef.current = null;
        }

        // Create transform controls
        const transformControls = new TransformControls(
          getActiveCamera(), 
          window.renderer.domElement
        );
        
        // Ensure the camera is correctly set
        if (!transformControls.camera) {
          console.error('Failed to set camera for transform controls');
          return;
        }
        
        transformControlsRef.current = transformControls;
        
        // Set operation mode
        transformControls.setMode(operationRef.current);
        
        // Add event listeners
        transformControls.addEventListener('dragging-changed', handleDraggingChanged);
        
        // Add to scene
        window.scene.add(transformControls);
        
        isActiveRef.current = true;
        
        // Force update to ensure the controller is correctly initialized
        transformControls.updateMatrixWorld();
      } catch (error) {
        console.error('Error creating transform controls:', error);
        isActiveRef.current = false;
      }
    };

    // Function to safely attach object to transform controls
    const attachObject = (object) => {
      try {
        if (!transformControlsRef.current || !object) {
          console.warn('Cannot attach: transform controls or object is null');
          return false;
        }
        
        // Ensure the object is a valid THREE.Object3D and in the scene
        if (!(object instanceof THREE.Object3D) || !object.parent) {
          console.warn('Cannot attach: object is not valid or not in scene');
          return false;
        }
        
        // First detach the current object (if any)
        transformControlsRef.current.detach();
        
        // Ensure the object's world matrix is up to date
        object.updateMatrixWorld(true);
        
        // Attach the object and update the controller
        transformControlsRef.current.attach(object);
        // Correctly update the transform controls' matrix
        transformControlsRef.current.updateMatrixWorld();
        
        return true;
      } catch (error) {
        console.error('Error attaching object to transform controls:', error);
        return false;
      }
    };
    
    // Function to safely detach object
    const detachObject = () => {
      try {
        if (!transformControlsRef.current) return;
        
        // Save the reference to the currently selected object (if any)
        const objectToDetach = selectedObjectRef.current;
        
        // Set the selection reference to null to avoid subsequent operations referencing the detached object
        selectedObjectRef.current = null;
        
        // Detach the controller
        transformControlsRef.current.detach();
        
        // Notify other components that the object has been deselected
        window.dispatchEvent(new CustomEvent('objectSelected', { 
          detail: { object: null, selected: false, info: null } 
        }));
        
        return objectToDetach;
      } catch (error) {
        console.error('Error detaching object from transform controls:', error);
        selectedObjectRef.current = null;
        return null;
      }
    };

    // Function to handle object click selection
    const handleObjectClick = (event) => {
      try {
        if (!window.scene || !getActiveCamera() || !window.renderer) return;
        
        // Create a raycaster
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Calculate mouse position
        const rect = window.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Set the raycaster
        raycaster.setFromCamera(mouse, getActiveCamera());
        
        // Find objects that can be clicked - only select objects that are selectable
        const clickableObjects = [];
        window.scene.traverse((object) => {
          if (object.isMesh && 
              !(object instanceof THREE.GridHelper) && 
              !(object instanceof THREE.PlaneHelper) &&
              !(object instanceof THREE.AxesHelper) &&
              !(object instanceof THREE.LineSegments) && // 排除轮廓线对象
              object.userData && 
              object.userData.selectable === true) {
            clickableObjects.push(object);
          }
        });
        
        // Check for intersections with clickable objects
        const intersects = raycaster.intersectObjects(clickableObjects, false); // false表示不检查子对象
        
        if (intersects.length > 0) {
          // Select the first intersecting object
          const object = intersects[0].object;
          
          // Check if the object is a wireframe outline
          if (object instanceof THREE.LineSegments) {
            console.warn('Selected object is a wireframe outline, ignoring');
            return;
          }
          
          // Check if the object is valid and still in the scene
          if (!object || !object.parent) {
            console.warn('Selected object is not valid or not in scene');
            return;
          }
          
          // Ensure we select the main object rather than its child
          const targetObject = object.userData.isOutline ? object.parent : object;
          
          // If the transform controls do not exist, create them
          if (!transformControlsRef.current) {
            createTransformControls();
          }
          
          // Use the safe attach function
          if (attachObject(targetObject)) {
            selectedObjectRef.current = targetObject;
            
            // Display object information
            console.log('Selected object:', targetObject.userData);
            
            // Notify other components that the object has been selected
            window.dispatchEvent(new CustomEvent('objectSelected', { 
              detail: { 
                object: targetObject, 
                selected: true,
                info: {
                  type: targetObject.userData.type || 'unknown',
                  name: targetObject.userData.name || 'Unnamed object',
                  position: targetObject.position.toArray().map(val => Math.round(val * 100) / 100)
                }
              } 
            }));
          }
        } else {
          // If clicked on empty space, deselect the object
          detachObject();
        }
      } catch (error) {
        console.error('Error handling object click:', error);
      }
    };

    // Function to deselect object
    const handleDeselectObject = () => {
      if (transformControlsRef.current && selectedObjectRef.current) {
        transformControlsRef.current.detach();
        selectedObjectRef.current = null;
        
        // Notify other components that the object has been deselected
        window.dispatchEvent(new CustomEvent('objectSelected', { 
          detail: { object: null, selected: false } 
        }));
      }
    };

    // Function to handle keyboard events
    const handleKeyDown = (event) => {
      // Ctrl+Z and Ctrl+Y for undo and redo
      if (event.ctrlKey) {
        if (event.key === 'z') {
          undo();
          event.preventDefault();
        } else if (event.key === 'y') {
          redo();
          event.preventDefault();
        }
      }
      
      // ESC key for deselecting object
      if (event.key === 'Escape') {
        handleDeselectObject();
        event.preventDefault();
      }
      
      // Delete 或 Backspace 键用于删除对象
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedObjectRef.current && window.scene) {
          try {
            // Get the object to be removed
            const objectToRemove = selectedObjectRef.current;
            
            // Save the reference and clear the selected object to avoid subsequent operations referencing the deleted object
            selectedObjectRef.current = null;
            
            // Safely detach the controller
            if (transformControlsRef.current) {
              transformControlsRef.current.detach();
              
              // Ensure the controller is updated in the next frame
              requestAnimationFrame(() => {
                if (transformControlsRef.current) {
                  transformControlsRef.current.updateMatrixWorld();
                }
              });
            }
            
            // Remove the object from the scene
            if (window.scene && objectToRemove.parent === window.scene) {
              window.scene.remove(objectToRemove);
              
              // Release geometry and material resources
              if (objectToRemove.geometry) {
                objectToRemove.geometry.dispose();
              }
              
              if (objectToRemove.material) {
                if (Array.isArray(objectToRemove.material)) {
                  objectToRemove.material.forEach(material => material.dispose());
                } else {
                  objectToRemove.material.dispose();
                }
              }
              
              // Ensure the child objects are cleared
              while (objectToRemove.children.length > 0) {
                const child = objectToRemove.children[0];
                objectToRemove.remove(child);
              }
              
              // Notify other components that the object has been deselected
              window.dispatchEvent(new CustomEvent('objectSelected', { 
                detail: { selected: false, info: null } 
              }));
              
              console.log('Object deleted');
            } else {
              console.warn('Object could not be removed: not found in scene');
            }
          } catch (error) {
            console.error('Error deleting object:', error);
          }
          
          event.preventDefault();
        }
      }
      
      // Shortcut keys to switch operating modes
      if (selectedObjectRef.current && transformControlsRef.current) {
        switch(event.key) {
          case 'g': // translate
            transformControlsRef.current.setMode('translate');
            operationRef.current = 'translate';
            break;
          case 'r': // rotate
            transformControlsRef.current.setMode('rotate');
            operationRef.current = 'rotate';
            break;
          case 's': // scale
            transformControlsRef.current.setMode('scale');
            operationRef.current = 'scale';
            break;
          default:
            break;
        }
      }
    };

    // Add event listeners
    window.addEventListener('click', handleObjectClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('changeObjectOperation', handleOperationModeChange);
    
    // Update the camera reference of the transform controller whenever the camera view mode changes
    const handleViewModeChange = () => {
      if (transformControlsRef.current && getActiveCamera()) {
        transformControlsRef.current.camera = getActiveCamera();
        transformControlsRef.current.updateMatrix();
      }
    };
    
    window.addEventListener('changeViewMode', handleViewModeChange);
    
    // Cleanup function
    return () => {
      window.removeEventListener('click', handleObjectClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('changeObjectOperation', handleOperationModeChange);
      window.removeEventListener('changeViewMode', handleViewModeChange);
      
      // Remove the transform controller
      if (transformControlsRef.current && window.scene) {
        transformControlsRef.current.removeEventListener('dragging-changed', handleDraggingChanged);
        window.scene.remove(transformControlsRef.current);
      }
    };
  }, []);

  // This component does not render any content
  return null;
}

export default ObjectTransformer; 