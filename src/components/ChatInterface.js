import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import './ChatInterface.css';

const ChatInterface = () => {
  const { messages, sendToGPT, isLoadingChat } = useStore();
  const [inputValue, setInputValue] = useState('');
  const [typingMessages, setTypingMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

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

  return (
    <div className="chat-interface">
      <div className="controls-bar">
        <button className="control-button" onClick={toggleApiKeyModal}>OpenAI API Key</button>
        <button className="control-button">Setting</button>
        <button className="control-button">Help</button>
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
  );
};

export default ChatInterface; 