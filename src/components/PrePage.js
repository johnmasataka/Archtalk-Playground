import React, { useState } from 'react';
import './PrePage.css';
import { updateOpenAIInstance } from '../services/openaiInstance';
import { setOpenAIApiKey } from '../services/openaiConfig';

const translations = {
  en: {
    header: "Please enter your OpenAI API Key to access the playground.",
    go: "GO",
    warning: "Note that this isn't best practice to enter an API key into a web app like this. While it isn't stored outside of your browser, a malicious script or browser extension could still access it. Ensure your account has strict limits on API spend and change this API key often.",
    howToGetKey: "How to get OpenAI API Key?",
    requestTestKey: "Request a test key"
  },
  ja: {
    header: "プレイグラウンドにアクセスするには、OpenAI API キーを入力してください。",
    go: "開始",
    warning: "WebアプリにAPIキーを入力することは、ベストプラクティスではありません。ブラウザの外部に保存されないとはいえ、悪意のあるスクリプトやブラウザ拡張機能がアクセスする可能性があります。APIの使用制限を厳しく設定し、APIキーを頻繁に変更してください。",
    howToGetKey: "OpenAI API キーの取得方法",
    requestTestKey: "テストキーをリクエスト"
  },
  'zh-CN': {
    header: "请输入您的 OpenAI API 密钥以访问 playground.",
    go: "开始",
    warning: "请注意，在网页应用中输入 API 密钥并不是最佳实践。虽然密钥不会存储在浏览器外部，但恶意脚本或浏览器扩展程序仍可能访问它。请确保您的账户设置了严格的 API 使用限制，并经常更改此 API 密钥。",
    howToGetKey: "如何获取 OpenAI API 密钥？",
    requestTestKey: "申请测试密钥"
  },
  'zh-TW': {
    header: "請輸入您的 OpenAI API 金鑰以訪問 playground。",
    go: "開始",
    warning: "請注意，在網頁應用中輸入 API 金鑰並不是最佳實踐。雖然金鑰不會存儲在瀏覽器外部，但惡意腳本或瀏覽器擴展程序仍可能訪問它。請確保您的帳戶設置了嚴格的 API 使用限制，並經常更改此 API 金鑰。",
    howToGetKey: "如何獲取 OpenAI API 金鑰？",
    requestTestKey: "申請測試金鑰"
  }
};

const PrePage = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [languageCode, setLanguageCode] = useState('en');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'zh-CN', name: '简体中文' },
    { code: 'zh-TW', name: '繁體中文' }
  ];

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language.name);
    setLanguageCode(language.code);
    setShowLanguageMenu(false);
    // TODO: Implement language change logic
  };

  const validateApiKey = (key) => {
    if (!key || key.trim() === '') {
      return {valid: false, message: 'Please enter your key'};
    }
    
    // Basic format check
    if (!key.startsWith('sk-')) {
      return {valid: false, message: 'API key should start with "sk-"'};
    }
    
    return {valid: true};
  };

  const handleSubmit = () => {
    // Validate API key
    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Submitting API key:', apiKey.substring(0, 3) + '...');
      
      // Detect if it's a project-level API key
      const isProjectKey = apiKey.startsWith('sk-proj-');
      if (isProjectKey) {
        console.log('Detected project-level API key');
      }
      
      // Update the API key in our configuration
      setOpenAIApiKey(apiKey);
      
      // Update the OpenAI instance with the new API key
      const instance = updateOpenAIInstance(apiKey);
      console.log('OpenAI instance updated with new API key:', instance.apiKey.substring(0, 3) + '...');
      
      setError('');
      setIsLoading(false);
      onApiKeySubmit(apiKey);
    } catch (error) {
      setError('Failed to set API key: ' + error.message);
      console.error('API key update error:', error);
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="pre-page">
      <div className="language-selector">
        <button 
          className="language-button"
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
        >
          {currentLanguage}
        </button>
        {showLanguageMenu && (
          <div className="language-menu">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`language-option ${currentLanguage === lang.name ? 'active' : ''}`}
                onClick={() => handleLanguageChange(lang)}
              >
                {lang.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="pre-page-container">
        <div className="pre-page-header">
          {translations[languageCode].header}
        </div>
        
        <div className="pre-page-input-section">
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="sk-..."
            className="pre-page-input"
            disabled={isLoading}
          />
          <button 
            className="pre-page-button" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '...' : translations[languageCode].go}
          </button>
        </div>
        {error && <div className="pre-page-error">{error}</div>}
        
        <div className="pre-page-warning">
          {translations[languageCode].warning}
        </div>
        
        {/* <div className="pre-page-info">
          This application supports both regular API keys (sk-...) and project API keys (sk-proj-...).
        </div> */}
        
        <div className="pre-page-help">
          <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="pre-page-link">
            {translations[languageCode].howToGetKey}
          </a>
          <a 
            href="mailto:xj2329@columbia.edu?subject=Request%20for%20OpenAI%20API%20Test%20Key&body=Hello,%0A%0AI%20would%20like%20to%20request%20a%20test%20key%20for%20the%20ArchTalk-Playground%20application.%0A%0AThank%20you."
            className="pre-page-link"
          >
            {translations[languageCode].requestTestKey}
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrePage; 