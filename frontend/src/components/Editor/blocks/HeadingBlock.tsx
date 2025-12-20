import React, { useState } from 'react';

interface HeadingBlockProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: { text?: string };
  properties?: Record<string, any>;
  onUpdate?: (content: { text?: string }, properties?: Record<string, any>) => void;
  isEditable?: boolean;
}

const headingClasses = {
  1: 'text-4xl font-bold mb-4',
  2: 'text-3xl font-bold mb-3',
  3: 'text-2xl font-bold mb-2',
  4: 'text-xl font-semibold mb-2',
  5: 'text-lg font-semibold mb-2',
  6: 'text-base font-semibold mb-2',
};

const HeadingTag = ({ level, children, ...props }: { level: 1 | 2 | 3 | 4 | 5 | 6; children: React.ReactNode; [key: string]: any }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag {...props}>{children}</Tag>;
};

export default function HeadingBlock({
  level,
  content,
  properties,
  onUpdate,
  isEditable = true,
}: HeadingBlockProps) {
  const [text, setText] = useState(content.text || '');

  const handleChange = (e: React.ChangeEvent<HTMLHeadingElement>) => {
    const newText = e.target.textContent || '';
    setText(newText);
    onUpdate?.({ text: newText }, properties);
  };

  return (
    <HeadingTag
      level={level}
      contentEditable={isEditable}
      onInput={handleChange}
      className={`${headingClasses[level]} text-gray-900 focus:outline-none`}
      style={{
        textAlign: properties?.alignment || 'left',
        color: properties?.color || 'inherit',
      }}
      suppressContentEditableWarning
    >
      {text || (isEditable ? '' : 'Empty heading')}
    </HeadingTag>
  );
}

