// jest.setup.js

// Custom console.log with color
global.customLog = (...args) => {
    console.log('\x1b[96m%s\x1b[0m', ...args); // Cyan color
  };
      