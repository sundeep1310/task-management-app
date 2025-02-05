# Task Management Application

A modern task management application built with Next.js 14, featuring server actions and MongoDB integration.

## Features

- ✅ Create, read, update, and delete tasks
- ✅ Mark tasks as complete/incomplete
- ✅ Due date tracking with validation
- ✅ Responsive design
- ✅ Real-time UI updates
- ✅ Server-side rendering
- ✅ Loading states and error handling

## Tech Stack

- **Framework:** Next.js 14
- **Database:** MongoDB
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Authentication:** Not implemented (can be added using NextAuth.js)

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/task-management-app.git
cd task-management-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

- `MONGODB_URI`: Your MongoDB connection string

## Project Structure

```
task-management-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── error.tsx
│   └── loading.tsx
├── components/
│   ├── TaskForm.tsx
│   ├── TaskList.tsx
│   └── Taskitem.tsx
├── lib/
│   ├── actions.ts
│   ├── db.ts
│   └── definitions.ts
├── models/
│   └── Task.ts
└── public/
```

## Deployment

1. Create a Vercel account if you haven't already
2. Connect your GitHub repository to Vercel
3. Add the environment variables in Vercel's project settings
4. Deploy!

## Database Schema

```typescript
Task {
  title: string;       // Task title (max 60 chars)
  description: string; // Task description (max 1000 chars)
  dueDate: Date;      // Task due date
  completed: boolean;  // Task completion status
  createdAt: Date;    // Timestamp of creation
  updatedAt: Date;    // Timestamp of last update
}
```
