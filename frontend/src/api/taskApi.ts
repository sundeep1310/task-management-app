import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { Task, TaskFormData, StreamItem } from '../types';

// Add timeout property to AxiosRequestConfig
declare module 'axios' {
  export interface AxiosRequestConfig {
    timeout?: number;
    metadata?: {
      retryCount: number;
    };
  }
}

class TaskApiService {
  private api: AxiosInstance;
  private maxRetries: number = 3; // Maximum number of retries for failed requests

  constructor() {
    // Determine API URL based on environment
    // For production deployments to Vercel, get the production API URL
    let API_URL = process.env.REACT_APP_API_URL;
    
    // If API_URL is not set, use a dynamic fallback based on the environment
    if (!API_URL) {
      const isProduction = process.env.NODE_ENV === 'production';
      
      // In production, determine if we're deployed to Vercel and get the URL from there
      // Otherwise, fallback to the deployed render URL
      API_URL = isProduction 
        ? 'https://task-management-backend-xvui.onrender.com/api'
        : 'http://localhost:5000/api';
    }
    
    console.log('Using API URL:', API_URL);

    // Create axios instance with base configuration
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 20000, // Increase timeout for Render's cold start delay
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        // Add retry count to request config for tracking
        config.metadata = { retryCount: 0 };
        console.log(`Sending request to: ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor with retry logic
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig; 
        
        // If config doesn't exist or we've already retried too many times, reject
        if (!config || !config.metadata) {
          return Promise.reject(error);
        }
        
        // Increment the retry count
        const retryCount = config.metadata.retryCount;
        
        // Only retry on network errors, 5xx responses, or if server is spinning up (503)
        const shouldRetry = 
          !error.response || 
          (error.response.status >= 500 && error.response.status <= 599);
        
        // If we should retry and haven't hit max retries yet
        if (shouldRetry && retryCount < this.maxRetries) {
          console.log(`Retrying request (${retryCount + 1}/${this.maxRetries})...`);
          
          // Exponential backoff: wait longer between each retry
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Update retry count
          config.metadata.retryCount = retryCount + 1;
          
          // Retry the request
          return this.api(config);
        }
        
        // Log detailed error information when we're done retrying
        if (error.response) {
          console.error('Server Error:', {
            data: error.response.data,
            status: error.response.status,
            headers: error.response.headers
          });
        } else if (error.request) {
          console.error('Network Error:', error.request);
        } else {
          console.error('Request Setup Error:', error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Comprehensive error handler
  private handleApiError(error: AxiosError): never {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Server Error:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers
      });

      throw new Error(
        (error.response.data as any)?.message || 
        'An error occurred while communicating with the server'
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
      throw new Error('No response received from server. Please check your connection or try again later. The server might be waking up from sleep mode.');
    } else {
      // Something happened in setting up the request
      console.error('Request Setup Error:', error.message);
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Wake up server if it's asleep by pinging the health endpoint
  async wakeUpServer(): Promise<boolean> {
    try {
      const response = await this.api.get('/health', { timeout: 30000 });
      return response.status === 200;
    } catch (error) {
      console.warn('Failed to wake up server:', error);
      return false;
    }
  }

  // Fetch all tasks
  async getAllTasks(): Promise<Task[]> {
    try {
      // Try to wake up the server first if needed
      await this.wakeUpServer();
      
      const response = await this.api.get<Task[]>('/tasks');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return this.handleApiError(error);
      }
      throw error;
    }
  }

  // Fetch a single task by ID
  async getTaskById(id: string): Promise<Task> {
    try {
      const response = await this.api.get<Task>(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return this.handleApiError(error);
      }
      throw error;
    }
  }

  // Create a new task
  async createTask(taskData: TaskFormData): Promise<Task> {
    try {
      const response = await this.api.post<Task>('/tasks', taskData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return this.handleApiError(error);
      }
      throw error;
    }
  }

  // Update an existing task
  async updateTask(id: string, taskData: Partial<TaskFormData>): Promise<Task> {
    try {
      const response = await this.api.put<Task>(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return this.handleApiError(error);
      }
      throw error;
    }
  }

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    try {
      await this.api.delete(`/tasks/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.handleApiError(error);
      }
      throw error;
    }
  }

  // Fetch streaming data
  async getStreamingData(): Promise<StreamItem[]> {
    try {
      const response = await this.api.get<StreamItem[]>('/streaming');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return this.handleApiError(error);
      }
      throw error;
    }
  }

  // Fetch task with streaming data
  async getTaskWithStreamingData(id: string): Promise<Task> {
    try {
      const response = await this.api.get<Task>(`/tasks/${id}/streaming`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return this.handleApiError(error);
      }
      throw error;
    }
  }
}

// Export a singleton instance
export const taskApi = new TaskApiService();