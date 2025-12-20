import React, { useState } from 'react';

interface TodoBlockProps {
  content: { text?: string; checked?: boolean };
  properties?: Record<string, any>;
  onUpdate?: (content: { text?: string; checked?: boolean }, properties?: Record<string, any>) => void;
  isEditable?: boolean;
}

export default function TodoBlock({
  content,
  properties,
  onUpdate,
  isEditable = true,
}: TodoBlockProps) {
  const [text, setText] = useState(content.text || '');
  const [checked, setChecked] = useState(content.checked || false);

  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    setChecked(newChecked);
    onUpdate?.({ text, checked: newChecked }, properties);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLSpanElement>) => {
    const newText = e.target.textContent || '';
    setText(newText);
    onUpdate?.({ text: newText, checked }, properties);
  };

  return (
    <div className="flex items-start mb-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleCheckChange}
        disabled={!isEditable}
        className="mt-1 mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
      />
      <span
        contentEditable={isEditable}
        onInput={handleTextChange}
        className={`flex-1 text-gray-800 focus:outline-none ${
          checked ? 'line-through text-gray-500' : ''
        }`}
        suppressContentEditableWarning
      >
        {text || (isEditable ? '' : 'Empty todo')}
      </span>
    </div>
  );
}

