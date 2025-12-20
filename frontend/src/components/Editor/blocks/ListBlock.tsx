import React, { useState } from 'react';

interface ListBlockProps {
  type: 'bullet_list' | 'numbered_list';
  content: { items?: string[] };
  properties?: Record<string, any>;
  onUpdate?: (content: { items?: string[] }, properties?: Record<string, any>) => void;
  isEditable?: boolean;
}

export default function ListBlock({
  type,
  content,
  properties,
  onUpdate,
  isEditable = true,
}: ListBlockProps) {
  const [items, setItems] = useState<string[]>(content.items || ['']);

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
    onUpdate?.({ items: newItems }, properties);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLLIElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newItems = [...items];
      newItems.splice(index + 1, 0, '');
      setItems(newItems);
      onUpdate?.({ items: newItems }, properties);
    } else if (e.key === 'Backspace' && items[index] === '' && items.length > 1) {
      e.preventDefault();
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      onUpdate?.({ items: newItems }, properties);
    }
  };

  const ListTag = type === 'bullet_list' ? 'ul' : 'ol';
  const listStyle = type === 'bullet_list' ? 'list-disc' : 'list-decimal';

  return (
    <ListTag className={`${listStyle} list-inside mb-2 ml-4 space-y-1`}>
      {items.map((item, index) => (
        <li
          key={index}
          contentEditable={isEditable}
          onInput={(e) => handleItemChange(index, e.currentTarget.textContent || '')}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="text-gray-800 focus:outline-none"
          suppressContentEditableWarning
        >
          {item || ''}
        </li>
      ))}
    </ListTag>
  );
}

