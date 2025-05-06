// webapp/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

// React Router v7 future flags 설정
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

// 루트 엘리먼트에 앱을 렌더링
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter {...router}>
      <ChakraProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// --- PWA: Service Worker 등록 ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')   // public/sw.js 또는 빌드된 서비스워커 파일 경로
      .then(reg => console.log('🟢 ServiceWorker registered:', reg.scope))
      .catch(err => console.error('🔴 SW registration failed:', err));
  });
}
