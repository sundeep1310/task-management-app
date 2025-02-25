import axios, { AxiosError } from 'axios';
import { Task, TaskFormData, StreamItem } from '../types';

// Create axios instance with base URL
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
  });

// API error handler
const handleApiError = (error: unknown): never => {
  console.error('API Error:', error);
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{message?: string}>;
    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', axiosError.response.data);
      console.error('Response status:', axiosError.response.status);
      throw new Error(
        axiosError.response.data?.message || 'An error occurred while communicating with the server'
      );
    } else if (axiosError.request) {
      // The request was made but no response was received
      console.error('Request:', axiosError.request);
      throw new Error('No response received from server. Please check your connection.');
    }
  }
  // Something happened in setting up the request that triggered an Error
  throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred');
};

// Task API methods
export const taskApi = {
  // Fetch all tasks
  getAllTasks: async (): Promise<Task[]> => {
    try {
      const response = await api.get<Task[]>('/tasks');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Fetch a task by ID
  getTaskById: async (id: string): Promise<Task> => {
    try {
      const response = await api.get<Task>(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Create a new task
  createTask: async (taskData: TaskFormData): Promise<Task> => {
    try {
      const response = await api.post<Task>('/tasks', taskData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Update a task
  updateTask: async (id: string, taskData: Partial<TaskFormData>): Promise<Task> => {
    try {
      const response = await api.put<Task>(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Delete a task
  deleteTask: async (id: string): Promise<void> => {
    try {
      await api.delete(`/tasks/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Fetch streaming data
  getStreamingData: async (): Promise<StreamItem[]> => {
    try {
      const response = await api.get<StreamItem[]>('/streaming');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Fetch task with streaming data
  getTaskWithStreamingData: async (id: string): Promise<Task> => {
    try {
      const response = await api.get<Task>(`/tasks/${id}/streaming`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};