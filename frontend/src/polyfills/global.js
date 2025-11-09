// This file provides a global polyfill for libraries like Draft.js that expect Node.js globals

// If window global is not defined, define it
if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

// Ensure global is available
if (typeof global === 'undefined') {
  if (typeof globalThis !== 'undefined') {
    global = globalThis;
  } else if (typeof window !== 'undefined') {
    global = window;
  }
}

// Additional React Context polyfill for production builds
if (typeof window !== 'undefined') {
  // Ensure React is properly initialized
  window.process = window.process || { env: { NODE_ENV: 'production' } };
}

export default null;
