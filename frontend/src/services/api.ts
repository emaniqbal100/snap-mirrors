import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add token if exists
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Redirect to login if needed
      }
    }
    return Promise.reject(error);
  }
);

// Products API
export const productsApi = {
  getAll: () => apiClient.get('/products'),
  getById: (id: string) => apiClient.get(`/products/${id}`),
};

// Orders API
export const ordersApi = {
  create: (data: any) => apiClient.post('/orders', data),
  getById: (id: string) => apiClient.get(`/orders/${id}`),
  trackOrder: (orderId: string, email: string) => 
    apiClient.post('/orders/track', { orderId, email }),
};

// Payments API
export const paymentsApi = {
  initiate: (data: any) => apiClient.post('/payments/initiate', data),
  verify: (data: any) => apiClient.post('/payments/verify', data),
};

// Reviews API
export const reviewsApi = {
  getAll: () => apiClient.get('/reviews'),
  getByProduct: (productId: string) => 
    apiClient.get(`/reviews/product/${productId}`),
};

// Settings API
export const settingsApi = {
  getAll: () => apiClient.get('/settings'),
};

export default apiClient;