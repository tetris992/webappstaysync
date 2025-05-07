// src/utils/pwaUtils.js
export const isIos = () =>
    /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  
  export const isInStandaloneMode = () =>
    'standalone' in window.navigator && window.navigator.standalone;
  