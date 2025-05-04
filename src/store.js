import { create } from 'zustand';
import { sendToGPT, validateBuildingData } from './services/openaiService';

// Parameter name mapping table for normalizing parameter names
const parameterNameMap = {
  // Roof-related parameters
  'pitch_roof': 'roofPitch',
  'roof_pitch': 'roofPitch',
  'height_roof': 'roofHeight',
  'roof_height': 'roofHeight',
  'overhang_roof': 'roofOverhang',
  'roof_overhang': 'roofOverhang',
  'type_roof': 'roofType',
  'roof_type': 'roofType',
  
  // Wall-related parameters
  'thickness_wall': 'wallThickness',
  'wall_thickness': 'wallThickness',
  
  // Floor-related parameters
  'height_floor': 'floorHeight',
  'floor_height': 'floorHeight',
  
  // Window-related parameters
  'width_window': 'windowWidth',
  'window_width': 'windowWidth',
  'height_window': 'windowHeight',
  'window_height': 'windowHeight',
  
  // Door-related parameters
  'width_door': 'doorWidth',
  'door_width': 'doorWidth',
  'height_door': 'doorHeight',
  'door_height': 'doorHeight'
};

// Function to normalize parameter names
const normalizeParameterName = (paramName) => {
  // If it exists in the mapping table, return the mapped result
  if (parameterNameMap[paramName]) {
    return parameterNameMap[paramName];
  }
  
  // Remove duplicate parts, e.g., width_window_window => width_window
  const parts = paramName.split('_');
  if (parts.length > 1) {
    const uniqueParts = [];
    for (let i = 0; i < parts.length; i++) {
      if (i === 0 || parts[i] !== parts[i-1]) {
        uniqueParts.push(parts[i]);
      }
    }
    
    // Check if the normalized name is in the mapping table
    const normalizedName = uniqueParts.join('_');
    if (parameterNameMap[normalizedName]) {
      return parameterNameMap[normalizedName];
    }
    
    // Try converting to camelCase
    if (uniqueParts.length > 1) {
      const camelCaseName = uniqueParts[0] + uniqueParts.slice(1).map(
        part => part.charAt(0).toUpperCase() + part.slice(1)
      ).join('');
      return camelCaseName;
    }
    
    return normalizedName;
  }
  
  // If there's only one part, return it directly
  return paramName;
};

// Function to normalize parameter data
const normalizeParameterData = (paramData) => {
  if (!paramData || typeof paramData !== 'object') {
    return paramData;
  }
  
  // Create a new object to avoid modifying the original
  const normalizedData = { ...paramData };
  
  // Normalize parameter names
  if (normalizedData.key) {
    normalizedData.key = normalizeParameterName(normalizedData.key);
  }
  
  return normalizedData;
};

// Default building data
const defaultBuildingData = {
  building: {
    name: "SimpleHouse",
    floors: [
      {
        name: "FirstFloor",
        level: 0,
        height: 3000,
        material: {
          color: "#cccccc",
          opacity: 0.75
        },
        rooms: [
          {
            name: "LivingRoom",
            footprint: [
              [0, 0],
              [10000, 0],
              [10000, 8000],
              [0, 8000]
            ],
            walls: [
              {
                start: [0, 0],
                end: [10000, 0],
                thickness: 150,
                material: {
                  color: "#e8e8e8",
                  opacity: 0.5
                }
              },
              {
                start: [10000, 0],
                end: [10000, 8000],
                thickness: 150,
                material: {
                  color: "#e8e8e8",
                  opacity: 0.5
                },
                window: {
                  position: 1000,
                  verticalPosition: 1000,
                  width: 1500,
                  height: 1200,
                  depth: 155,
                  material: {
                    color: "#6fa7d1",
                    opacity: 0.3
                  }
                }
              },
              {
                start: [10000, 8000],
                end: [0, 8000],
                thickness: 150,
                material: {
                  color: "#e8e8e8",
                  opacity: 0.5
                },
                door: {
                  position: 1000,
                  width: 900,
                  height: 2100,
                  depth: 155,
                  material: {
                    color: "#8b4513",
                    opacity: 0.75
                  }
                }
              },
              {
                start: [0, 8000],
                end: [0, 0],
                thickness: 150,
                material: {
                  color: "#e8e8e8",
                  opacity: 0.5
                }
              }
            ]
          }
        ],
        roof: {
          type: "gabled",
          height: 1500,
          overhang: 500,
          pitch: 30,
          thickness: 50,
          material: {
            color: "#8b4513",
            opacity: 0.75
          }
        }
      }
    ]
  }
};

// Default slider options
const defaultSlides = [
  {
    key: 'roofType',
    title: 'Roof Type',
    options: [
      { value: 'gabled', label: 'Gabled Roof' },
      { value: 'flat', label: 'Flat Roof' },
      { value: 'pitched', label: 'Pitched Roof' }
    ]
  },
  {
    key: 'wallColor',
    title: 'Wall Color',
    options: [
      { value: '#f5f5f5', label: 'White' },
      { value: '#cccccc', label: 'Gray' },
      { value: '#8b4513', label: 'Brown' }
    ]
  },
  {
    key: 'windowColor',
    title: 'Window Color',
    options: [
      { value: '#88ccff', label: 'Light Blue' },
      { value: '#ffffff', label: 'White' },
      { value: '#cccccc', label: 'Gray' }
    ]
  }
];

// Default selected values
const defaultSelectedValues = {
  roofType: 'gabled',
  wallColor: '#f5f5f5',
  windowColor: '#88ccff'
};

const useStore = create((set, get) => ({
  // Building data
  buildingData: null,
  isLoading: true,
  error: null,

  // Chat messages
  messages: [],
  isLoadingChat: false,

  // Slider selector
  availableSlides: defaultSlides,
  selectedValues: defaultSelectedValues,

  // Progressive parameter adjustment state
  currentParameterIndex: 0,
  parameterAdjustmentComplete: false,
  nextParameter: null,
  parameterHistory: [],

  // Initialize the app
  initializeApp: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Starting app initialization...');
      // Try loading data from a local file
      console.log('Attempting to load data from /hs.json...');
      const response = await fetch('/hs.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Data loaded successfully:', data);
      
      // Check data structure
      if (!data || typeof data !== 'object') {
        console.error('Loaded data is not a valid object');
        set({ buildingData: defaultBuildingData, error: 'Loaded data is not a valid object', isLoading: false });
        return;
      }
      
      if (!data.building) {
        console.error('Data is missing the building property');
        set({ buildingData: defaultBuildingData, error: 'Data is missing the building property', isLoading: false });
        return;
      }
      
      // Validate data
      console.log('Starting data validation...');
      const validationResult = validateBuildingData(data);
      console.log('Validation result:', validationResult);
      
      if (!validationResult.valid) {
        console.error('Invalid building data:', validationResult.error);
        console.log('Using default building data as fallback...');
        set({ buildingData: defaultBuildingData, error: validationResult.error, isLoading: false });
        return;
      }
      
      console.log('Data validation passed, updating state...');
      set({ buildingData: data, error: null, isLoading: false });
    } catch (error) {
      console.error('Error loading building data:', error);
      console.log('Using default building data as fallback...');
      set({ buildingData: defaultBuildingData, error: error.message, isLoading: false });
    }
  },

  // Fetch initial building data
  fetchInitialBuildingData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Try fetching data from the server
      const response = await fetch('/api/building-data');
      
      // Check response type
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // If it's JSON, parse it
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        set({ buildingData: data, isLoading: false });
      } else {
        // If it's not JSON, try loading from a local file
        console.warn('Server did not return JSON, trying to load from local file');
        try {
          const localResponse = await fetch('/hs.json');
          if (!localResponse.ok) {
            throw new Error(`HTTP error! status: ${localResponse.status}`);
          }
          const localData = await localResponse.json();
          set({ buildingData: localData, isLoading: false });
        } catch (localError) {
          console.warn('Failed to load local JSON, using default building data');
          set({ buildingData: defaultBuildingData, isLoading: false });
        }
      }
    } catch (error) {
      console.error('Error fetching building data:', error);
      // Use default data in case of error
      set({ buildingData: defaultBuildingData, error: error.message, isLoading: false });
    }
  },

  // Update building data
  updateBuildingData: (newData) => {
    // Validate new building data
    const validationResult = validateBuildingData(newData);
    if (!validationResult.valid) {
      console.error('Invalid building data:', validationResult.error);
      set({ error: validationResult.error });
      return false;
    }
    
    // Ensure roof properties are in the correct place
    if (newData.building && newData.building.floors && newData.building.floors.length > 0) {
      // Find the highest floor
      const highestFloor = newData.building.floors.reduce((highest, floor) => {
        return (floor.level || 0) > (highest.level || 0) ? floor : highest;
      }, newData.building.floors[0]);
      
      // If the building has roof properties, move them to the highest floor
      if (newData.building.roof) {
        highestFloor.roof = newData.building.roof;
      }
    }
    
    set({ buildingData: newData, error: null });
    return true;
  },

  // Send chat message
  sendMessage: async (message) => {
    set((state) => ({
      messages: [...state.messages, { role: 'user', content: message }],
      isLoadingChat: true,
    }));

    try {
      // Try sending the message to the server
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          buildingData: useStore.getState().buildingData,
        }),
      });

      // Check response type
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // If it's JSON, parse it
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        set((state) => ({
          messages: [...state.messages, { role: 'assistant', content: data.response }],
          buildingData: data.buildingData || state.buildingData,
          isLoadingChat: false,
        }));
      } else {
        // If it's not JSON, use a default response
        console.warn('Server did not return JSON, using default response');
        set((state) => ({
          messages: [...state.messages, { role: 'assistant', content: 'Sorry, the server is temporarily unable to process your request.' }],
          isLoadingChat: false,
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      set((state) => ({
        messages: [...state.messages, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }],
        isLoadingChat: false,
      }));
    }
  },

  // Update available slides
  updateAvailableSlides: (slides) => {
    set({ availableSlides: slides });
  },

  // Update selected values
  updateSelectedValue: (slideKey, value) => {
    set((state) => ({
      selectedValues: {
        ...state.selectedValues,
        [slideKey]: value,
      },
    }));
  },
  
  // Handle slide selection and send to GPT
  handleSlideSelection: async (slideKey, value) => {
    // Update selected values
    set((state) => ({
      selectedValues: {
        ...state.selectedValues,
        [slideKey]: value,
      },
    }));
    
    // Construct user message
    let userMessage = '';
    const slide = get().availableSlides.find(s => s.key === slideKey);
    const option = slide.options.find(o => o.value === value);
    
    if (slide && option) {
      userMessage = `Change ${slide.title} to ${option.label}`;
    } else {
      userMessage = `Modify ${slideKey} to ${value}`;
    }
    
    // Add to message list
    set((state) => ({
      messages: [...state.messages, { role: 'user', content: userMessage }],
      isLoadingChat: true,
    }));
    
    try {
      // Get current building data
      const currentBuildingData = get().buildingData;
      
      // Send to GPT
      const result = await sendToGPT(userMessage, currentBuildingData);
      
      if (result.success) {
        // Check if it's parameter recommendation data
        if (result.isParameterRecommendation) {
          // If it's parameter recommendation data, update state directly
          set((state) => ({
            messages: [...state.messages, { role: 'assistant', content: result.message }],
            isLoadingChat: false,
            error: null
          }));
          return;
        }
        
        // Validate and update building data
        const validationResult = validateBuildingData(result.data);
        if (validationResult.valid) {
          set((state) => ({
            buildingData: result.data,
            messages: [...state.messages, { role: 'assistant', content: result.message }],
            isLoadingChat: false,
            error: null
          }));
        } else {
          // Data validation failed
          set((state) => ({
            messages: [...state.messages, { role: 'assistant', content: `Error: ${validationResult.error}` }],
            isLoadingChat: false,
            error: validationResult.error
          }));
        }
      } else {
        // GPT processing failed
        set((state) => ({
          messages: [...state.messages, { role: 'assistant', content: `Error: ${result.error}` }],
          isLoadingChat: false,
          error: result.error
        }));
      }
    } catch (error) {
      console.error('Error processing slide selection:', error);
      set((state) => ({
        messages: [...state.messages, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }],
        isLoadingChat: false,
        error: error.message
      }));
    }
  },
  
  // Send message directly to GPT
  sendToGPT: async (message) => {
    // Add to message list
    set((state) => ({
      messages: [...state.messages, { role: 'user', content: message }],
      isLoadingChat: true,
    }));
    
    try {
      // Get current building data
      const currentBuildingData = get().buildingData;
      
      // Send to GPT
      const result = await sendToGPT(message, currentBuildingData);
      
      if (result.success) {
        // Check if it's parameter recommendation data
        if (result.isParameterRecommendation) {
          // If it's parameter recommendation data, update state directly
          set((state) => ({
            messages: [...state.messages, { role: 'assistant', content: result.message }],
            isLoadingChat: false,
            error: null
          }));
          return;
        }
        
        // Validate and update building data
        const validationResult = validateBuildingData(result.data);
        if (validationResult.valid) {
          set((state) => ({
            buildingData: result.data,
            messages: [...state.messages, { role: 'assistant', content: result.message }],
            isLoadingChat: false,
            error: null
          }));
        } else {
          // Data validation failed
          set((state) => ({
            messages: [...state.messages, { role: 'assistant', content: `Error: ${validationResult.error}` }],
            isLoadingChat: false,
            error: validationResult.error
          }));
        }
      } else {
        // GPT processing failed
        set((state) => ({
          messages: [...state.messages, { role: 'assistant', content: `Error: ${result.error}` }],
          isLoadingChat: false,
          error: result.error
        }));
      }
    } catch (error) {
      console.error('Error sending message to GPT:', error);
      set((state) => ({
        messages: [...state.messages, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }],
        isLoadingChat: false,
        error: error.message
      }));
    }
  },

  // Set the next parameter
  setNextParameter: async (isFirstCall = false) => {
    try {
      // Get current building data
      const currentBuildingData = get().buildingData;
      
      // If it's the first call, add random initial parameter selection logic
      if (isFirstCall) {
        console.log('First call to setNextParameter, randomly selecting initial parameter...');
        
        // Initial parameter candidate list - these are basic building parameters suitable as a starting point
        const initialParameters = [
          {
            key: 'height',
            label: 'Building Height',
            min: 2500,
            max: 4000,
            value: 3000,
            step: 100,
            description: 'Building height determines the overall sense of space and proportion. Generally, a residential building height of 2700-3500 mm is comfortable, providing a good sense of space without wasting energy. Higher ceilings offer better ventilation and lighting but increase construction and heating costs.'
          },
          {
            key: 'floorCount',
            label: 'Number of Floors',
            min: 1,
            max: 4,
            value: 1,
            step: 1,
            description: 'The number of floors directly affects the usable area and vertical space distribution of the building. Single-story buildings are suitable for the elderly and those with mobility issues, while multi-story buildings can provide more space on limited land. Considering building performance and fire safety, ordinary residential buildings are usually 1-3 stories.'
          },
          {
            key: 'wallThickness',
            label: 'Wall Thickness',
            min: 100,
            max: 400,
            value: 200,
            step: 10,
            description: 'Wall thickness affects the building\'s insulation performance, structural stability, and sound insulation. Generally, an exterior wall thickness of 200-300 mm is reasonable, providing good insulation; interior walls can be 100-150 mm to meet load-bearing and sound insulation needs. Thicker walls contribute to the building\'s long-term stability.'
          },
          {
            key: 'roofHeight',
            label: 'Roof Height',
            min: 500,
            max: 2500,
            value: 1500,
            step: 100,
            description: 'Adjusting roof height can change the building\'s silhouette and sense of space. Higher roofs provide better drainage and insulation performance and can increase attic space. It is recommended to choose an appropriate roof height based on the overall building height, usually 1/4 to 1/3 of the total height, to maintain harmonious proportions.'
          },
          {
            key: 'roofPitch',
            label: 'Roof Pitch',
            min: 0,
            max: 60,
            value: 30,
            step: 5,
            description: 'Roof pitch determines the drainage effect and style characteristics of the roof. Steeper pitches (30-45 degrees) are suitable for areas with heavy rain and snow, effectively draining water and preventing snow accumulation; gentler pitches (15-25 degrees) are more suitable for dry climates and can bring a modern minimalist feel. The pitch choice should also consider the surrounding building style to maintain environmental harmony.'
          },
          {
            key: 'totalArea',
            label: 'Total Building Area',
            min: 50,
            max: 300,
            value: 100,
            step: 10,
            description: 'Building area is a basic parameter for functional zoning. A modern comfortable single-person residence usually requires 60-80 square meters, while a family residence requires 100-150 square meters or more. Increasing the area can provide more spacious living space but also increases construction and maintenance costs. Choose an appropriate area based on the number of residents, lifestyle, and economic conditions.'
          }
        ];
        
        // Randomly select a parameter (or can be set to the first in the array)
        const randomIndex = Math.floor(Math.random() * initialParameters.length);
        const initialParam = initialParameters[randomIndex];
        
        console.log(`Randomly selected initial parameter: ${initialParam.key}`);
        
        // Update state
        set((state) => ({ 
          nextParameter: initialParam,
          parameterAdjustmentComplete: false,
          currentParameterIndex: state.currentParameterIndex
        }));
        
        return;
      }
      
      // For non-first calls, use the original logic to request parameter recommendations from GPT
      // Construct a more detailed prompt message
      const prompt = `Please recommend the next parameter to adjust based on the current building state, and describe the parameter in a naturally friendly tone.
Current adjusted parameters: ${get().parameterHistory.join(', ')}

Please ensure the following rules are followed when recommending parameters:
1. Avoid recommending parameters that have already been adjusted
2. The returned JSON format must include fields such as key, label, min, max, value
3. Parameter naming follows camelCase, such as roofHeight, wallThickness
4. Do not repeat element types in the key, for example, use "roofPitch" instead of "pitch_roof"

For color parameters, please specify which element's color it is:
1. For roof color, use "element": "roof"
2. For wall color, use "element": "wall"
3. For window color, use "element": "window"
4. For door color, use "element": "door"
5. For floor color, use "element": "floor"

It is recommended to avoid recommending the same element's color that has already been adjusted.`;
      
      // Send to GPT
      const result = await sendToGPT(prompt, currentBuildingData);
      
      if (result.success) {
        // Check if it's parameter recommendation format
        if (result.isParameterRecommendation) {
          // Normalize parameter names
          const normalizedData = normalizeParameterData(result.data);
          
          // Ensure color parameters have an element type
          if ((normalizedData.key.includes('color') || normalizedData.key.includes('material')) && !normalizedData.element) {
            console.warn('Color parameter missing element type, adding default value');
            normalizedData.element = 'general';
          }
          
          // Set the next parameter
          set((state) => ({ 
            nextParameter: normalizedData,
            parameterAdjustmentComplete: false,
            currentParameterIndex: state.currentParameterIndex
          }));
          
          // Only add parameter recommendation message to the conversation history if it's not the first call
          if (!isFirstCall) {
            set((state) => ({
              messages: [...state.messages, { role: 'assistant', content: result.message }],
            }));
          }
          
          return;
        }
        console.error('Returned data is not in parameter recommendation format');
      } else {
        console.error('Failed to get next parameter:', result.error);
      }
    } catch (error) {
      console.error('Error setting next parameter:', error);
    }
  },
  
  // Complete current parameter adjustment
  completeParameterAdjustment: (parameter, element) => {
    // Normalize parameter identifier
    const normalizedParameter = normalizeParameterName(parameter);
    
    // Create a full parameter identifier with element type
    const fullParameter = element ? `${normalizedParameter}.${element}` : normalizedParameter;
    
    set((state) => ({
      currentParameterIndex: state.currentParameterIndex + 1,
      parameterAdjustmentComplete: true,
      parameterHistory: [...state.parameterHistory, fullParameter]
    }));
  },
  
  // Reset parameter adjustment state
  resetParameterAdjustment: () => {
    set({
      currentParameterIndex: 0,
      parameterAdjustmentComplete: false,
      nextParameter: null,
      parameterHistory: []
    });
  },

  // Handle parameter change and send to GPT
  handleParameterChange: async (param, value, userMessage) => {
    // Add to message list
    set((state) => ({
      messages: [...state.messages, { role: 'user', content: userMessage }],
      isLoadingChat: true,
    }));
    
    try {
      // Get current building data
      const currentBuildingData = get().buildingData;
      
      // Send to GPT
      const result = await sendToGPT(userMessage, currentBuildingData);
      
      if (result.success) {
        // Check if it's parameter recommendation data
        if (result.isParameterRecommendation) {
          // If it's parameter recommendation data, update state directly
          set((state) => ({
            messages: [...state.messages, { role: 'assistant', content: result.message }],
            isLoadingChat: false,
            error: null,
            parameterAdjustmentComplete: true
          }));
          
          // Get the next parameter
          await get().setNextParameter();
          return;
        }
        
        // Validate and update building data
        const validationResult = validateBuildingData(result.data);
        if (validationResult.valid) {
          // Update state and record response message
          await new Promise(resolve => {
            set((state) => ({
              buildingData: result.data,
              messages: [...state.messages, { role: 'assistant', content: result.message }],
              isLoadingChat: false,
              error: null,
              parameterAdjustmentComplete: true
            }));
            // Use setTimeout to ensure state update is complete
            setTimeout(resolve, 50);
          });
          
          // Get the next parameter
          await get().setNextParameter();
        } else {
          // Data validation failed
          set((state) => ({
            messages: [...state.messages, { role: 'assistant', content: `Error: ${validationResult.error}` }],
            isLoadingChat: false,
            error: validationResult.error
          }));
        }
      } else {
        // GPT processing failed
        set((state) => ({
          messages: [...state.messages, { role: 'assistant', content: `Error: ${result.error}` }],
          isLoadingChat: false,
          error: result.error
        }));
      }
    } catch (error) {
      console.error('Error processing parameter change:', error);
      set((state) => ({
        messages: [...state.messages, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }],
        isLoadingChat: false,
        error: error.message
      }));
    }
  },
}));

export default useStore; 