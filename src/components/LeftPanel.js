import React, { useState, useEffect } from 'react';
import './LeftPanel.css';
import ViewCube from './ViewCube';
// Import GLTFExporter
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

function LeftPanel() {
  const [activeView, setActiveView] = useState('perspective'); // Default view is perspective mode
  const [isClippingPlaneActive, setIsClippingPlaneActive] = useState(false);
  const [isPlaneSelected, setIsPlaneSelected] = useState(false);
  const [activeOperation, setActiveOperation] = useState('translate'); // Default operation is translate
  const [isObjectSelected, setIsObjectSelected] = useState(false);
  const [isRoomLabelsVisible, setIsRoomLabelsVisible] = useState(false); // Used to control the display state of room labels
  const [isOutlineVisible, setIsOutlineVisible] = useState(true); // Used to control the display state of object outlines, default display
  const [isGridMeshVisible, setIsGridMeshVisible] = useState(true); // Grid default visible

  // Handle Isometric view button click
  const handleIsometricClick = () => {
    setActiveView('isometric');
    // Send event notification to BuildingModel component to switch to isometric view
    window.dispatchEvent(new CustomEvent('changeViewMode', { 
      detail: { mode: 'isometric' } 
    }));
  };

  // Handle Perspective view button click
  const handlePerspectiveClick = () => {
    setActiveView('perspective');
    // Send event notification to BuildingModel component to switch to perspective view
    window.dispatchEvent(new CustomEvent('changeViewMode', { 
      detail: { mode: 'perspective' } 
    }));
  };

  // Handle Room button click
  const handleRoomClick = () => {
    const newState = !isRoomLabelsVisible;
    setIsRoomLabelsVisible(newState);
    // Send event notification to BuildingModel component to display or hide room labels
    window.dispatchEvent(new CustomEvent('toggleRoomLabels', { 
      detail: { visible: newState } 
    }));
  };

  // Handle Outline button click
  const handleOutlineClick = () => {
    const newState = !isOutlineVisible;
    setIsOutlineVisible(newState);
    // Send event notification to BuildingModel component to display or hide object outlines
    window.dispatchEvent(new CustomEvent('toggleOutlines', { 
      detail: { visible: newState } 
    }));
  };

  // Handle Clip Plane button click
  const handleClipPlaneClick = () => {
    setIsClippingPlaneActive(!isClippingPlaneActive);
    if (!isClippingPlaneActive) {
      // Send event notification to BuildingModel component to create clipping plane
      window.dispatchEvent(new CustomEvent('createClippingPlane'));
    } else {
      // Send event notification to BuildingModel component to remove clipping plane
      window.dispatchEvent(new CustomEvent('removeClippingPlane'));
    }
  };

  // Handle Clip Plane operation button click
  const handleClipPlaneOperationClick = (operation) => {
    if (isClippingPlaneActive) {
      // Send event notification to BuildingModel component to switch operation mode
      window.dispatchEvent(new CustomEvent('changeClippingPlaneOperation', { 
        detail: { operation } 
      }));
    }
  };

  // Handle Object transformation operation button click
  const handleObjectOperationClick = (operation) => {
    setActiveOperation(operation);
    // Send event notification to ObjectTransformer component to switch operation mode
    window.dispatchEvent(new CustomEvent('changeObjectOperation', { 
      detail: { operation } 
    }));
  };

  // Handle export model as GLTF format
  const handleExportClick = (binary) => {
    // Create GLTFExporter instance
    const exporter = new GLTFExporter();
    
    // Export scene
    if (window.scene) {
      exporter.parse(
        window.scene,
        function (result) {
          // Depending on the binary option, result may be an ArrayBuffer or an object
          let blob;
          let filename;
          
          if (binary) {
            blob = new Blob([result], { type: 'application/octet-stream' });
            filename = 'building-model.glb';
          } else {
            blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
            filename = 'building-model.gltf';
          }
          
          // Create download link
          const link = document.createElement('a');
          link.style.display = 'none';
          document.body.appendChild(link);
          
          // Create download URL
          const url = URL.createObjectURL(blob);
          link.href = url;
          
          // Set file name
          link.download = filename;
          
          // Trigger download
          link.click();
          
          // Clean up
          setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(link);
          }, 100);
        },
        function (error) {
          console.error('An error occurred during export:', error);
        },
        { binary: binary } // Export based on the selected format
      );
    } else {
      console.error('Scene not available for export');
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (isPlaneSelected) {
        setIsPlaneSelected(false);
        // Send event notification to BuildingModel component to deselect clipping plane
        window.dispatchEvent(new CustomEvent('deselectClippingPlane'));
      } else if (isClippingPlaneActive) {
        setIsClippingPlaneActive(false);
        // Send event notification to BuildingModel component to remove clipping plane
        window.dispatchEvent(new CustomEvent('removeClippingPlane'));
      }
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClippingPlaneActive, isPlaneSelected]);

  // Listen for clipping plane selection status changes
  useEffect(() => {
    const handlePlaneSelected = (e) => {
      setIsPlaneSelected(e.detail.selected);
    };

    window.addEventListener('clippingPlaneSelected', handlePlaneSelected);
    return () => {
      window.removeEventListener('clippingPlaneSelected', handlePlaneSelected);
    };
  }, []);

  // Listen for object selection status changes
  useEffect(() => {
    const handleObjectSelected = (e) => {
      setIsObjectSelected(e.detail.selected);
    };

    window.addEventListener('objectSelected', handleObjectSelected);
    return () => {
      window.removeEventListener('objectSelected', handleObjectSelected);
    };
  }, []);

  // Handle Mesh button click
  const handleMeshClick = () => {
    const newState = !isGridMeshVisible;
    setIsGridMeshVisible(newState);
    // Send event notification to BuildingModel component to display or hide ground mesh
    window.dispatchEvent(new CustomEvent('toggleGridMesh', { 
      detail: { visible: newState } 
    }));
  };

  // Handle Geometry drag start
  const handleGeometryDragStart = (e, geometryType) => {
    e.dataTransfer.setData('geometryType', geometryType);
  };

  // Handle Geometry button click
  const handleGeometryClick = (geometryType) => {
    // Send event notification to BuildingModel component to create geometry
    window.dispatchEvent(new CustomEvent('createGeometry', { 
      detail: { type: geometryType } 
    }));
  };

  return (
    <div className="left-panel">
      {/* First area: viewpoint switching */}
      <div className="panel-section">
        <h3 className="section-title">View</h3>
        <ViewCube />
        <div className="button-group">
          <button 
            className={`panel-button ${activeView === 'isometric' ? 'active' : ''}`} 
            onClick={handleIsometricClick}
          >
            Isometric
          </button>
          <button 
            className={`panel-button ${activeView === 'perspective' ? 'active' : ''}`} 
            onClick={handlePerspectiveClick}
          >
            Perspective
          </button>
        </div>
      </div>

      {/* Second area: Clipping Plane */}
      <div className="panel-section">
        <h3 className="section-title">Interior</h3>
        <div className="button-group">
          <button 
            className={`panel-button ${isRoomLabelsVisible ? 'active' : ''}`}
            onClick={handleRoomClick}
          >
            Room
          </button>
          <button 
            className={`panel-button ${isOutlineVisible ? 'active' : ''}`}
            onClick={handleOutlineClick}
          >
            Outline
          </button>
          <button 
            className={`panel-button ${isGridMeshVisible ? 'active' : ''}`}
            onClick={handleMeshClick}
          >
            Mesh
          </button>
          <button 
            className={`panel-button ${isClippingPlaneActive ? 'active' : ''}`}
            onClick={handleClipPlaneClick}
          >
            Clip Plane
          </button>
          {isClippingPlaneActive && (
            <div className="operation-buttons-container">
              <button 
                className="panel-button operation-button" 
                onClick={() => handleClipPlaneOperationClick('translate')}
              >
                Move
              </button>
              <button 
                className="panel-button operation-button" 
                onClick={() => handleClipPlaneOperationClick('rotate')}
              >
                Rotate
              </button>
              <button 
                className="panel-button operation-button" 
                onClick={() => handleClipPlaneOperationClick('scale')}
              >
                Scale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Third area: Export */}
      <div className="panel-section">
        <h3 className="section-title">Export</h3>
        <div className="button-group">
          <button 
            className="panel-button"
            onClick={() => handleExportClick(true)}
          >
            Export GLB
          </button>
          <button 
            className="panel-button"
            onClick={() => handleExportClick(false)}
          >
            Export GLTF
          </button>
        </div>
      </div>

      {/* Fourth area: Transform */}
      <div className="panel-section">
        <h3 className="section-title">Transform</h3>
        <div className="button-group">
          <button 
            className={`panel-button ${activeOperation === 'translate' && isObjectSelected ? 'active' : ''}`}
            onClick={() => handleObjectOperationClick('translate')}
            disabled={!isObjectSelected}
          >
            Move
          </button>
          <button 
            className={`panel-button ${activeOperation === 'rotate' && isObjectSelected ? 'active' : ''}`}
            onClick={() => handleObjectOperationClick('rotate')}
            disabled={!isObjectSelected}
          >
            Rotate
          </button>
          <button 
            className={`panel-button ${activeOperation === 'scale' && isObjectSelected ? 'active' : ''}`}
            onClick={() => handleObjectOperationClick('scale')}
            disabled={!isObjectSelected}
          >
            Scale
          </button>
        </div>
      </div>

      {/* Fifth area: Geometry */}
      <div className="panel-section">
        <h3 className="section-title">Geometry</h3>
        <div className="button-group">
          <button 
            className="panel-button"
            draggable="true"
            onDragStart={(e) => handleGeometryDragStart(e, 'cube')}
            onClick={() => handleGeometryClick('cube')}
          >
            Cube
          </button>
          <button 
            className="panel-button"
            draggable="true"
            onDragStart={(e) => handleGeometryDragStart(e, 'sphere')}
            onClick={() => handleGeometryClick('sphere')}
          >
            Sphere
          </button>
          <button 
            className="panel-button"
            draggable="true"
            onDragStart={(e) => handleGeometryDragStart(e, 'pyramid')}
            onClick={() => handleGeometryClick('pyramid')}
          >
            Pyramid
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeftPanel; 