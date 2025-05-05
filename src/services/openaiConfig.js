// File to manage OpenAI API key configuration
let openaiApiKey = 'placeholder';
let openaiOrganization = '';

// Check if there's a stored key in localStorage
try {
  const storedKey = localStorage.getItem('openai_api_key');
  if (storedKey) {
    openaiApiKey = storedKey;
  }
  const storedOrg = localStorage.getItem('openai_organization');
  if (storedOrg) {
    openaiOrganization = storedOrg;
  }
} catch (e) {
  console.error('Error accessing localStorage:', e);
}

export const getOpenAIApiKey = () => {
  return openaiApiKey;
};

export const getOpenAIOrganization = () => {
  return openaiOrganization;
};

export const setOpenAIApiKey = (newKey) => {
  openaiApiKey = newKey;
  try {
    localStorage.setItem('openai_api_key', newKey);
  } catch (e) {
    console.error('Error storing API key in localStorage:', e);
  }
  return openaiApiKey;
};

export const setOpenAIOrganization = (newOrg) => {
  openaiOrganization = newOrg;
  try {
    localStorage.setItem('openai_organization', newOrg);
  } catch (e) {
    console.error('Error storing organization in localStorage:', e);
  }
  return openaiOrganization;
}; 