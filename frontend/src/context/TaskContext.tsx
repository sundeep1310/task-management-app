import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Task, TaskStatus, TaskFormData, TaskContextState, TaskPriority } from '../types';
import { taskApi } from '../api/taskApi';

// Create a custom type that extends RequestInit with timeout
interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

// Implement fetch with timeout support
const fetchWithTimeout = async (url: string, options: FetchWithTimeoutOptions = {}): Promise<Response> => {
  const { timeout, ...fetchOptions } = options;
  
  if (!timeout) {
    return fetch(url, fetchOptions);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Define the context actions
type TaskAction =
  | { type: 'FETCH_TASKS_REQUEST' }
  | { type: 'FETCH_TASKS_SUCCESS'; payload: Task[] }
  | { type: 'FETCH_TASKS_FAILURE'; payload: string }
  | { type: 'SET_CURRENT_TASK'; payload: Task | null }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_CATEGORY'; payload: TaskStatus | 'ALL' }
  | { type: 'CHECK_OVERDUE' }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'MOVE_TASK'; payload: { taskId: string, newStatus: TaskStatus } }
  | { type: 'SERVER_WAKING'; payload: boolean };

// Initial state
const initialState: TaskContextState = {
  tasks: [],
  loading: false,
  error: null,
  currentTask: null,
  selectedCategory: 'ALL',
  darkMode: localStorage.getItem('darkMode') === 'true', // Read from localStorage
};

// Create context
interface TaskContextValue {
  state: TaskContextState;
  fetchTasks: () => Promise<void>;
  getTaskById: (id: string) => Promise<void>;
  createTask: (taskData: TaskFormData) => Promise<void>;
  updateTask: (id: string, taskData: Partial<TaskFormData>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setSelectedCategory: (category: TaskStatus | 'ALL') => void;
  checkOverdue: () => void;
  toggleDarkMode: () => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  refreshTasks: () => Promise<void>;
  wakeUpServer: () => Promise<boolean>;
}

const TaskContext = createContext<TaskContextValue>({
  state: initialState,
  fetchTasks: async () => {},
  getTaskById: async () => {},
  createTask: async () => {},
  updateTask: async () => {},
  deleteTask: async () => {},
  setSelectedCategory: () => {},
  checkOverdue: () => {},
  toggleDarkMode: () => {},
  moveTask: async () => {},
  refreshTasks: async () => {},
  wakeUpServer: async () => false,
});

// Reducer function
const taskReducer = (state: TaskContextState, action: TaskAction): TaskContextState => {
  switch (action.type) {
    case 'FETCH_TASKS_REQUEST':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FETCH_TASKS_SUCCESS':
      return {
        ...state,
        loading: false,
        tasks: action.payload,
        error: null,
      };
    case 'FETCH_TASKS_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'SET_CURRENT_TASK':
      return {
        ...state,
        currentTask: action.payload,
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? action.payload : task
        ),
        currentTask: state.currentTask?.id === action.payload.id ? action.payload : state.currentTask,
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
        currentTask: state.currentTask?.id === action.payload ? null : state.currentTask,
      };
    case 'SET_CATEGORY':
      return {
        ...state,
        selectedCategory: action.payload,
      };
    case 'CHECK_OVERDUE': {
      // Get timeout threshold from environment variable or use default (3 days)
      const timeoutMinutes = parseInt(process.env.REACT_APP_TASK_TIMEOUT_MINUTES || '4320', 10);
      const now = new Date();
      
      // Check for overdue tasks
      const updatedTasks = state.tasks.map((task) => {
        // Skip tasks that are already done or overdue
        if (task.status === TaskStatus.DONE || task.status === TaskStatus.OVERDUE) {
          return task;
        }
        
        // Check if the task has passed its due date
        const dueDate = new Date(task.dueDate);
        if (dueDate < now) {
          return { ...task, status: TaskStatus.OVERDUE, isOverdue: true };
        }
        
        // Check if the task has exceeded its duration or total age limit
        const createdAt = new Date(task.createdAt);
        const taskAge = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        
        if (taskAge > timeoutMinutes || (task.duration && task.duration > timeoutMinutes)) {
          return { ...task, status: TaskStatus.OVERDUE, isOverdue: true };
        }
        
        return task;
      });
      
      return {
        ...state,
        tasks: updatedTasks,
      };
    }
    case 'TOGGLE_DARK_MODE':
      const newDarkMode = !state.darkMode;
      localStorage.setItem('darkMode', newDarkMode.toString());
      return {
        ...state,
        darkMode: newDarkMode,
      };
    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.taskId 
            ? { ...task, status: action.payload.newStatus } 
            : task
        ),
      };
    case 'SERVER_WAKING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

// Provider component
export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Apply dark mode on initial load
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [state.darkMode]);

  // Try to wake up the server if it's asleep
  const wakeUpServer = async (): Promise<boolean> => {
    dispatch({ type: 'SERVER_WAKING', payload: true });
    try {
      // Try to hit the health endpoint to wake up the server
      const apiURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetchWithTimeout(`${apiURL}/health`, {
        method: 'GET',
        timeout: 30000
      });
      const success = response.status === 200;
      console.log('Server wake-up attempt:', success ? 'successful' : 'failed');
      return success;
    } catch (error) {
      console.warn('Failed to wake up server:', error);
      return false;
    } finally {
      dispatch({ type: 'SERVER_WAKING', payload: false });
    }
  };

  // Fetch all tasks with retry logic
  const fetchTasks = async (retries = 2): Promise<void> => {
    dispatch({ type: 'FETCH_TASKS_REQUEST' });
    try {
      const tasks = await taskApi.getAllTasks();
      
      // Make sure all tasks have priority set
      const tasksWithPriority = tasks.map(task => {
        if (!task.priority) {
          return { ...task, priority: TaskPriority.MEDIUM };
        }
        return task;
      });
      
      dispatch({ type: 'FETCH_TASKS_SUCCESS', payload: tasksWithPriority });
    } catch (error) {
      if (retries > 0) {
        // If server might be waking up, wait and retry
        console.log(`Retrying fetch tasks in 3 seconds (${retries} retries left)...`);
        setTimeout(() => fetchTasks(retries - 1), 3000);
      } else {
        dispatch({ type: 'FETCH_TASKS_FAILURE', payload: (error as Error).message });
      }
    }
  };

  // Force refresh tasks (useful after server wakes up)
  const refreshTasks = async (): Promise<void> => {
    // First try to wake up server if needed
    await wakeUpServer();
    // Then fetch tasks with a clean slate
    return fetchTasks(2);
  };

  // Get task by ID
  const getTaskById = async (id: string) => {
    dispatch({ type: 'FETCH_TASKS_REQUEST' });
    try {
      const task = await taskApi.getTaskById(id);
      dispatch({ type: 'SET_CURRENT_TASK', payload: task });
    } catch (error) {
      dispatch({ type: 'FETCH_TASKS_FAILURE', payload: (error as Error).message });
    }
  };

  // Create a new task
  const createTask = async (taskData: TaskFormData) => {
    dispatch({ type: 'FETCH_TASKS_REQUEST' });
    try {
      // Ensure task has a priority set
      const taskWithPriority = {
        ...taskData,
        priority: taskData.priority || TaskPriority.MEDIUM,
      };
      
      const newTask = await taskApi.createTask(taskWithPriority);
      dispatch({ type: 'ADD_TASK', payload: newTask });
    } catch (error) {
      dispatch({ type: 'FETCH_TASKS_FAILURE', payload: (error as Error).message });
    }
  };

  // Update a task
  const updateTask = async (id: string, taskData: Partial<TaskFormData>) => {
    dispatch({ type: 'FETCH_TASKS_REQUEST' });
    try {
      const updatedTask = await taskApi.updateTask(id, taskData);
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    } catch (error) {
      dispatch({ type: 'FETCH_TASKS_FAILURE', payload: (error as Error).message });
    }
  };

  // Delete a task
  const deleteTask = async (id: string) => {
    dispatch({ type: 'FETCH_TASKS_REQUEST' });
    try {
      await taskApi.deleteTask(id);
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (error) {
      dispatch({ type: 'FETCH_TASKS_FAILURE', payload: (error as Error).message });
    }
  };

  // Set selected category
  const setSelectedCategory = (category: TaskStatus | 'ALL') => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  };

  // Check for overdue tasks
  const checkOverdue = () => {
    dispatch({ type: 'CHECK_OVERDUE' });
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  // Move task to a new status
  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Find the current task to preserve its priority
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        // When moving to Done status, the backend will automatically update 
        // the updatedAt timestamp, we don't need to send it as part of TaskFormData
        await updateTask(taskId, { 
          status: newStatus,
          priority: task.priority // Preserve the priority
        });
      } else {
        await updateTask(taskId, { status: newStatus });
      }
      
      dispatch({ type: 'MOVE_TASK', payload: { taskId, newStatus } });
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  // Initial data load when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      // Try to wake up the server first, then fetch tasks
      const isServerAwake = await wakeUpServer();
      if (isServerAwake) {
        await fetchTasks();
      } else {
        // If server wake-up failed, still try to fetch
        fetchTasks();
      }
    };
    
    loadInitialData();
    
    // Set up polling at longer intervals to maintain connection
    const pollingInterval = setInterval(() => {
      fetchTasks(1); // Only retry once during polling
    }, 60000); // Check every minute
    
    // Clean up on unmount
    return () => clearInterval(pollingInterval);
  }, []);

  // Check for overdue tasks every minute
  useEffect(() => {
    checkOverdue();
    const interval = setInterval(checkOverdue, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.tasks]);

  return (
    <TaskContext.Provider
      value={{
        state,
        fetchTasks,
        getTaskById,
        createTask,
        updateTask,
        deleteTask,
        setSelectedCategory,
        checkOverdue,
        toggleDarkMode,
        moveTask,
        refreshTasks,
        wakeUpServer
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook for using the task context
export const useTaskContext = () => useContext(TaskContext);