// src/hooks/useImagePreloader.js

import { useEffect } from 'react';

/**
 * 주어진 URL 배열 중 상위 N개 이미지를 미리 로드합니다.
 * @param {string[]} urls - 이미지 URL 배열
 * @param {number} limit - 최대 프리로드 개수 (기본 5)
 */
function useImagePreloader(urls = [], limit = 5) {
  useEffect(() => {
    if (!Array.isArray(urls) || urls.length === 0) return;

    // 유효한 문자열 URL만 필터 + 지정 개수만큼
    const validUrls = urls
      .filter((url) => typeof url === 'string' && url)
      .slice(0, limit);

    validUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [urls, limit]);
}

export default useImagePreloader;
