import FailedItem from './models/FailedItem';
import Item from './models/Item';
import QueueItem from './models/QueueItem';
import HashedItem from './models/HashedItem';
import { hash } from './Utils';

class DistributedCache {
  constructor() {}

  async loadUrl({ url, priority }) {
    return this.enqueue({ url, priority });
  }

  async next() {
    const nextItem = await Item.findOneAndDelete({});
    if (!this.nextItem) {
      return Promise.resolve(null);
    }
    return nextItem;
  }

  async enqueue({ url, priority }) {
    this;
    const item = new Item({ rootUrl: url, url, priority });
    return Item.findOneAndUpdate(
      {
        url
      },
      item,
      { upsert: true }
    );
  }

  async processItem({ url, rootUrl, priority, htmlText }) {
    this;
    const hashedItem = HashedItem.findOne(url);
    if (!hashedItem) {
      // TODO save here
    }
  }
}

export default DistributedCache;
