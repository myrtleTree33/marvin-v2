import mongoose from 'mongoose';
import { isValidUrl } from '../UrlUtils';

const { Schema } = mongoose;

const cacheItemSchema = new Schema({
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
  dateAdded: { type: Date, default: Date.now }
});

class MongoCache {
  constructor(mongooseConn) {
    this.mongoose = mongooseConn;
    this.CacheItem = this.mongoose.model('CacheItem', cacheItemSchema);

    // this collection is for cache items that are being explored at current.
    this.CacheItemExploring = this.mongoose.model(
      'CacheItemExploring',
      cacheItemSchema
    );
  }

  async add(item) {
    try {
      // skip if item is already in queue
      if (await this.explored(item)) {
        return Promise.resolve(false);
      }
      await new this.CacheItem(item).save();
      console.log(`Added ${url}..`);
      return Promise.resolve(true);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  async explored(item) {
    // if item is in cache or is being explored,
    // then it is explored.
    const { url } = item;
    const cacheItems = this.CacheItem.findOne({ url });
    const cacheItemsExploring = this.CacheItemExploring.findOne({ url });
    const result = await Promise.all([cacheItems, cacheItemsExploring]);
    // TODO there is an error querying the db here
    return Promise.resolve(result[0] || result[0]);
  }

  async next() {
    // TODO get data where isScraping is true,
    // but has not been scraped for a long time
    // as well.
    const item = await this.CacheItem.findOneAndDelete({});
    if (!item) {
      return Promise.resolve(null);
    }

    const { url } = item;
    if (!isValidUrl(url)) {
      return Promise.resolve(null);
    }
    const newItem = {
      url: item.url,
      rootUrl: item.rootUrl,
      priority: item.priority,
      dateAdded: item.dateAdded
    };
    await this.CacheItemExploring.findOneAndUpdate({ url }, newItem, {
      upsert: true
    });
    return Promise.resolve(item);
  }

  async size() {
    return this.CacheItem.find({}).count();
  }

  async delist(item) {
    const { url } = item;
    return this.CacheItemExploring.deleteOne({ url });
  }

  async empty() {
    return Promise.resolve((await this.size()) === 0);
  }
}

export default MongoCache;
