import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Set up test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
});

afterAll(async () => {
  // Cleanup after all tests
});