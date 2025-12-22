import React from 'react';

interface SearchResult {
  uuid: string;
  title: string;
  type: 'page' | 'block' | 'database';
  content?: string;
  page_id?: string;
  block_id?: string;
  updated_at: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelect: (result: SearchResult) => void;
  query: string;
}

export default function SearchResults({
  results,
  selectedIndex,
  onSelect,
  query,
}: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>No results found for &quot;{query}&quot;</p>
      </div>
    );
  }

  const highlightText = (text: string, query: string) => {
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return '📄';
      case 'database':
        return '🗄️';
      case 'block':
        return '📝';
      default:
        return '📄';
    }
  };

  return (
    <div className="max-h-96 overflow-y-auto">
      {results.map((result, index) => (
        <div
          key={result.uuid}
          onClick={() => onSelect(result)}
          className={`px-4 py-3 cursor-pointer border-b border-gray-200 dark:border-gray-700 ${
            index === selectedIndex
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{getTypeIcon(result.type)}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                {highlightText(result.title, query)}
              </div>
              {result.content && (
                <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {highlightText(result.content.substring(0, 100), query)}
                </div>
              )}
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {result.type} • {new Date(result.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

