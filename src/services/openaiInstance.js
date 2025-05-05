import OpenAI from 'openai';
import { getOpenAIApiKey, setOpenAIApiKey, getOpenAIOrganization } from './openaiConfig';

// Create a class to manage the OpenAI instance
class OpenAIManager {
  constructor() {
    this.instance = null;
    this.initialize();
  }

  initialize() {
    const apiKey = getOpenAIApiKey();
    const organization = getOpenAIOrganization();
    console.log('Initializing OpenAI instance with key:', apiKey.substring(0, 3) + '...');
    
    // Configure the OpenAI instance
    const config = {
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    };
    
    // If there is an organization ID, add it to the configuration
    if (organization) {
      config.organization = organization;
    }
    
    this.instance = new OpenAI(config);
    
    return this.instance;
  }

  getInstance() {
    if (!this.instance) {
      this.initialize();
    }
    return this.instance;
  }

  updateApiKey(newKey) {
    console.log('Updating OpenAI API key to:', newKey.substring(0, 3) + '...');
    
    // Update the stored API key
    setOpenAIApiKey(newKey);
    
    // Configure the OpenAI instance
    const config = {
      apiKey: newKey,
      dangerouslyAllowBrowser: true
    };
    
    // If there is an organization ID, add it to the configuration
    const organization = getOpenAIOrganization();
    if (organization) {
      config.organization = organization;
    }
    
    this.instance = new OpenAI(config);
    return this.instance;
  }
}

// Create a singleton instance
const openAIManager = new OpenAIManager();

// Function to update the OpenAI instance with a new API key
export const updateOpenAIInstance = (apiKey) => {
  return openAIManager.updateApiKey(apiKey);
};

// Export the getter function for the instance
export const getOpenAIInstance = () => {
  return openAIManager.getInstance();
};

// For backwards compatibility, also export the instance directly
export default openAIManager.getInstance(); 