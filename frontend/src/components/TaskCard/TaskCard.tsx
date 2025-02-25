import React, { useRef, useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { useTaskContext } from '../../context/TaskContext';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { deleteTask } = useTaskContext();
  const cardRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(-2)}`;
  };

  // Calculate days until due
  const getDaysUntilDue = (): { text: string, className: string } => {
    if (!task.dueDate) {
      return { text: 'No deadline', className: '' };
    }
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    
    // Set both dates to the start of the day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, className: 'overdue' };
    } else if (diffDays === 0) {
      return { text: 'Due today', className: 'due-today' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', className: 'due-soon' };
    } else if (diffDays <= 3) {
      return { text: `Due in ${diffDays} days`, className: 'due-soon' };
    } else {
      return { text: `Due in ${diffDays} days`, className: '' };
    }
  };

  // Get priority label
  const getPriorityLabel = (): { text: string, className: string } => {
    if (task.status === TaskStatus.DONE) {
      return { text: 'Completed', className: 'priority-completed' };
    }
    
    if (task.status === TaskStatus.TIMEOUT) {
      return { text: 'Expired', className: 'priority-expired' };
    }
    
    // Use the priority from the task or default to Low
    if (task.priority === TaskPriority.HIGH) {
      return { text: 'High', className: 'priority-high' };
    } else if (task.priority === TaskPriority.MEDIUM) {
      return { text: 'Medium', className: 'priority-medium' };
    } else {
      return { text: 'Low', className: 'priority-low' };
    }
  };

  // Drag and drop functionality
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    
    // Convert the priority enum to a string for data transfer
    let priorityString = 'Low';
    if (task.priority === TaskPriority.HIGH) {
      priorityString = 'High';
    } else if (task.priority === TaskPriority.MEDIUM) {
      priorityString = 'Medium';
    }
    
    e.dataTransfer.setData('taskPriority', priorityString);
    
    if (cardRef.current) {
      // Create a ghost image for dragging
      const rect = cardRef.current.getBoundingClientRect();
      const ghostElement = cardRef.current.cloneNode(true) as HTMLDivElement;
      
      // Style the ghost element
      ghostElement.style.position = 'absolute';
      ghostElement.style.top = '-1000px';
      ghostElement.style.opacity = '0.8';
      ghostElement.style.transform = 'scale(0.8)';
      ghostElement.style.width = `${rect.width}px`;
      
      // Add to document temporarily
      document.body.appendChild(ghostElement);
      e.dataTransfer.setDragImage(ghostElement, 0, 0);
      
      // Set a timeout to remove the ghost element
      setTimeout(() => {
        document.body.removeChild(ghostElement);
      }, 0);
    }
    
    // Add dragging class
    if (cardRef.current) {
      cardRef.current.classList.add('dragging');
    }
  };

  const handleDragEnd = () => {
    // Remove dragging class
    if (cardRef.current) {
      cardRef.current.classList.remove('dragging');
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger edit if not clicking on menu button
    if (!e.defaultPrevented) {
      // Do nothing - let the card be draggable but not open the edit form
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
    setShowMenu(false);
  };
  
  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      setIsDeleting(true);
      try {
        await deleteTask(task.id);
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      } finally {
        setIsDeleting(false);
        setShowMenu(false);
      }
    } else {
      setShowMenu(false);
    }
  };

  const priority = getPriorityLabel();
  const dueInfo = getDaysUntilDue();

  return (
    <div 
      ref={cardRef}
      className={`task-card ${isDeleting ? 'deleting' : ''}`}
      onClick={handleCardClick}
      draggable={task.status !== TaskStatus.TIMEOUT && !isDeleting}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      data-task-id={task.id}
    >
      <div className="task-card-header">
        <div className={`task-priority ${priority.className}`}>
          {priority.text}
        </div>
        <div className="task-menu">
          <button className="task-menu-btn" onClick={handleMenuClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
          {showMenu && (
            <div className="task-menu-dropdown">
              <button onClick={handleEditClick}>Edit Task</button>
              <button 
                className="delete-option"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <h3 className="task-title">{task.title}</h3>
      
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      
      <div className="task-footer">
        <div className="task-dates">
          <div className="task-deadline">
            <span className="deadline-label">Due:</span> {formatDate(task.dueDate)}
          </div>
          <div className={`task-due-status ${dueInfo.className}`}>
            {dueInfo.text}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;