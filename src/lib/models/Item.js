import mongoose from 'mongoose';

const { Schema } = mongoose;

const itemSchema = new Schema({
  originUrl: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  plainText: String,
  lastUpdated: {
    required: true,
    type: Date,
    default: Date.now
  },
  firstCreated: {
    required: true,
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Item', itemSchema);
