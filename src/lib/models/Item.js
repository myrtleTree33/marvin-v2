import mongoose from 'mongoose';

const { Schema } = mongoose;

const itemSchema = new Schema({
  url: {
    type: String,
    unique: true
  },
  htmlText: String,
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('Item', itemSchema);
