class MemoryStore {
  constructor() {
    this.items = {};
  }

  async retrieve(url) {
    return Promise.resolve(this.items[url]);
  }

  async upsert(item) {
    const { url } = item;
    this.items[url] = item;
    return Promise.resolve(item);
  }

  remove(url) {
    const item = this.items[url];
    delete this.items[url];
    return Promise.resolve(item);
  }

  size() {
    return Promise.resolve(Object.keys(this.items).length);
  }
}

export default MemoryStore;
