import { useEffect } from 'react';
import { TaskStatus } from '../types';
import { useTaskContext } from '../context/TaskContext';

/**
 * Hook to handle task timeouts (now consolidated with overdue functionality)
 */
export const useTaskTimeouts = () => {
  const { state, updateTask } = useTaskContext();
  const { tasks } = state;

  // Check for task overdue status
  useEffect(() => {
    // Get timeout threshold from environment variable or use default (3 days)
    const timeoutMinutes = parseInt(process.env.REACT_APP_TASK_TIMEOUT_MINUTES || '4320', 10);
    const now = new Date();
    
    // Find tasks that need to be moved to overdue status
    tasks.forEach(task => {
      // Skip tasks that are already completed or overdue
      if (task.status === TaskStatus.DONE || task.status === TaskStatus.OVERDUE) {
        return;
      }
      
      // Check if task has exceeded its duration or age limit
      const createdAt = new Date(task.createdAt);
      const taskAge = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      // Check if the task is past its due date
      const dueDate = new Date(task.dueDate);
      const isPastDueDate = dueDate < now;
      
      // Check if task has exceeded its duration or total age limit
      const isDurationExceeded = task.duration ? task.duration > timeoutMinutes : false;
      const isAgeExceeded = taskAge > timeoutMinutes;
      
      // If task is overdue by any criteria, update its status
      if (isPastDueDate || isDurationExceeded || isAgeExceeded) {
        updateTask(task.id, { status: TaskStatus.OVERDUE });
      }
    });
  }, [tasks, updateTask]);
};