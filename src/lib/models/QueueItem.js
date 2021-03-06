import mongoose from 'mongoose';

const { Schema } = mongoose;

const queueItemSchema = new Schema({
  url: {
    type: String,
    unique: true,
    required: true
  },
  rootUrl: {
    type: String,
    required: true
  },
  depth: {
    type: Number,
    required: true
  },
  maxRandDelayMs: {
    type: Number,
    required: true
  },
  priority: Number,
  dateAdded: { type: Date, default: Date.now }
});

export default mongoose.model('QueueItem', queueItemSchema);
