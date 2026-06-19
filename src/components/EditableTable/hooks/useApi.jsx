import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;
const BASE_API_URL = `${API_URL}`;

export const useApi = () => {
  const navigate = useNavigate();

  const apiRequest = async (endpoint, method = 'GET', data = null) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const config = {
      method,
      headers,
      credentials: 'include',
    };

    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${BASE_API_URL}${endpoint}`, config);
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        navigate('/');
        throw new Error('Не авторизован');
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка ${response.status}`);
      }
      if (method === 'DELETE') {
        return { success: true };
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  return { apiRequest };
};