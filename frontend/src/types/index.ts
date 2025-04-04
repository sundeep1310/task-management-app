// Task Status enum
export enum TaskStatus {
  TODO = "To Do",
  IN_PROGRESS = "In Progress",
  DONE = "Done",
  TIMEOUT = "Timeout",
  OVERDUE = "Overdue"  // Added OVERDUE status
}

// Priority enum
export enum TaskPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High"
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority?: TaskPriority;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  dueDate: string;   // Make dueDate required instead of optional
  duration?: number; // Duration in minutes
  streamingData?: any; // Additional data from streaming API
  isOverdue?: boolean; // Added flag for tracking overdue status
}

// Task form data
export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate: string;  // Required in form data now
  duration?: number; // Duration in minutes
}

// Task context state
export interface TaskContextState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentTask: Task | null | undefined;
  selectedCategory: TaskStatus | 'ALL';
  darkMode: boolean;
}

// Streaming data
export interface StreamItem {
  id: string;
  title: string;
  author: string;
  viewers: number;
  category: string;
  tags: string[];
}