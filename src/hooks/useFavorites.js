// src/hooks/useFavorites.js
import { useState, useCallback } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavorite = useCallback((hotelId) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(hotelId)
        ? prev.filter((id) => id !== hotelId)
        : [...prev, hotelId];
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((hotelId) => favorites.includes(hotelId), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}