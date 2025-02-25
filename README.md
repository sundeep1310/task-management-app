# Task Management Application

A modern, responsive task management application built with React, TypeScript, and Node.js. Manage your tasks with a beautiful Kanban-style interface, complete with drag-and-drop functionality, dark mode support, and persistent storage.

![Task Management Application Screenshot](./example.png)

## Features

- ✅ **Kanban Board Layout**: Visualize tasks across different status categories
- 🔄 **Drag & Drop**: Move tasks between columns with intuitive drag-and-drop
- 🌓 **Dark Mode**: Toggle between light and dark themes
- 📊 **Task Priority**: Assign Low, Medium, or High priority to tasks
- 📅 **Due Dates**: Set and track deadlines with visual indicators
- ⚡ **Real-Time Updates**: Tasks update across browser windows automatically
- 💾 **Persistent Storage**: Tasks are saved between sessions
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

### Frontend
- React with TypeScript
- Context API for state management
- CSS for styling (no external UI libraries)
- Axios for API requests

### Backend
- Node.js with Express
- TypeScript
- File-based JSON storage
- RESTful API design

## Getting Started

### Prerequisites
- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sundeep1310/task-management-app.git
   cd task-management-app
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to http://localhost:3000

## Usage

- **Add Tasks**: Click the "Add Task" button to create a new task
- **Edit Tasks**: Click the three dots menu on a task card and select "Edit"
- **Delete Tasks**: Click the three dots menu and select "Delete"
- **Move Tasks**: Drag and drop tasks between columns
- **Switch Theme**: Click the sun/moon icon in the header to toggle dark mode
- **Filter Tasks**: Use the category slider to view tasks by status

## Project Structure

```
task-management-app/
├── frontend/                       # React TypeScript frontend
│   ├── public/                     # Static files
│   └── src/
│       ├── api/                    # API integration
│       ├── components/             # React components
│       ├── context/                # Context API state management
│       ├── hooks/                  # Custom hooks
│       ├── types/                  # TypeScript type definitions
│       └── utils/                  # Utility functions
│
└── backend/                        # Node.js Express backend
    ├── data/                       # Persistent storage (JSON files)
    └── src/
        ├── controllers/            # Request handlers
        ├── middleware/             # Middleware functions
        ├── models/                 # Data models
        ├── routes/                 # API routes
        └── services/               # Business logic
```

## Deployment

The application can be deployed using services like:
- Frontend: Vercel
- Backend: Render


## Future Improvements

- User authentication and individual task lists
- Task filtering and searching
- Subtasks and checklists
- File attachments
- Email notifications for approaching deadlines
- Mobile application with React Native

