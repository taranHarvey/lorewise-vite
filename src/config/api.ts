// API Configuration
// Centralizes all API base URLs for easy environment-based switching

const getApiUrl = () => {
  // In production, this should be your production API URL
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Default to localhost for development
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  // Fallback for production if VITE_API_URL is not set
  console.warn('VITE_API_URL not set, using relative URLs');
  return '';
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  createCheckout: `${API_BASE_URL}/api/create-checkout-session`,
  cancelSubscription: `${API_BASE_URL}/api/cancel-subscription`,
  changePlan: `${API_BASE_URL}/api/change-plan`,
  getSubscription: (userId: string) => `${API_BASE_URL}/api/subscriptions/${userId}`,
  syncSubscription: `${API_BASE_URL}/api/sync-subscription`,
};

