# ArchTalk-Playground User Manual

## Overview
ArchTalk-Playground is a 3D architectural visualization and modeling tool that allows you to view, manipulate, and transform building models in a 3D environment.

## Interface Layout
The application consists of several main components:
- 3D Viewport: The main area where the model is displayed
- Left Panel: Contains various control buttons and tools
- Right Panel: Building Modification and Generation
- Statistics Window: Shows building information in the top-left corner
- Object Info Window: Displays selected object details in the top-right corner

## View Controls
### View Modes
- **Perspective View**: Default 3D view with perspective projection
- **Isometric View**: Orthographic view showing the model without perspective distortion
- **ViewCube**: Interactive cube in the top-right corner for quick view orientation

### Camera Controls
- **Orbit**: Right-click and drag to rotate the view
- **Pan**: Middle-click and drag to move the view
- **Zoom**: Scroll wheel to zoom in/out
- **Shift + Right-click**: Pan the view

## Tools and Features

### Geometry Tools
Located in the "Geometry" section of the left panel:
- **Cube**: Add a 2x2x2 cube to the scene
- **Sphere**: Add a sphere with radius 1
- **Pyramid**: Add a four-sided pyramid
- **Usage**: 
  - Click to place in front of the camera
  - Drag and drop to place at a specific location

### Transform Tools
Located in the "Transform" section:
- **Move**: Translate selected objects
- **Rotate**: Rotate selected objects
- **Scale**: Resize selected objects
- **Usage**: 
  1. Select an object by clicking on it
  2. Choose the desired transform tool
  3. Use the transform gizmo to manipulate the object

### Interior Tools
Located in the "Interior" section:
- **Room**: Toggle room labels visibility
- **Outline**: Toggle object outlines
- **Mesh**: Toggle ground grid visibility
- **Clip Plane**: Add a clipping plane to cut through the model

### Export Tools
Located in the "Export" section:
- **Export GLB**: Export the model in binary GLTF format
- **Export GLTF**: Export the model in JSON-based GLTF format

## Building Modification and Generation

### Text-Based Building Modification
Located in the "Modify" section of the right panel:
- **Text Prompt**: Enter natural language descriptions to modify the building
- **Usage**:
  1. Type your modification request in the text input field
  2. Examples of valid prompts:
     - "Add a second floor with 3 bedrooms and 2 bathrooms"
     - "Make the building 20% taller"
     - "Add a garage on the left side"
     - "Change the roof style to gabled"
     - "Add windows to the north-facing wall"
  3. Press Enter or click "Apply" to execute the changes

### Parameter-Based Modification
Located in the lower right corner of the right panel: 
- **Building Parameter Controls**: Generated according to the current state of the building model.
- **Usage**:
  1. Drag sliders to adjust values
  2. Changes are applied in real-time
  3. Multiple parameters can be adjusted 

### Building Generation
Located in the "Generate" section:
- **Text Prompt**: Enter detailed building descriptions to generate new buildings
- **Usage**:
  1. Type a comprehensive description of the desired building
  2. Examples of valid prompts:
     - "Create a U-shaped adobe house with thick earthen walls and a traditional timber beam flat roof. Include four bedrooms around a central courtyard, a communal living space, and a shaded veranda. Bedrooms should each have a small window, and the main entry should face the prevailing wind for natural cooling."
     - "I want to design a house for a six person family. Three bedrooms are required, the parents may need a reading studio, the kids want a room for play, and they also need a large storage. The house only needs one story."
     - "Create a light-filled single-floor beach house for a nature photographer. The living area should be 6m × 6m with floor-to-ceiling windows on the west side facing the ocean. Include one darkroom (2.5m × 3m) with no external windows. The entrance should be from the south with a sliding glass door. Add a small bedroom (3m × 4m) and an outdoor shower area next to the back entrance."
  3. Press Enter or click "Generate" to create the building
  4. The system will generate a 3D model based on your description

### Best Practices for Text Prompts
1. Be specific about dimensions and proportions
2. Include architectural style references
3. Mention key features and elements
4. Specify materials and finishes when relevant
5. Include spatial relationships between elements
6. Example of a good prompt:
   "Generate a three-story modern house with:
   - 2000 sq ft per floor
   - Floor-to-ceiling windows on the south side
   - Flat roof with solar panels
   - Attached two-car garage
   - Open floor plan on the first floor
   - 4 bedrooms and 3 bathrooms
   - Balcony on the master bedroom"

### Combining Tools
You can combine different modification methods:
1. Start with a generated building
2. Use sliders to adjust basic dimensions
3. Apply text prompts for detailed modifications
4. Use transform tools for fine-tuning
5. Export the final result

## Working with Objects

### Selecting Objects
- Click on any object to select it
- Selected objects will be highlighted
- Object information will appear in the top-right panel

### Transforming Objects
1. Select an object
2. Choose a transform tool (Move/Rotate/Scale)
3. Use the transform gizmo:
   - Red: X-axis
   - Green: Y-axis
   - Blue: Z-axis
   - Yellow: Free movement/rotation

### Adding Geometry
1. Click on a geometry button (Cube/Sphere/Pyramid) to add it in front of the camera
2. Or drag and drop the geometry button to place it at a specific location
3. The new geometry will be automatically selected

### Using Clipping Planes
1. Click the "Clip Plane" button to add a clipping plane
2. Use the transform tools to position and orient the plane
3. The model will be clipped along the plane
4. Press ESC to remove the clipping plane

## Tips and Best Practices
1. Use the ViewCube for quick view orientation
2. Hold Shift while transforming for more precise control
3. Use the grid for better spatial reference
4. Toggle outlines for better visibility of complex models
5. Use clipping planes to inspect interior spaces

## Keyboard Shortcuts
- **ESC**: Cancel current operation or remove clipping plane
- **Shift + Right-click**: Pan the view
- **Middle-click + Drag**: Pan the view
- **Right-click + Drag**: Orbit the view
- **Scroll Wheel**: Zoom in/out

## Troubleshooting
- If objects don't respond to selection, ensure they are not locked or hidden
- If transform tools don't appear, make sure an object is selected
- If the view becomes unresponsive, try resetting the view using the ViewCube
- If geometry placement seems off, check that you're not trying to place inside other objects