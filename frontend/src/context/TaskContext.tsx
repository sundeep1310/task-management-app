import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Task, TaskStatus, TaskFormData, TaskContextState, TaskPriority } from '../types';
import { taskApi } from '../api/taskApi';

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
  | { type: 'CHECK_TIMEOUTS' }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'MOVE_TASK'; payload: { taskId: string, newStatus: TaskStatus } };

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
const TaskContext = createContext<{
  state: TaskContextState;
  fetchTasks: () => Promise<void>;
  getTaskById: (id: string) => Promise<void>;
  createTask: (taskData: TaskFormData) => Promise<void>;
  updateTask: (id: string, taskData: Partial<TaskFormData>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setSelectedCategory: (category: TaskStatus | 'ALL') => void;
  checkTimeouts: () => void;
  toggleDarkMode: () => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}>({
  state: initialState,
  fetchTasks: async () => {},
  getTaskById: async () => {},
  createTask: async () => {},
  updateTask: async () => {},
  deleteTask: async () => {},
  setSelectedCategory: () => {},
  checkTimeouts: () => {},
  toggleDarkMode: () => {},
  moveTask: async () => {},
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
    case 'CHECK_TIMEOUTS': {
      // Get timeout threshold from environment variable or use default (3 days)
      const timeoutMinutes = parseInt(process.env.REACT_APP_TASK_TIMEOUT_MINUTES || '4320', 10);
      const now = new Date();
      
      // Check for timed out tasks
      const updatedTasks = state.tasks.map((task) => {
        // Skip tasks that are already done or timed out
        if (task.status === TaskStatus.DONE || task.status === TaskStatus.TIMEOUT) {
          return task;
        }
        
        // Check if task has timed out based on creation date
        const createdAt = new Date(task.createdAt);
        const ageInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        
        // Check if task has timed out based on duration
        const isDurationTimeout = task.duration ? task.duration > timeoutMinutes : false;
        const isAgeTimeout = ageInMinutes > timeoutMinutes;
        
        // If task has timed out, update its status
        if (isDurationTimeout || isAgeTimeout) {
          return { ...task, status: TaskStatus.TIMEOUT };
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

  // Fetch all tasks
  const fetchTasks = async () => {
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
      dispatch({ type: 'FETCH_TASKS_FAILURE', payload: (error as Error).message });
    }
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

  // Check for timeouts
  const checkTimeouts = () => {
    dispatch({ type: 'CHECK_TIMEOUTS' });
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

  // Real-time polling for task updates (every 30 seconds)
  useEffect(() => {
    // Initial fetch
    fetchTasks();
    
    // Set up polling
    const pollingInterval = setInterval(() => {
      fetchTasks();
    }, 30000); // 30 seconds
    
    // Clean up on unmount
    return () => clearInterval(pollingInterval);
  }, []);

  // Check for timeouts every minute
  useEffect(() => {
    checkTimeouts();
    const interval = setInterval(checkTimeouts, 60000); // Check every minute
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
        checkTimeouts,
        toggleDarkMode,
        moveTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook for using the task context
export const useTaskContext = () => useContext(TaskContext);