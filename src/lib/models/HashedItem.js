import mongoose from 'mongoose';

const { Schema } = mongoose;

const hashedItemSchema = new Schema({
  url: {
    type: String,
    unique: true,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  lastScraped: {
    type: Date,
    default: Date.now,
    required: true
  },
  intervalSecs: {
    type: Number,
    required: true
  }
});

export default mongoose.model('HashedItem', hashedItemSchema);
