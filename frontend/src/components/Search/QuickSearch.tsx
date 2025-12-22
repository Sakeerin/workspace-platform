import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import SearchResults from './SearchResults';

interface SearchResult {
  uuid: string;
  title: string;
  type: 'page' | 'block' | 'database';
  content?: string;
  page_id?: string;
  block_id?: string;
  updated_at: string;
}

interface QuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceUuid: string;
}

export default function QuickSearch({ isOpen, onClose, workspaceUuid }: QuickSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { workspaceUuid: routeWorkspaceUuid } = useParams<{ workspaceUuid: string }>();
  const effectiveWorkspaceUuid = workspaceUuid || routeWorkspaceUuid || '';

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || !effectiveWorkspaceUuid) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get<{
          success: boolean;
          data: SearchResult[];
        }>(`/workspaces/${effectiveWorkspaceUuid}/search`, {
          params: { q: query },
        });

        setResults(response.data);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(timeoutId);
  }, [query, effectiveWorkspaceUuid]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelectResult(results[selectedIndex]);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'page' || result.type === 'database') {
      navigate(`/workspaces/${effectiveWorkspaceUuid}/pages/${result.uuid}`);
    } else if (result.page_id) {
      navigate(`/workspaces/${effectiveWorkspaceUuid}/pages/${result.page_id}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, blocks, and databases..."
            className="w-full px-4 py-2 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        {isLoading && (
          <div className="p-4 text-center text-gray-500">Searching...</div>
        )}
        {!isLoading && query && (
          <SearchResults
            results={results}
            selectedIndex={selectedIndex}
            onSelect={handleSelectResult}
            query={query}
          />
        )}
      </div>
    </div>
  );
}

