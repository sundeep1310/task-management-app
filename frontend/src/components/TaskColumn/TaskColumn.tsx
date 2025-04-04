import React, { useEffect, useRef } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { useTaskContext } from '../../context/TaskContext';
import TaskCard from '../TaskCard/TaskCard';
import './TaskColumn.css';

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ title, tasks, onEditTask }) => {
  const { moveTask } = useTaskContext();
  const columnRef = useRef<HTMLDivElement>(null);
  
  const getColumnColorClass = () => {
    switch (title) {
      case 'To Do':
        return 'column-todo';
      case 'In Progress':
        return 'column-progress';
      case 'Done':
        return 'column-done';
      case 'Overdue':
        return 'column-overdue'; // Changed from column-timeout
      default:
        return '';
    }
  };

  const getColumnStatus = (): TaskStatus => {
    switch (title) {
      case 'To Do':
        return TaskStatus.TODO;
      case 'In Progress':
        return TaskStatus.IN_PROGRESS;
      case 'Done':
        return TaskStatus.DONE;
      case 'Overdue':
        return TaskStatus.OVERDUE;
      default:
        return TaskStatus.TODO;
    }
  };

  // Handle drag and drop events for desktop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const taskId = e.dataTransfer.getData('taskId');
    const taskPriorityString = e.dataTransfer.getData('taskPriority') || 'Low';
    
    // Convert string to TaskPriority enum
    let taskPriority: TaskPriority;
    switch (taskPriorityString) {
      case 'High':
        taskPriority = TaskPriority.HIGH;
        break;
      case 'Medium':
        taskPriority = TaskPriority.MEDIUM;
        break;
      default:
        taskPriority = TaskPriority.LOW;
    }
    
    if (taskId) {
      const newStatus = getColumnStatus();
      await moveTask(taskId, newStatus);
      
      // Find the task and update it with the preserved priority
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        // This is just for local state - the actual update happens via moveTask
        task.priority = taskPriority;
      }
    }
  };
  
  // Handle custom drop event for mobile
  useEffect(() => {
    const handleTaskDropped = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { taskId, newStatus } = customEvent.detail;
      
      // Only process if the new status matches this column's status
      if (newStatus === getColumnStatus()) {
        await moveTask(taskId, newStatus);
      }
    };
    
    // Add event listener for custom drop event
    if (columnRef.current) {
      columnRef.current.addEventListener('task-dropped', handleTaskDropped);
    }
    
    // Clean up event listener on unmount
    return () => {
      if (columnRef.current) {
        columnRef.current.removeEventListener('task-dropped', handleTaskDropped);
      }
    };
  }, [moveTask]);
  
  return (
    <div 
      ref={columnRef}
      className={`task-column ${getColumnColorClass()}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <div className="column-title">
          <span className="column-indicator"></span>
          <span>{title}</span>
        </div>
        <div className="column-count">{tasks.length}</div>
      </div>
      
      <div className="column-content">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onEdit={() => onEditTask(task)} 
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="empty-column">
            <p>No tasks in this column</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskColumn;