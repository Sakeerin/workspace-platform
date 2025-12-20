import React, { useState } from 'react';

interface ParagraphBlockProps {
  content: { text?: string };
  properties?: Record<string, any>;
  onUpdate?: (content: { text?: string }, properties?: Record<string, any>) => void;
  isEditable?: boolean;
}

export default function ParagraphBlock({
  content,
  properties,
  onUpdate,
  isEditable = true,
}: ParagraphBlockProps) {
  const [text, setText] = useState(content.text || '');

  const handleChange = (e: React.ChangeEvent<HTMLParagraphElement>) => {
    const newText = e.target.textContent || '';
    setText(newText);
    onUpdate?.({ text: newText }, properties);
  };

  return (
    <p
      contentEditable={isEditable}
      onInput={handleChange}
      className="mb-2 text-gray-800 leading-relaxed focus:outline-none"
      style={{
        textAlign: properties?.alignment || 'left',
        color: properties?.color || 'inherit',
      }}
      suppressContentEditableWarning
    >
      {text || (isEditable ? '' : 'Empty paragraph')}
    </p>
  );
}

