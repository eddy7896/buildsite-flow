/**
 * Cache Service Tests
 */

const cacheService = require('../../services/cacheService');

describe('Cache Service', () => {
  beforeEach(async () => {
    await cacheService.clear();
  });

  afterAll(async () => {
    await cacheService.clear();
  });

  describe('set and get', () => {
    test('should set and get cached value', async () => {
      await cacheService.set('test-key', 'test-value', 60);
      const value = await cacheService.get('test-key');
      expect(value).toBe('test-value');
    });

    test('should return null for non-existent key', async () => {
      const value = await cacheService.get('non-existent');
      expect(value).toBeNull();
    });

    test('should handle object values', async () => {
      const testObject = { name: 'Test', value: 123 };
      await cacheService.set('object-key', testObject, 60);
      const value = await cacheService.get('object-key');
      expect(value).toEqual(testObject);
    });
  });

  describe('del', () => {
    test('should delete cached value', async () => {
      await cacheService.set('delete-key', 'value', 60);
      await cacheService.del('delete-key');
      const value = await cacheService.get('delete-key');
      expect(value).toBeNull();
    });
  });

  describe('delPattern', () => {
    test('should delete keys matching pattern', async () => {
      await cacheService.set('prefix:key1', 'value1', 60);
      await cacheService.set('prefix:key2', 'value2', 60);
      await cacheService.set('other:key', 'value', 60);
      
      await cacheService.delPattern('prefix:*');
      
      expect(await cacheService.get('prefix:key1')).toBeNull();
      expect(await cacheService.get('prefix:key2')).toBeNull();
      expect(await cacheService.get('other:key')).toBe('value');
    });
  });

  describe('clear', () => {
    test('should clear all cached values', async () => {
      await cacheService.set('key1', 'value1', 60);
      await cacheService.set('key2', 'value2', 60);
      
      await cacheService.clear();
      
      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key2')).toBeNull();
    });
  });

  describe('getStats', () => {
    test('should return cache statistics', async () => {
      await cacheService.set('key1', 'value1', 60);
      await cacheService.set('key2', 'value2', 60);
      
      const stats = await cacheService.getStats();
      expect(stats).toHaveProperty('type');
      expect(stats).toHaveProperty('size');
      expect(stats.size).toBeGreaterThanOrEqual(0);
    });
  });
});
