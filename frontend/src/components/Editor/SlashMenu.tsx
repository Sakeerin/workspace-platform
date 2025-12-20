import React, { useEffect, useRef } from 'react';

interface SlashMenuItem {
  type: string;
  label: string;
  icon?: string;
}

interface SlashMenuProps {
  position: { x: number; y: number };
  onSelect: (item: SlashMenuItem) => void;
  onClose: () => void;
}

const menuItems: SlashMenuItem[] = [
  { type: 'paragraph', label: 'Paragraph', icon: '📝' },
  { type: 'heading1', label: 'Heading 1', icon: '📄' },
  { type: 'heading2', label: 'Heading 2', icon: '📄' },
  { type: 'heading3', label: 'Heading 3', icon: '📄' },
  { type: 'bullet_list', label: 'Bulleted List', icon: '•' },
  { type: 'numbered_list', label: 'Numbered List', icon: '1.' },
  { type: 'todo', label: 'To-do', icon: '☐' },
];

export default function SlashMenu({ position, onSelect, onClose }: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(menuItems[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto min-w-64"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {menuItems.map((item, index) => (
        <button
          key={item.type}
          type="button"
          onClick={() => onSelect(item)}
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 ${
            index === selectedIndex ? 'bg-gray-100' : ''
          }`}
        >
          {item.icon && <span>{item.icon}</span>}
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

