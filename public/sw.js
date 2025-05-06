/* eslint-disable */
// @ts-nocheck

self.addEventListener('install', (event) => {
  console.log('🟢 service worker 설치 완료');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🟢 service worker 활성화 완료');
  // 필요하면 이전 캐시 정리 등
});

self.addEventListener('fetch', (event) => {
  // 네트워크 요청 가로채기 예제
  // event.respondWith(fetch(event.request));
});
