import React, { useState, useEffect } from 'react';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import TaskBoard from './components/TaskBoard/TaskBoard';
import SearchBar from './components/SearchBar/SearchBar';
import './App.css';

const ThemeToggle: React.FC = () => {
  const { state, toggleDarkMode } = useTaskContext();
  
  return (
    <button 
      className="theme-toggle" 
      onClick={toggleDarkMode}
      aria-label={state.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {state.darkMode ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  );
};

const AppContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { state } = useTaskContext();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  useEffect(() => {
    // Apply dark mode class to document based on state
    if (state.darkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [state.darkMode]);

  return (
    <div className={`app ${state.darkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <h1>Task Management</h1>
        <p>Manage your tasks and track deadlines efficiently</p>
      </header>
      
      <main className="app-main">
        <div className="app-controls">
          <SearchBar onSearch={handleSearch} />
          <ThemeToggle />
        </div>
        <TaskBoard searchTerm={searchTerm} />
      </main>
      
      <footer className="app-footer">
        <p>Task Management Application &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
};

export default App;