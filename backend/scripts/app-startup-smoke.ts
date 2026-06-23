import app from '../src/app';

if (!app || typeof app.use !== 'function') {
  throw new Error('Backend app entry point did not initialize an Express application.');
}

console.log('Backend application entry point initialized successfully.');
