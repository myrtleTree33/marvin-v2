import mongoose from 'mongoose';

const { Schema } = mongoose;

const failedItemSchema = new Schema({
  url: {
    type: String,
    unique: true,
    required: true
  },
  rootUrl: {
    type: String,
    required: true
  },
  priority: Number,
  dateAdded: { type: Date, default: Date.now },
  httpResponseCode: {
    type: String,
    required: true
  }
});

export default mongoose.model('FailedItem', failedItemSchema);
