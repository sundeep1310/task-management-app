import axios, { AxiosError, AxiosInstance } from 'axios';
import { Task, TaskFormData, StreamItem } from '../types';

class TaskApiService {
  private api: AxiosInstance;

  constructor() {
    // Determine API URL based on environment
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Create axios instance with base configuration
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

    // Add request interceptor for logging and error handling
    this.api.interceptors.request.use(
      (config) => {
        console.log(`Sending request to: ${config.url}`, config.data);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for comprehensive error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Log detailed error information
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
      throw new Error('No response received from server. Please check your connection.');
    } else {
      // Something happened in setting up the request
      console.error('Request Setup Error:', error.message);
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Fetch all tasks
  async getAllTasks(): Promise<Task[]> {
    try {
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