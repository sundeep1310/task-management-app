'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Task } from '@/lib/definitions';
import { toggleTaskCompletion, updateTask, deleteTask } from '@/lib/actions';
import { CalendarIcon, CheckCircleIcon, PencilIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface TaskItemProps {
  task: Task & {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export default function TaskItem({ task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dueDate = new Date(task.dueDate);
  const isOverdue = !task.completed && dueDate < new Date();

  async function handleToggle() {
    try {
      setLoading(true);
      setError(null);
      await toggleTaskCompletion(task._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setLoading(true);
      setError(null);
      await deleteTask(task._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      setLoading(false);
    }
  }

  if (isEditing) {
    return (
      <form action={async (formData: FormData) => {
        try {
          setLoading(true);
          setError(null);
          await updateTask({
            id: task._id,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            dueDate: new Date(formData.get('dueDate') as string),
            completed: task.completed,
          });
          setIsEditing(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to update task');
        } finally {
          setLoading(false);
        }
      }} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              defaultValue={task.title}
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              defaultValue={task.description}
              required
              rows={3}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              id="dueDate"
              defaultValue={format(dueDate, 'yyyy-MM-dd')}
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={loading}
              className="flex-1 bg-white text-gray-700 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${task.completed ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-4">
        <button
          onClick={handleToggle}
          disabled={loading}
          className="mt-1 text-gray-400 hover:text-indigo-600 disabled:opacity-50"
        >
          {task.completed ? (
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          ) : (
            <XCircleIcon className="h-6 w-6" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">
            {task.description}
          </p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span className={isOverdue ? 'text-red-500' : ''}>
              Due: {format(dueDate, 'PPP')}
              {isOverdue && ' (Overdue)'}
            </span>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading || task.completed}
            className="text-gray-400 hover:text-indigo-600 disabled:opacity-50"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-gray-400 hover:text-red-600 disabled:opacity-50"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}