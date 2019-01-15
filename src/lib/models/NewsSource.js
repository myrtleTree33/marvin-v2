import mongoose from 'mongoose';

const { Schema } = mongoose;

const newsSourceSchema = new Schema({
  originUrl: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  lang: {
    type: String,
    required: true
  },
  // see https://stackoverflow.com/questions/32199658/create-find-geolocation-in-mongoose
  loc: {
    type: { type: String },
    coordinates: [Number]
  },
  dateAdded: {
    required: true,
    type: Date,
    default: Date.now
  }
});

newsSourceSchema.index({ loc: '2dsphere' });

export default mongoose.model('NewsSource', newsSourceSchema);
