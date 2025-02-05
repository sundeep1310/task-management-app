import { getTasks } from '@/lib/actions';
import TaskItem from './TaskItem';
import { Suspense } from 'react';

export default async function TaskList() {
  const tasks = await getTasks();

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-700">
        No tasks yet. Create one to get started!
      </div>
    );
  }

  // Sort tasks: incomplete first, then by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="space-y-4 text-gray-900">
      {sortedTasks.map((task) => (
        <Suspense 
          key={task._id}
          fallback={
            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          }
        >
          <TaskItem task={task} />
        </Suspense>
      ))}
    </div>
  );
}