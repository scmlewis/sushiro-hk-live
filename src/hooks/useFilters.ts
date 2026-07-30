import { useState, useCallback } from 'react';
import { SortOption, ViewMode } from '../types';
import { TextSize } from '../config';
import { STORAGE_KEYS } from '../config';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function useTextSize() {
  const [textSize, setTextSize] = useState<TextSize>(() => readStorage<TextSize>(STORAGE_KEYS.textSize, 'M'));

  const handleTextSizeChange = useCallback((size: TextSize) => {
    setTextSize(size);
    writeStorage(STORAGE_KEYS.textSize, size);
  }, []);

  return { textSize, setTextSize: handleTextSizeChange };
}

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => readStorage<ViewMode>(STORAGE_KEYS.viewMode, 'list'));

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    writeStorage(STORAGE_KEYS.viewMode, mode);
  }, []);

  return { viewMode, setViewMode: handleViewModeChange };
}

export function useFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('wait-asc');
  const [onlyIssuingTickets, setOnlyIssuingTickets] = useState(false);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedArea('');
    setOnlyIssuingTickets(false);
  }, []);

  return {
    searchQuery, setSearchQuery,
    selectedArea, setSelectedArea,
    sortBy, setSortBy,
    onlyIssuingTickets, setOnlyIssuingTickets,
    resetFilters,
  };
}
