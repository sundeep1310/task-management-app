import React, { useRef, useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { useTaskContext } from '../../context/TaskContext';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { deleteTask } = useTaskContext();
  const cardRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [touchTimeout, setTouchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Mobile touch handling
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Detect touch device on component mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substr(-2)}`;
  };

  // Get display text for dates based on task status
  const getDateDisplay = () => {
    if (task.status === TaskStatus.DONE) {
      return {
        label: 'Completed on:',
        text: formatDate(task.updatedAt.toString()),
        className: 'task-completed'
      };
    } else {
      // Original due date logic for non-completed tasks
      if (!task.dueDate) {
        return { text: 'No deadline', className: '', label: 'Due:' };
      }
      
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      
      // Set both dates to the start of the day for accurate day calculation
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: `${Math.abs(diffDays)} days overdue`, className: 'overdue', label: 'Due:' };
      } else if (diffDays === 0) {
        return { text: 'Due today', className: 'due-today', label: 'Due:' };
      } else if (diffDays === 1) {
        return { text: 'Due tomorrow', className: 'due-soon', label: 'Due:' };
      } else if (diffDays <= 3) {
        return { text: `Due in ${diffDays} days`, className: 'due-soon', label: 'Due:' };
      } else {
        return { text: `Due in ${diffDays} days`, className: '', label: 'Due:' };
      }
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
    
    if (task.status === TaskStatus.OVERDUE) {
      return { text: 'Overdue', className: 'priority-expired' };
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

  // Desktop Drag and drop functionality
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
    
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    // Remove dragging class
    if (cardRef.current) {
      cardRef.current.classList.remove('dragging');
    }
    setIsDragging(false);
  };
  
  // Touch handlers for mobile drag and drop
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Don't handle touch events for menu items or tasks that can't be moved
    if (task.status === TaskStatus.TIMEOUT || isDeleting) {
      return;
    }
    
    // Use a timeout to differentiate between tap and long press
    const touchTimer = setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.classList.add('dragging');
        setIsDragging(true);
        
        // Set task drag data in a global variable since dataTransfer is not available in touch events
        window.draggedTask = {
          id: task.id,
          priority: task.priority || TaskPriority.LOW, // Provide default value
          element: cardRef.current
        };
        
        // Create visual feedback for dragging
        if (cardRef.current) {
          cardRef.current.style.opacity = '0.7';
          cardRef.current.style.transform = 'scale(0.95)';
        }
      }
    }, 300); // 300ms long press to start drag
    
    setTouchTimeout(touchTimer);
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only handle if we're actually dragging
    if (!isDragging || !window.draggedTask) {
      return;
    }
    
    e.preventDefault(); // Prevent screen scrolling while dragging
    
    const touch = e.touches[0];
    
    // Move the card with the finger
    if (cardRef.current) {
      // Use translate3d for better performance
      cardRef.current.style.position = 'fixed';
      cardRef.current.style.zIndex = '1000';
      cardRef.current.style.left = `${touch.pageX - cardRef.current.offsetWidth / 2}px`;
      cardRef.current.style.top = `${touch.pageY - cardRef.current.offsetHeight / 2}px`;
    }
    
    // Check if the touch is over any drop targets
    const elementsUnderTouch = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    // Find column elements under the touch point
    const columnUnderTouch = elementsUnderTouch.find(el => 
      el.classList.contains('task-column')
    );
    
    // Remove drag-over class from all columns
    document.querySelectorAll('.task-column').forEach(column => {
      column.classList.remove('drag-over');
    });
    
    // Add drag-over class to the column under touch
    if (columnUnderTouch) {
      columnUnderTouch.classList.add('drag-over');
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    // Clear the long press timer if it exists
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
    
    // If we're not dragging, do nothing
    if (!isDragging || !window.draggedTask) {
      return;
    }
    
    e.preventDefault();
    
    // Get the touch location
    const touch = e.changedTouches[0];
    const elementsUnderTouch = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    // Find column elements under the touch point
    const columnUnderTouch = elementsUnderTouch.find(el => 
      el.classList.contains('task-column')
    ) as HTMLElement;
    
    // Reset card styles
    if (cardRef.current) {
      cardRef.current.style.position = '';
      cardRef.current.style.zIndex = '';
      cardRef.current.style.left = '';
      cardRef.current.style.top = '';
      cardRef.current.style.opacity = '';
      cardRef.current.style.transform = '';
      cardRef.current.classList.remove('dragging');
    }
    
    // If we have a valid drop target, handle the drop
    if (columnUnderTouch) {
      // Get the column status
      const columnClasses = columnUnderTouch.className.split(' ');
      let newStatus: TaskStatus | null = null;
      
      if (columnClasses.includes('column-todo')) {
        newStatus = TaskStatus.TODO;
      } else if (columnClasses.includes('column-progress')) {
        newStatus = TaskStatus.IN_PROGRESS;
      } else if (columnClasses.includes('column-done')) {
        newStatus = TaskStatus.DONE;
      } else if (columnClasses.includes('column-timeout')) {
        newStatus = TaskStatus.TIMEOUT;
      }
      
      // Trigger the drop event if we have a valid status
      if (newStatus) {
        // Create a new custom event
        const dropEvent = new CustomEvent('task-dropped', {
          detail: {
            taskId: task.id,
            newStatus: newStatus
          }
        });
        
        // Dispatch the event on the column
        columnUnderTouch.dispatchEvent(dropEvent);
      }
    }
    
    // Remove drag-over class from all columns
    document.querySelectorAll('.task-column').forEach(column => {
      column.classList.remove('drag-over');
    });
    
    // Clear dragged task
    window.draggedTask = null;
    setIsDragging(false);
  };
  
  const handleTouchCancel = (e: React.TouchEvent<HTMLDivElement>) => {
    // Clear the long press timer if it exists
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
    
    // Reset card styles
    if (cardRef.current) {
      cardRef.current.style.position = '';
      cardRef.current.style.zIndex = '';
      cardRef.current.style.left = '';
      cardRef.current.style.top = '';
      cardRef.current.style.opacity = '';
      cardRef.current.style.transform = '';
      cardRef.current.classList.remove('dragging');
    }
    
    // Remove drag-over class from all columns
    document.querySelectorAll('.task-column').forEach(column => {
      column.classList.remove('drag-over');
    });
    
    // Clear dragged task
    window.draggedTask = null;
    setIsDragging(false);
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
  const dateInfo = getDateDisplay();
  
  // Determine if the task is draggable
  const isDraggable = task.status !== TaskStatus.TIMEOUT && 
                      task.status !== TaskStatus.OVERDUE && 
                      !isDeleting;

  return (
    <div 
      ref={cardRef}
      className={`task-card ${isDeleting ? 'deleting' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={handleCardClick}
      draggable={!isTouchDevice && isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={isTouchDevice ? handleTouchStart : undefined}
      onTouchMove={isTouchDevice ? handleTouchMove : undefined}
      onTouchEnd={isTouchDevice ? handleTouchEnd : undefined}
      onTouchCancel={isTouchDevice ? handleTouchCancel : undefined}
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
            <span className="deadline-label">{dateInfo.label}</span> 
            {task.status === TaskStatus.DONE 
              ? formatDate(task.updatedAt.toString()) 
              : formatDate(task.dueDate.toString())}
          </div>
          {task.status !== TaskStatus.DONE && (
            <div className={`task-due-status ${dateInfo.className}`}>
              {dateInfo.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add a global type for the dragged task data
declare global {
  interface Window {
    draggedTask: {
      id: string;
      priority: TaskPriority;  // Use TaskPriority instead of TaskPriority | undefined
      element: HTMLElement;
    } | null;
  }
}

// Initialize the global variable
window.draggedTask = null;

export default TaskCard;