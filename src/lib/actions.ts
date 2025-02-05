'use server';

import { revalidatePath } from 'next/cache';
import connectDB from './db';
import Task from '@/models/Task';
import type { TaskInput, TaskUpdate } from './definitions';
import type { Types, FlattenMaps } from 'mongoose';

export interface TaskDocument extends TaskInput {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BaseTask {
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MongoDocument extends BaseTask {
  _id: Types.ObjectId;
  __v: number;
}

type TaskLeanDocument = FlattenMaps<MongoDocument>;

function convertToTaskDocument(doc: TaskLeanDocument): TaskDocument {
  if (!doc || !doc._id || typeof doc.title !== 'string' || typeof doc.description !== 'string') {
    throw new Error('Invalid document structure');
  }

  return {
    _id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    dueDate: new Date(doc.dueDate),
    completed: Boolean(doc.completed),
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

export async function getTasks(): Promise<TaskDocument[]> {
  try {
    await connectDB();
    const tasks = await Task.find().lean().sort({ createdAt: -1 }) as TaskLeanDocument[];

    if (!Array.isArray(tasks)) {
      throw new Error('Failed to fetch tasks');
    }

    return tasks.map(convertToTaskDocument);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch tasks');
  }
}

export async function createTask(input: TaskInput): Promise<TaskDocument> {
  try {
    await connectDB();
    const task = await Task.create(input);
    const doc = task.toObject() as FlattenMaps<MongoDocument>; 
    revalidatePath('/');
    return convertToTaskDocument(doc);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to create task');
  }
}

export async function updateTask({ id, ...data }: TaskUpdate): Promise<TaskDocument> {
  try {
    await connectDB();
    const task = await Task.findByIdAndUpdate(
      id,
      { ...data },
      { new: true, runValidators: true }
    ).lean() as TaskLeanDocument | null;

    if (!task) {
      throw new Error('Task not found');
    }

    revalidatePath('/');
    return convertToTaskDocument(task);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to update task');
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    await connectDB();
    const result = await Task.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Task not found');
    }
    revalidatePath('/');
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to delete task');
  }
}

export async function toggleTaskCompletion(id: string): Promise<TaskDocument> {
  try {
    await connectDB();
    const task = await Task.findById(id);
    if (!task) {
      throw new Error('Task not found');
    }

    task.completed = !task.completed;
    await task.save();
    const doc = task.toObject() as FlattenMaps<MongoDocument>;
    revalidatePath('/');
    return convertToTaskDocument(doc);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to toggle task completion');
  }
}