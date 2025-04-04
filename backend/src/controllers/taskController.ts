import { Request, Response } from 'express';
import { taskStore, Task, TaskStatus, TaskPriority } from '../models/Task';
import { fetchStreamingData } from '../services/streamingService';

// Get all tasks
export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for tasks that are overdue
    taskStore.checkOverdueTasks();
    
    const tasks = taskStore.findAll();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error });
  }
};

// Get a single task by ID
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = taskStore.findById(id);
    
    if (!task) {
      res.status(404).json({ message: `Task with ID ${id} not found` });
      return;
    }
    
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch task', error });
  }
};

// Create a new task
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, status, priority, dueDate, duration } = req.body;
    
    if (!title) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }
    
    // Ensure priority is set
    const taskPriority = priority || TaskPriority.MEDIUM;
    
    // Parse the dueDate if it's provided
    let dueDateObj = new Date();
    if (dueDate) {
      dueDateObj = new Date(dueDate);
    }
    
    // Check if the task is already overdue
    const now = new Date();
    const initialStatus = dueDateObj < now ? TaskStatus.OVERDUE : (status || TaskStatus.TODO);
    
    const newTask = taskStore.create({
      title,
      description: description || '',
      status: initialStatus,
      priority: taskPriority,
      dueDate: dueDateObj,
      duration: duration ? Number(duration) : undefined,
      isOverdue: dueDateObj < now
    });
    
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task', error });
  }
};

// Update a task
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Parse due date if present
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
      
      // Check if the updated due date makes the task overdue
      const now = new Date();
      if (updates.dueDate < now && updates.status !== TaskStatus.DONE) {
        updates.status = TaskStatus.OVERDUE;
        updates.isOverdue = true;
      }
    }
    
    const updatedTask = taskStore.update(id, updates);
    
    if (!updatedTask) {
      res.status(404).json({ message: `Task with ID ${id} not found` });
      return;
    }
    
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task', error });
  }
};

// Delete a task
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = taskStore.delete(id);
    
    if (!deleted) {
      res.status(404).json({ message: `Task with ID ${id} not found` });
      return;
    }
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error });
  }
};

// Get task with streaming data
export const getTaskWithStreamingData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const task = taskStore.findById(id);
    
    if (!task) {
      res.status(404).json({ message: `Task with ID ${id} not found` });
      return;
    }
    
    // Fetch streaming data
    const streamingData = await fetchStreamingData();
    
    // Update task with streaming data
    const updatedTask = taskStore.update(id, { streamingData });
    
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch streaming data', error });
  }
};

// Get streaming data
export const getStreamingData = async (req: Request, res: Response): Promise<void> => {
  try {
    const streamingData = await fetchStreamingData();
    res.status(200).json(streamingData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch streaming data', error });
  }
};