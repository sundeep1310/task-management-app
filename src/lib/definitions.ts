export interface Task {
    _id: string;
    title: string;
    description: string;
    dueDate: Date;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export type TaskInput = Omit<Task, '_id' | 'createdAt' | 'updatedAt'>;
  
  export type TaskUpdate = Partial<TaskInput> & {
    id: string;
  };