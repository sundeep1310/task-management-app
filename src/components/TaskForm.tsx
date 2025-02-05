'use client';

import { useState } from 'react';
import { createTask } from '@/lib/actions';
import { AlertCircle } from 'lucide-react';

export default function TaskForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    try {
      setLoading(true);
      
      const title = formData.get('title');
      const description = formData.get('description');
      const dueDate = formData.get('dueDate');

      if (!title || !description || !dueDate) {
        throw new Error('Please fill in all fields');
      }

      // Validate date range
      const selectedDate = new Date(dueDate.toString());
      const maxDate = new Date('2100-12-31');
      const minDate = new Date(today);

      if (selectedDate > maxDate) {
        throw new Error('Due date cannot be later than year 2100');
      }

      if (selectedDate < minDate) {
        throw new Error('Due date cannot be in the past');
      }

      await createTask({
        title: title.toString(),
        description: description.toString(),
        dueDate: selectedDate,
        completed: false,
      });
      
      // Reset form
      const form = document.getElementById('task-form') as HTMLFormElement;
      form.reset();
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        id="task-form"
        action={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter task title"
            required
            maxLength={60}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Enter task description"
            required
            maxLength={1000}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            required
            min={today}
            max="2100-12-31"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="text-green-500 text-sm bg-green-50 p-3 rounded-lg">
            Task created successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </>
  );
}