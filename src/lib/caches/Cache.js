class Cache {
  async add(item) {
    // TODO implement
  }

  async explored(item) {
    // TODO implement
  }

  async next(item) {
    // TODO implement
  }

  /**
   * Only used for distributed caches.
   * When called, delists crawled URLs from the
   * temporary collection.  This ensures that the
   * page will be scraped, and caught if the program
   * crashes.
   */
  async delist(item) {}

  async size() {
    // TODO implement
  }

  async empty() {
    // TODO implement
  }
}
