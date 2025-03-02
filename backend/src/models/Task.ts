import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

// Task model types
export enum TaskStatus {
  TODO = "To Do",
  IN_PROGRESS = "In Progress",
  DONE = "Done",
  TIMEOUT = "Timeout"
}

export enum TaskPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High"
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  duration?: number; // Duration in minutes
  streamingData?: any; // Additional data from streaming API
}

// Ensure absolute path resolution
const basePath = process.cwd();
const dataDir = path.resolve(basePath, config.dataDir);
const DATA_FILE = path.resolve(dataDir, 'tasks.json');

// Persistent storage key for localStorage-like API
const STORAGE_KEY = 'task_manager_tasks';

// Create directory if it doesn't exist (for local development)
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory at: ${dataDir}`);
  }
} catch (error) {
  console.error('Error creating data directory:', error);
}

// Simple in-memory cache that persists across service restarts
class PersistentMemoryStorage {
  private static instance: PersistentMemoryStorage;
  private cache: Record<string, any> = {};
  
  private constructor() {
    // Initialize with saved data from global variable if available
    if (global.__PERSISTENT_STORAGE__) {
      this.cache = global.__PERSISTENT_STORAGE__;
    }
  }
  
  public static getInstance(): PersistentMemoryStorage {
    if (!PersistentMemoryStorage.instance) {
      PersistentMemoryStorage.instance = new PersistentMemoryStorage();
    }
    return PersistentMemoryStorage.instance;
  }
  
  public getItem(key: string): any {
    return this.cache[key];
  }
  
  public setItem(key: string, value: any): void {
    this.cache[key] = value;
    // Save to global variable to persist across module reloads
    global.__PERSISTENT_STORAGE__ = this.cache;
  }
  
  public removeItem(key: string): void {
    delete this.cache[key];
    global.__PERSISTENT_STORAGE__ = this.cache;
  }
}

// Declare global variable for persistent storage
declare global {
  var __PERSISTENT_STORAGE__: Record<string, any>;
}

// Initialize global storage if not exists
if (!global.__PERSISTENT_STORAGE__) {
  global.__PERSISTENT_STORAGE__ = {};
}

// In-memory database with hybrid persistence strategy
class TaskStore {
  private tasks: Task[] = [];
  private initialized: boolean = false;
  private persistence: PersistentMemoryStorage;

  constructor() {
    this.persistence = PersistentMemoryStorage.getInstance();
    this.loadTasks();
  }

  // Load tasks with priority on in-memory persistence, then file system
  private loadTasks(): void {
    try {
      // First try to load from persistent memory
      const persistedTasks = this.persistence.getItem(STORAGE_KEY);
      
      if (persistedTasks && Array.isArray(persistedTasks) && persistedTasks.length > 0) {
        // Convert string dates back to Date objects
        this.tasks = persistedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : new Date()
        }));
        
        this.initialized = true;
        console.log(`Loaded ${this.tasks.length} tasks from persistent memory storage`);
        return;
      }
      
      // If no tasks in memory, try to load from file system
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsedData = JSON.parse(data);
        
        // Convert string dates back to Date objects
        this.tasks = parsedData.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : new Date()
        }));
        
        // Save to persistent memory for future use
        this.persistence.setItem(STORAGE_KEY, parsedData);
        
        this.initialized = true;
        console.log(`Loaded ${this.tasks.length} tasks from file storage and cached in memory`);
        return;
      }
      
      // If no tasks found anywhere, initialize with samples
      this.initializeSampleTasks();
      
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.initializeSampleTasks();
    }
  }

  // Save tasks to both memory and file storage
  private saveTasks(): void {
    try {
      // First save to persistent memory (always works)
      this.persistence.setItem(STORAGE_KEY, this.tasks);
      
      // Then try to save to filesystem (may fail in some environments)
      try {
        // Ensure directory exists before writing
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(this.tasks, null, 2));
        console.log(`Saved ${this.tasks.length} tasks to file storage`);
      } catch (fsError) {
        console.warn('Could not save to filesystem, but data is preserved in memory:', fsError);
      }
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  // Initialize with sample tasks if needed
  private initializeSampleTasks(): void {
    if (this.tasks.length === 0 && !this.initialized) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      this.tasks = [
        {
          id: uuidv4(),
          title: "Complete project setup",
          description: "Initialize repository and create project structure",
          status: TaskStatus.DONE,
          priority: TaskPriority.MEDIUM,
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          dueDate: tomorrow,
          duration: 120
        },
        {
          id: uuidv4(),
          title: "Implement user authentication",
          description: "Add login and registration functionality",
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          dueDate: nextWeek,
          duration: 180
        }
      ];
      
      this.saveTasks();
      this.initialized = true;
      console.log('Initialized with sample tasks');
    }
  }

  // Find all tasks
  findAll(): Task[] {
    return this.tasks;
  }

  // Find task by ID
  findById(id: string): Task | undefined {
    return this.tasks.find(task => task.id === id);
  }

  // Create a new task
  create(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const now = new Date();
    const newTask: Task = {
      id: uuidv4(),
      ...taskData,
      createdAt: now,
      updatedAt: now
    };
    
    this.tasks.push(newTask);
    this.saveTasks();
    return newTask;
  }

  // Update an existing task
  update(id: string, taskUpdate: Partial<Task>): Task | undefined {
    const index = this.tasks.findIndex(task => task.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    const updatedTask: Task = {
      ...this.tasks[index],
      ...taskUpdate,
      updatedAt: new Date()
    };
    
    this.tasks[index] = updatedTask;
    this.saveTasks();
    return updatedTask;
  }

  // Delete a task
  delete(id: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== id);
    
    if (this.tasks.length !== initialLength) {
      this.saveTasks();
      return true;
    }
    
    return false;
  }

  // Check for task timeouts
  checkTimeouts(timeoutMinutes: number = 4320): Task[] {
    const now = new Date();
    const timeoutTasks: Task[] = [];
    
    this.tasks.forEach(task => {
      if (task.status !== TaskStatus.DONE && task.status !== TaskStatus.TIMEOUT) {
        const taskAge = (now.getTime() - task.createdAt.getTime()) / (1000 * 60);
        
        if (taskAge > timeoutMinutes || (task.duration && task.duration > timeoutMinutes)) {
          task.status = TaskStatus.TIMEOUT;
          task.updatedAt = now;
          timeoutTasks.push(task);
        }
      }
    });
    
    if (timeoutTasks.length > 0) {
      this.saveTasks();
    }
    
    return timeoutTasks;
  }
}

// Singleton instance
export const taskStore = new TaskStore();