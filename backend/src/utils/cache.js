// High-performance In-Memory TTL Cache for Express
class MemoryCache {
  constructor(defaultTTL = 60 * 1000) { // default 60s
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  del(key) {
    this.cache.delete(key);
  }

  delPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  flush() {
    this.cache.clear();
  }
}

const memoryCache = new MemoryCache();

module.exports = memoryCache;
