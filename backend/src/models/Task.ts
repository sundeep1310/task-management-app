import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

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

// File storage path for tasks
const DATA_FILE = path.join(__dirname, '../../data/tasks.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');

// Create directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory database with file persistence
class TaskStore {
  private tasks: Task[] = [];
  private initialized: boolean = false;

  constructor() {
    this.loadTasks();
  }

  // Load tasks from file storage
  private loadTasks(): void {
    try {
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
        
        this.initialized = true;
      } else {
        // If no file exists, create sample tasks on first run
        this.initializeSampleTasks();
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.initializeSampleTasks();
    }
  }

  // Save tasks to file storage
  private saveTasks(): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.tasks, null, 2));
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
        },
        {
          id: uuidv4(),
          title: "Design database schema",
          description: "Create entity-relationship diagrams and define models",
          status: TaskStatus.TODO,
          priority: TaskPriority.LOW,
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          dueDate: tomorrow,
          duration: 90
        }
      ];
      
      this.saveTasks();
      this.initialized = true;
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
    // Default timeout: 3 days (4320 minutes)
    const now = new Date();
    const timeoutTasks: Task[] = [];
    
    this.tasks.forEach(task => {
      if (task.status !== TaskStatus.DONE && task.status !== TaskStatus.TIMEOUT) {
        const taskAge = (now.getTime() - task.createdAt.getTime()) / (1000 * 60); // Age in minutes
        
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