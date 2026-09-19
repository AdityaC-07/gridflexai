import axios from 'axios';
import { CONFIG } from '../config';

export const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Utility to handle API call with automatic fallback to mock function if API fails or mock mode is enabled
export async function fetchWithMockFallback(apiCall, getMockData) {
  if (CONFIG.USE_MOCK) {
    return { data: getMockData(), isMock: true };
  }
  try {
    const response = await apiCall();
    return { data: response.data, isMock: false };
  } catch (error) {
    console.warn('API call failed or unavailable. Falling back to mock data:', error?.message || error);
    return { data: getMockData(), isMock: true, isFallback: true };
  }
}
