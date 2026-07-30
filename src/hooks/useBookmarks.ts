import { useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../config';

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.bookmarks);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.warn('Failed to save bookmarks', e);
    }
  }, [bookmarkedIds]);

  const toggleBookmark = useCallback((id: number) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarkedIds([]);
  }, []);

  return { bookmarkedIds, toggleBookmark, clearBookmarks };
}
