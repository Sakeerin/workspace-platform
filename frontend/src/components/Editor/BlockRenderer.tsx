import React from 'react';
import ParagraphBlock from './blocks/ParagraphBlock';
import HeadingBlock from './blocks/HeadingBlock';
import ListBlock from './blocks/ListBlock';
import TodoBlock from './blocks/TodoBlock';

interface Block {
  uuid: string;
  type: string;
  content: Record<string, any>;
  properties?: Record<string, any>;
  position: number;
  depth: number;
}

interface BlockRendererProps {
  block: Block;
  onUpdate?: (blockUuid: string, content: Record<string, any>, properties?: Record<string, any>) => void;
  isEditable?: boolean;
}

export default function BlockRenderer({
  block,
  onUpdate,
  isEditable = true,
}: BlockRendererProps) {
  const handleUpdate = (content: Record<string, any>, properties?: Record<string, any>) => {
    onUpdate?.(block.uuid, content, properties);
  };

  const blockProps = {
    content: block.content,
    properties: block.properties,
    onUpdate: handleUpdate,
    isEditable,
  };

  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlock {...blockProps} />;

    case 'heading1':
      return <HeadingBlock level={1} {...blockProps} />;
    case 'heading2':
      return <HeadingBlock level={2} {...blockProps} />;
    case 'heading3':
      return <HeadingBlock level={3} {...blockProps} />;
    case 'heading4':
      return <HeadingBlock level={4} {...blockProps} />;
    case 'heading5':
      return <HeadingBlock level={5} {...blockProps} />;
    case 'heading6':
      return <HeadingBlock level={6} {...blockProps} />;

    case 'bullet_list':
    case 'numbered_list':
      return <ListBlock type={block.type as 'bullet_list' | 'numbered_list'} {...blockProps} />;

    case 'todo':
      return <TodoBlock {...blockProps} />;

    default:
      return (
        <div className="mb-2 p-2 bg-gray-100 rounded text-gray-600 text-sm">
          Unsupported block type: {block.type}
        </div>
      );
  }
}

