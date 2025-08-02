/**
 * Authentication service
 */
import { apiService } from './api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async login(username, password) {
    try {
      const response = await apiService.auth.login(username, password);
      const { access_token, token_type } = response.data;

      // Store token and user data
      this.token = access_token;
      this.user = { username }; // In a real app, get user data from backend
      
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user', JSON.stringify(this.user));
      
      return { success: true, user: this.user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }
}

export const authService = new AuthService();