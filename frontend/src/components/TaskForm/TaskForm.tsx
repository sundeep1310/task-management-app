import React, { useState, useEffect } from 'react';
import { Task, TaskFormData, TaskStatus, TaskPriority } from '../../types';
import { useTaskContext } from '../../context/TaskContext';
import './TaskForm.css';

interface TaskFormProps {
  task?: Task | null;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onClose }) => {
  const { createTask, updateTask } = useTaskContext();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get today's date in YYYY-MM-DD format for the date input default
  const today = new Date().toISOString().split('T')[0];
  
  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueDate: today, // Default to today
    duration: undefined,
  });

  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      // Format the ISO date string to YYYY-MM-DD for date input
      let dueDate = today;
      if (task.dueDate) {
        dueDate = new Date(task.dueDate).toISOString().split('T')[0];
      }
      
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority || TaskPriority.LOW,
        dueDate: dueDate,
        duration: task.duration,
      });
    }
  }, [task, today]);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle number inputs
    if (name === 'duration') {
      const numberValue = value === '' ? undefined : Number(value);
      setFormData({ ...formData, [name]: numberValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Handle priority selection
  const handlePriorityChange = (priority: TaskPriority) => {
    setFormData({ ...formData, priority });
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    
    if (formData.duration !== undefined && formData.duration <= 0) {
      newErrors.duration = 'Duration must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Create a new date with time set to end of day for the due date
      const dueDate = new Date(formData.dueDate);
      dueDate.setHours(23, 59, 59, 999);
      
      const updatedFormData = {
        ...formData,
        dueDate: dueDate.toISOString()
      };
      
      if (task) {
        // Update existing task
        await updateTask(task.id, updatedFormData);
      } else {
        // Create new task
        await createTask(updatedFormData);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      setErrors({ form: 'Failed to save task. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-form-overlay">
      <div className="task-form-container">
        <button className="close-button" onClick={onClose}>×</button>
        
        <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
        
        {errors.form && <div className="form-error">{errors.form}</div>}
        
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? 'error' : ''}
              disabled={loading}
            />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              min={today}
              className={errors.dueDate ? 'error' : ''}
              disabled={loading}
            />
            {errors.dueDate && <div className="field-error">{errors.dueDate}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={loading || task?.status === TaskStatus.TIMEOUT}
            >
              {Object.values(TaskStatus).map((status) => (
                <option 
                  key={status} 
                  value={status}
                  disabled={task?.status === TaskStatus.TIMEOUT && status !== TaskStatus.TIMEOUT}
                >
                  {status}
                </option>
              ))}
            </select>
            {task?.status === TaskStatus.TIMEOUT && (
              <div className="field-info">Timed out tasks cannot change status</div>
            )}
          </div>
          
          <div className="form-group">
            <label>Priority</label>
            <div className="priority-options">
              <div 
                className={`priority-option low ${formData.priority === TaskPriority.LOW ? 'selected' : ''}`}
                onClick={() => handlePriorityChange(TaskPriority.LOW)}
              >
                Low
              </div>
              <div 
                className={`priority-option medium ${formData.priority === TaskPriority.MEDIUM ? 'selected' : ''}`}
                onClick={() => handlePriorityChange(TaskPriority.MEDIUM)}
              >
                Medium
              </div>
              <div 
                className={`priority-option high ${formData.priority === TaskPriority.HIGH ? 'selected' : ''}`}
                onClick={() => handlePriorityChange(TaskPriority.HIGH)}
              >
                High
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="duration">
              Duration (minutes)
              <span className="optional-field"> - optional</span>
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration === undefined ? '' : formData.duration}
              onChange={handleChange}
              min="1"
              className={errors.duration ? 'error' : ''}
              disabled={loading}
            />
            {errors.duration && <div className="field-error">{errors.duration}</div>}
            <div className="field-info">
              Tasks will time out automatically if their duration exceeds the system limit
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={loading}
            >
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;