import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';
import { Suspense } from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Task Management
        </h1>

        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Task</h2>
            <TaskForm />
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Your Tasks</h2>
            <Suspense fallback={
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            }>
              <TaskList />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  );
}