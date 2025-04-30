// utils/logger.js
const logger = {
    debug: (...args) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(...args);
      }
    },
    info: (...args) => {
      if (process.env.NODE_ENV === 'development') {
        console.info(...args);
      }
    },
    warn: (...args) => {
      console.warn(...args);
    },
    error: (...args) => {
      console.error(...args);
    },
  };
  
  export default logger;