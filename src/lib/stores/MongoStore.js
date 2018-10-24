import mongoose from 'mongoose';

const { Schema } = mongoose;

const itemSchema = new Schema({
  url: {
    type: String,
    unique: true
  },
  htmlText: String,
  dateScraped: { type: Date, default: Date.now }
});

class MongoStore {
  constructor(mongooseConn) {
    this.mongoose = mongooseConn;
    this.Item = mongoose.model('Item', itemSchema);
  }

  async retrieve(url) {
    return this.Item.findOne({ url });
  }

  async upsert(item) {
    const { url, htmlText } = item;
    const updatedItem = await this.Item.findOneAndUpdate(
      { url },
      { url, htmlText }
    );
    if (!updatedItem) {
      return new this.Item({ url, htmlText }).save();
    }
    console.log('existing item found!!!!!');
    return Promise.resolve(updatedItem);
  }

  async remove(url) {
    return this.Item.remove({ url });
  }

  async size() {
    return this.Item.count({});
  }
}

export default MongoStore;
