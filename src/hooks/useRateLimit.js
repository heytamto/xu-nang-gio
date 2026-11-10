// src/hooks/useRateLimit.js
import { useRef } from 'react';

export function useRateLimit(maxRequests = 5, windowMs = 10000) {
  const requestsRef = useRef([]);

  const checkRateLimit = () => {
    const now = Date.now();
    // Lọc bỏ các request đã hết thời gian window
    requestsRef.current = requestsRef.current.filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (requestsRef.current.length >= maxRequests) {
      const waitTime = Math.ceil(
        (windowMs - (now - requestsRef.current[0])) / 1000
      );
      return {
        allowed: false,
        message: `Tâm thao tác hơi nhanh rồi! Vui lòng đợi ${waitTime}s để thử lại nhé.`
      };
    }

    requestsRef.current.push(now);
    return { allowed: true };
  };

  return { checkRateLimit };
}