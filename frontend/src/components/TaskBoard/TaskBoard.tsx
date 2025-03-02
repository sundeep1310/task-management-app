import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../../types';
import { useTaskContext } from '../../context/TaskContext';
import TaskColumn from '../TaskColumn/TaskColumn';
import TaskForm from '../TaskForm/TaskForm';
import SummaryCard from '../SummaryCard/SummaryCard';
import './TaskBoard.css';

interface TaskBoardProps {
  searchTerm?: string;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ searchTerm = '' }) => {
  const { state, refreshTasks, wakeUpServer } = useTaskContext();
  const { tasks, loading, error } = state;
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [serverWaking, setServerWaking] = useState(false);

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // On first load, try to wake up the server if needed
  useEffect(() => {
    const wakeUpServerIfNeeded = async () => {
      if (tasks.length === 0 && !loading && !error) {
        setServerWaking(true);
        try {
          // Try to wake up the server
          await wakeUpServer();
          // Then refresh tasks
          await refreshTasks();
        } catch (err) {
          console.error("Failed to wake up server:", err);
        } finally {
          setServerWaking(false);
        }
      }
    };
    
    wakeUpServerIfNeeded();
  }, []);

  // Count tasks by status
  const countTasksByStatus = (status: TaskStatus | 'EXPIRED') => {
    if (status === 'EXPIRED') {
      // Count tasks that are timed out
      return filteredTasks.filter(task => task.status === TaskStatus.TIMEOUT).length;
    }
    return filteredTasks.filter(task => task.status === status).length;
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleRetryLoad = async () => {
    setServerWaking(true);
    try {
      await refreshTasks();
    } finally {
      setServerWaking(false);
    }
  };

  const expiredTasksCount = countTasksByStatus('EXPIRED');
  const activeTasksCount = filteredTasks.length;
  const completedTasksCount = countTasksByStatus(TaskStatus.DONE);

  // Show loading spinner while tasks are loading
  if (loading || serverWaking) {
    return (
      <div className="task-board-loading">
        <div className="loading-spinner"></div>
        <p>{serverWaking ? "Waking up server... This may take up to 30 seconds." : "Loading tasks..."}</p>
      </div>
    );
  }

  // Show error message if loading failed
  if (error) {
    return (
      <div className="task-board-error">
        <h3>Error Loading Tasks</h3>
        <p>{error}</p>
        <p className="error-detail">The server might be waking up from sleep mode. Please try again.</p>
        <button className="retry-button" onClick={handleRetryLoad}>Retry</button>
      </div>
    );
  }

  return (
    <div className="task-board-container">
      <div className="task-summary-row">
        <SummaryCard 
          icon="🔴" 
          title="Expired Tasks" 
          count={expiredTasksCount} 
        />
        <SummaryCard 
          icon="📋" 
          title="All Active Tasks" 
          count={activeTasksCount} 
        />
        <SummaryCard 
          icon="⏱️" 
          title="Completed Tasks" 
          count={completedTasksCount} 
          total={activeTasksCount}
        />
      </div>

      <div className="task-board">
        <TaskColumn 
          title="To Do" 
          tasks={filteredTasks.filter(task => task.status === TaskStatus.TODO)}
          onEditTask={handleEditTask}
        />
        <TaskColumn 
          title="In Progress" 
          tasks={filteredTasks.filter(task => task.status === TaskStatus.IN_PROGRESS)}
          onEditTask={handleEditTask}
        />
        <TaskColumn 
          title="Done" 
          tasks={filteredTasks.filter(task => task.status === TaskStatus.DONE)}
          onEditTask={handleEditTask}
        />
        <TaskColumn 
          title="Timeout" 
          tasks={filteredTasks.filter(task => task.status === TaskStatus.TIMEOUT)}
          onEditTask={handleEditTask}
        />
      </div>

      <button className="add-task-btn" onClick={handleAddTask}>
        Add Task
      </button>
      
      {showForm && (
        <TaskForm 
          task={editingTask} 
          onClose={handleCloseForm} 
        />
      )}
    </div>
  );
};

export default TaskBoard;