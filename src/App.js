// webapp/src/App.js
import React from 'react';
import AppContent from './AppContent';

function App() {
  // index.js에서 이미 ChakraProvider, AuthProvider, BrowserRouter가 적용되어 있으므로
  // App.js에서는 단순히 AppContent만 렌더링합니다.
  return <AppContent />;
}

export default App;
