import express from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskWithStreamingData,
  getStreamingData
} from '../controllers/taskController';

const router = express.Router();

// Task routes
router.get('/tasks', getAllTasks);
router.get('/tasks/:id', getTaskById);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Streaming data routes
router.get('/tasks/:id/streaming', getTaskWithStreamingData);
router.get('/streaming', getStreamingData);

export default router;