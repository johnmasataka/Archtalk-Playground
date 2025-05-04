import React, { useEffect, useRef, Component } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import BuildingModel from './components/BuildingModel';
import SlideSelector from './components/SlideSelector';
import ParameterControls from './components/ParameterControls';
import LeftPanel from './components/LeftPanel';
import useStore from './store';

// error boundary component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('application error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>application error</h2>
          <p>{this.state.error && this.state.error.toString()}</p>
          <button onClick={() => window.location.reload()}>refresh page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const { buildingData, isLoading, error, initializeApp, updateAvailableSlides } = useStore();
  const modelContainerRef = useRef(null);

  useEffect(() => {
    console.log('App component mounted, starting initialization...');
    initializeApp();
    
    // initialize availableSlides
    updateAvailableSlides([
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
    ]);
  }, [initializeApp, updateAvailableSlides]);

  // show loading status
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // show error message
  if (error) {
    return (
      <div className="error">
        <h2>loading error</h2>
        <p>{error}</p>
        <button onClick={initializeApp}>retry</button>
      </div>
    );
  }

  // check if building data exists
  if (!buildingData || !buildingData.building) {
    return (
      <div className="error">
        <h2>data error</h2>
        <p>building data is invalid or empty</p>
        <button onClick={initializeApp}>retry</button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="app-container">
      <LeftPanel />
      <div className="model-section">
        <div id="building-model" className="model-container" ref={modelContainerRef}>
            <BuildingModel buildingData={buildingData} />
        </div>
      </div>
      <div className="panel-section">
        <div className="chat-section">
          <ChatInterface />
        </div>
        <div className="selector-section">
          <ParameterControls />
          <div className="slide-selector">
            <SlideSelector />
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}

export default App; 