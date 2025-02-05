import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this task'],
    maxlength: [60, 'Title cannot be more than 60 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a description for this task'],
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide a due date for this task'],
  },
  completed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

export default Task;