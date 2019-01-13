import mongoose from 'mongoose';

const { Schema } = mongoose;

const itemSchema = new Schema({
  url: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  plainText: String,
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('Item', itemSchema);
