import { useEffect } from 'react';
import { TaskStatus } from '../types';
import { useTaskContext } from '../context/TaskContext';

/**
 * Hook to handle task timeouts
 */
export const useTaskTimeouts = () => {
  const { state, updateTask } = useTaskContext();
  const { tasks } = state;

  // Check for task timeouts
  useEffect(() => {
    // Get timeout threshold from environment variable or use default (3 days)
    const timeoutMinutes = parseInt(process.env.REACT_APP_TASK_TIMEOUT_MINUTES || '4320', 10);
    const now = new Date();
    
    // Find tasks that need to be moved to timeout status
    tasks.forEach(task => {
      // Skip tasks that are already completed or timed out
      if (task.status === TaskStatus.DONE || task.status === TaskStatus.TIMEOUT) {
        return;
      }
      
      // Check if task has timed out based on creation date
      const createdAt = new Date(task.createdAt);
      const ageInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      // Check if task has timed out based on duration
      const isDurationTimeout = task.duration ? task.duration > timeoutMinutes : false;
      const isAgeTimeout = ageInMinutes > timeoutMinutes;
      
      // If task has timed out, update its status
      if (isDurationTimeout || isAgeTimeout) {
        updateTask(task.id, { status: TaskStatus.TIMEOUT });
      }
    });
  }, [tasks, updateTask]);
};