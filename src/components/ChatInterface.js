import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import './ChatInterface.css';

const ChatInterface = () => {
  const { messages, sendToGPT, isLoadingChat } = useStore();
  const [inputValue, setInputValue] = useState('');
  const [typingMessages, setTypingMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingMessages]);

  // 处理新消息的打字效果
  useEffect(() => {
    // 如果有新消息添加，并且是AI回复
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      const latestMessage = messages[messages.length - 1];
      
      // 检查这条消息是否已经在typingMessages中
      const messageExists = typingMessages.some(m => m.id === messages.length - 1);
      
      if (!messageExists) {
        // 创建新的打字消息
        const newTypingMessage = {
          id: messages.length - 1,
          role: latestMessage.role,
          content: '',
          fullContent: latestMessage.content,
          currentIndex: 0,
          isComplete: false
        };
        
        setTypingMessages(prev => [...prev.filter(m => m.id !== newTypingMessage.id), newTypingMessage]);
      }
    }
  }, [messages]);

  // 打字效果的计时器
  useEffect(() => {
    // 找到所有未完成的打字消息
    const incompleteMessages = typingMessages.filter(msg => !msg.isComplete);
    
    if (incompleteMessages.length > 0) {
      const typingInterval = setInterval(() => {
        setTypingMessages(prevTypingMessages => {
          return prevTypingMessages.map(msg => {
            if (!msg.isComplete) {
              const nextIndex = msg.currentIndex + 1;
              const nextChar = msg.fullContent[msg.currentIndex];
              
              if (nextIndex > msg.fullContent.length) {
                return { ...msg, isComplete: true };
              }
              
              return {
                ...msg,
                content: msg.content + nextChar,
                currentIndex: nextIndex
              };
            }
            return msg;
          });
        });
      }, 2); // 打字速度 
      
      return () => clearInterval(typingInterval);
    }
  }, [typingMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoadingChat) {
      sendToGPT(inputValue);
      setInputValue('');
    }
  };

  // 根据消息ID查找对应的打字效果消息
  const getTypingMessage = (index, message) => {
    const typingMsg = typingMessages.find(m => m.id === index);
    
    if (typingMsg && message.role === 'assistant') {
      return typingMsg.content;
    }
    
    return message.content;
  };
  
  const toggleApiKeyModal = () => {
    setShowApiKeyModal(!showApiKeyModal);
  };

  const toggleHelpModal = () => {
    setShowHelpModal(!showHelpModal);
  };

  return (
    <>
      {showHelpModal && (
        <div className="help-modal-overlay" onClick={toggleHelpModal}>
          <div className="help-modal" onClick={e => e.stopPropagation()}>
            <div className="help-content">
              <h1>ArchTalk-Playground User Manual</h1>
              
              <section className="help-section">
                <h2>Overview</h2>
                <p>ArchTalk-Playground is a 3D architectural visualization and modeling tool that allows you to view, manipulate, and transform building models in a 3D environment.</p>
              </section>

              <section className="help-section">
                <h2>Interface Layout</h2>
                <p>The application consists of several main components:</p>
                <ul>
                  <li><strong>3D Viewport</strong>: The main area where the model is displayed</li>
                  <li><strong>Left Panel</strong>: Contains various control buttons and tools</li>
                  <li><strong>Right Panel</strong>: Building Modification and Generation</li>
                  <li><strong>Statistics Window</strong>: Shows building information in the top-left corner</li>
                  <li><strong>Object Info Window</strong>: Displays selected object details in the top-right corner</li>
                </ul>
              </section>

              <section className="help-section">
                <h2>View Controls</h2>
                <h3>View Modes</h3>
                <ul>
                  <li><strong>Perspective View</strong>: Default 3D view with perspective projection</li>
                  <li><strong>Isometric View</strong>: Orthographic view showing the model without perspective distortion</li>
                  <li><strong>ViewCube</strong>: Interactive cube in the top-right corner for quick view orientation</li>
                </ul>

                <h3>Camera Controls</h3>
                <ul>
                  <li><strong>Orbit</strong>: Right-click and drag to rotate the view</li>
                  <li><strong>Pan</strong>: Middle-click and drag to move the view</li>
                  <li><strong>Zoom</strong>: Scroll wheel to zoom in/out</li>
                  <li><strong>Shift + Right-click</strong>: Pan the view</li>
                </ul>
              </section>

              <section className="help-section">
                <h2>Tools and Features</h2>
                
                <h3>Geometry Tools</h3>
                <p>Located in the "Geometry" section of the left panel:</p>
                <ul>
                  <li><strong>Cube</strong>: Add a 2x2x2 cube to the scene</li>
                  <li><strong>Sphere</strong>: Add a sphere with radius 1</li>
                  <li><strong>Pyramid</strong>: Add a four-sided pyramid</li>
                </ul>
                <p><strong>Usage</strong>:</p>
                <ul>
                  <li>Click to place in front of the camera</li>
                  <li>Drag and drop to place at a specific location</li>
                </ul>

                <h3>Transform Tools</h3>
                <p>Located in the "Transform" section:</p>
                <ul>
                  <li><strong>Move</strong>: Translate selected objects</li>
                  <li><strong>Rotate</strong>: Rotate selected objects</li>
                  <li><strong>Scale</strong>: Resize selected objects</li>
                </ul>
                <p><strong>Usage</strong>:</p>
                <ol>
                  <li>Select an object by clicking on it</li>
                  <li>Choose the desired transform tool</li>
                  <li>Use the transform gizmo to manipulate the object</li>
                </ol>

                <h3>Interior Tools</h3>
                <p>Located in the "Interior" section:</p>
                <ul>
                  <li><strong>Room</strong>: Toggle room labels visibility</li>
                  <li><strong>Outline</strong>: Toggle object outlines</li>
                  <li><strong>Mesh</strong>: Toggle ground grid visibility</li>
                  <li><strong>Clip Plane</strong>: Add a clipping plane to cut through the model</li>
                </ul>

                <h3>Export Tools</h3>
                <p>Located in the "Export" section:</p>
                <ul>
                  <li><strong>Export GLB</strong>: Export the model in binary GLTF format</li>
                  <li><strong>Export GLTF</strong>: Export the model in JSON-based GLTF format</li>
                </ul>
              </section>

              <section className="help-section">
                <h2>Building Modification and Generation</h2>
                
                <h3>Text-Based Building Modification</h3>
                <p>Located in the "Modify" section of the right panel:</p>
                <p><strong>Text Prompt</strong>: Enter natural language descriptions to modify the building</p>
                <p><strong>Usage</strong>:</p>
                <ol>
                  <li>Type your modification request in the text input field</li>
                  <li>Examples of valid prompts:
                    <ul>
                      <li>"Add a second floor with 3 bedrooms and 2 bathrooms"</li>
                      <li>"Make the building 20% taller"</li>
                      <li>"Add a garage on the left side"</li>
                      <li>"Change the roof style to gabled"</li>
                      <li>"Add windows to the north-facing wall"</li>
                    </ul>
                  </li>
                  <li>Press Enter or click "Apply" to execute the changes</li>
                </ol>

                <h3>Parameter-Based Modification</h3>
                <p>Located in the lower right corner of the right panel:</p>
                <p><strong>Building Parameter Controls</strong>: Generated according to the current state of the building model.</p>
                <p><strong>Usage</strong>:</p>
                <ol>
                  <li>Drag sliders to adjust values</li>
                  <li>Changes are applied in real-time</li>
                  <li>Multiple parameters can be adjusted</li>
                </ol>

                <h3>Building Generation</h3>
                <p>Located in the "Generate" section:</p>
                <p><strong>Text Prompt</strong>: Enter detailed building descriptions to generate new buildings</p>
                <p><strong>Usage</strong>:</p>
                <ol>
                  <li>Type a comprehensive description of the desired building</li>
                  <li>Examples of valid prompts:
                    <ul>
                      <li>"Create a U-shaped adobe house with thick earthen walls and a traditional timber beam flat roof. Include four bedrooms around a central courtyard, a communal living space, and a shaded veranda. Bedrooms should each have a small window, and the main entry should face the prevailing wind for natural cooling."</li>
                      <li>"I want to design a house for a six person family. Three bedrooms are required, the parents may need a reading studio, the kids want a room for play, and they also need a large storage. The house only needs one story."</li>
                      <li>"Create a light-filled single-floor beach house for a nature photographer. The living area should be 6m × 6m with floor-to-ceiling windows on the west side facing the ocean. Include one darkroom (2.5m × 3m) with no external windows. The entrance should be from the south with a sliding glass door. Add a small bedroom (3m × 4m) and an outdoor shower area next to the back entrance."</li>
                    </ul>
                  </li>
                  <li>Press Enter or click "Generate" to create the building</li>
                  <li>The system will generate a 3D model based on your description</li>
                </ol>

                <h3>Best Practices for Text Prompts</h3>
                <ol>
                  <li>Be specific about dimensions and proportions</li>
                  <li>Include architectural style references</li>
                  <li>Mention key features and elements</li>
                  <li>Specify materials and finishes when relevant</li>
                  <li>Include spatial relationships between elements</li>
                </ol>
                <p>Example of a good prompt:</p>
                <blockquote>
                  "Generate a three-story modern house with:
                  <ul>
                    <li>2000 sq ft per floor</li>
                    <li>Floor-to-ceiling windows on the south side</li>
                    <li>Flat roof with solar panels</li>
                    <li>Attached two-car garage</li>
                    <li>Open floor plan on the first floor</li>
                    <li>4 bedrooms and 3 bathrooms</li>
                    <li>Balcony on the master bedroom"</li>
                  </ul>
                </blockquote>

                <h3>Combining Tools</h3>
                <p>You can combine different modification methods:</p>
                <ol>
                  <li>Start with a generated building</li>
                  <li>Use sliders to adjust basic dimensions</li>
                  <li>Apply text prompts for detailed modifications</li>
                  <li>Use transform tools for fine-tuning</li>
                  <li>Export the final result</li>
                </ol>
              </section>

              <section className="help-section">
                <h2>Working with Objects</h2>
                
                <h3>Selecting Objects</h3>
                <ul>
                  <li>Click on any object to select it</li>
                  <li>Selected objects will be highlighted</li>
                  <li>Object information will appear in the top-right panel</li>
                </ul>

                <h3>Transforming Objects</h3>
                <ol>
                  <li>Select an object</li>
                  <li>Choose a transform tool (Move/Rotate/Scale)</li>
                  <li>Use the transform gizmo:
                    <ul>
                      <li>Red: X-axis</li>
                      <li>Green: Y-axis</li>
                      <li>Blue: Z-axis</li>
                      <li>Yellow: Free movement/rotation</li>
                    </ul>
                  </li>
                </ol>

                <h3>Adding Geometry</h3>
                <ol>
                  <li>Click on a geometry button (Cube/Sphere/Pyramid) to add it in front of the camera</li>
                  <li>Or drag and drop the geometry button to place it at a specific location</li>
                  <li>The new geometry will be automatically selected</li>
                </ol>

                <h3>Using Clipping Planes</h3>
                <ol>
                  <li>Click the "Clip Plane" button to add a clipping plane</li>
                  <li>Use the transform tools to position and orient the plane</li>
                  <li>The model will be clipped along the plane</li>
                  <li>Press ESC to remove the clipping plane</li>
                </ol>
              </section>

              <section className="help-section">
                <h2>Tips and Best Practices</h2>
                <ol>
                  <li>Use the ViewCube for quick view orientation</li>
                  <li>Hold Shift while transforming for more precise control</li>
                  <li>Use the grid for better spatial reference</li>
                  <li>Toggle outlines for better visibility of complex models</li>
                  <li>Use clipping planes to inspect interior spaces</li>
                </ol>
              </section>

              <section className="help-section">
                <h2>Keyboard Shortcuts</h2>
                <ul>
                  <li><strong>ESC</strong>: Cancel current operation or remove clipping plane</li>
                  <li><strong>Shift + Right-click</strong>: Pan the view</li>
                  <li><strong>Middle-click + Drag</strong>: Pan the view</li>
                  <li><strong>Right-click + Drag</strong>: Orbit the view</li>
                  <li><strong>Scroll Wheel</strong>: Zoom in/out</li>
                </ul>
              </section>

              <section className="help-section">
                <h2>Troubleshooting</h2>
                <ul>
                  <li>If objects don't respond to selection, ensure they are not locked or hidden</li>
                  <li>If transform tools don't appear, make sure an object is selected</li>
                  <li>If the view becomes unresponsive, try resetting the view using the ViewCube</li>
                  <li>If geometry placement seems off, check that you're not trying to place inside other objects</li>
                </ul>
              </section>

              <button className="help-close-button" onClick={toggleHelpModal}>Close</button>
            </div>
          </div>
        </div>
      )}
      <div className="chat-interface">
        <div className="controls-bar">
          <button className="control-button" onClick={toggleApiKeyModal}>OpenAI API Key</button>
          <button className="control-button">Setting</button>
          <button className="control-button" onClick={toggleHelpModal}>Help</button>
          <a href="https://johnmasataka.github.io/Archtalk/" target="_blank" rel="noopener noreferrer">
            <button className="control-button">Home</button>
          </a>
        </div>
        
        {showApiKeyModal && (
          <div className="api-key-modal">
            <div className="api-key-content">
              <div className="api-key-input-container">
                <input type="text" placeholder="Enter your OpenAI API Key" className="api-key-input" />
                <button className="api-key-button">OK</button>
              </div>
              <div className="api-key-warning">
                Note that this isn't best practice to enter an API key into a web app like this. 
                While it isn't stored outside of your browser, a malicious script or browser 
                extension could still access it. Ensure your account has strict limits on API 
                spend and change this API key often.
              </div>
              <div className="api-key-help">
                <a href="#" className="api-key-link">How to get OpenAI API Key?</a>
              </div>
            </div>
          </div>
        )}
        
        <div className="chat-header">
          <h3>Archtalk</h3>
        </div>
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message-container ${message.role === 'user' ? 'user-container' : 'system-container'}`}
            >
              {message.role !== 'user' && (
                <div className="avatar system-avatar">AI</div>
              )}
              <div
                className={`message ${message.role === 'user' ? 'user-message' : 'system-message'}`}
              >
                {getTypingMessage(index, message)}
              </div>
              {message.role === 'user' && (
                <div className="avatar user-avatar">User</div>
              )}
            </div>
          ))}
          {isLoadingChat && (
            <div className="message-container system-container">
              <div className="avatar system-avatar">AI</div>
              <div className="message system-message">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input" onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter prompt (optional)..."
              disabled={isLoadingChat}
            />
            <button type="submit" disabled={isLoadingChat || !inputValue.trim()}>
              Send
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatInterface; 