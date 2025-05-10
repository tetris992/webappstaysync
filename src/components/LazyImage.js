// src/components/LazyImage.js

import React, { useRef, useEffect, useState } from 'react';
import { Image } from '@chakra-ui/react';

/**
 * 뷰포트 진입 시 실제 이미지를 로드하고,
 * 진입 전엔 LQIP(저해상도) + 블러 처리된 이미지 보여줌
 *
 * @param {object} props
 * @param {string} props.src - 실제 고해상도 이미지 URL
 * @param {string} [props.lqipSrc] - 저해상도 플레이스홀더 URL
 * @param {string} [props.alt] - alt 텍스트
 * @param {...any} props - Chakra Image에 들어가는 나머지 props
 */
function LazyImage({
  src,
  alt = '',
  lqipSrc = '/assets/low-res-placeholder.jpg',
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Image
      ref={imgRef}
      src={visible ? src : lqipSrc}
      alt={alt}
      loading="lazy"
      filter={visible ? 'none' : 'blur(10px)'}
      transition="filter 0.3s ease, opacity 0.3s ease"
      opacity={visible ? 1 : 0.5}
      {...props}
    />
  );
}

export default LazyImage;
