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

/**
 * Block Renderer Component
 * 
 * Renders individual blocks based on their type. Supports multiple block types
 * including paragraphs, headings, lists, and todos.
 * 
 * @param {BlockRendererProps} props - Component props
 * @param {Block} props.block - Block data to render
 * @param {Function} props.onUpdate - Callback when block is updated
 * @param {boolean} props.isEditable - Whether block is editable
 * 
 * @example
 * <BlockRenderer
 *   block={blockData}
 *   onUpdate={(uuid, content) => handleUpdate(uuid, content)}
 *   isEditable={true}
 * />
 */
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
      return (
        <div role="textbox" aria-label="Paragraph block">
          <ParagraphBlock {...blockProps} />
        </div>
      );

    case 'heading1':
      return (
        <div role="heading" aria-level={1} aria-label="Heading level 1">
          <HeadingBlock level={1} {...blockProps} />
        </div>
      );
    case 'heading2':
      return (
        <div role="heading" aria-level={2} aria-label="Heading level 2">
          <HeadingBlock level={2} {...blockProps} />
        </div>
      );
    case 'heading3':
      return (
        <div role="heading" aria-level={3} aria-label="Heading level 3">
          <HeadingBlock level={3} {...blockProps} />
        </div>
      );
    case 'heading4':
      return (
        <div role="heading" aria-level={4} aria-label="Heading level 4">
          <HeadingBlock level={4} {...blockProps} />
        </div>
      );
    case 'heading5':
      return (
        <div role="heading" aria-level={5} aria-label="Heading level 5">
          <HeadingBlock level={5} {...blockProps} />
        </div>
      );
    case 'heading6':
      return (
        <div role="heading" aria-level={6} aria-label="Heading level 6">
          <HeadingBlock level={6} {...blockProps} />
        </div>
      );

    case 'bullet_list':
    case 'numbered_list':
      return (
        <div role="list" aria-label={block.type === 'bullet_list' ? 'Bullet list' : 'Numbered list'}>
          <ListBlock type={block.type as 'bullet_list' | 'numbered_list'} {...blockProps} />
        </div>
      );

    case 'todo':
      return (
        <div role="checkbox" aria-label="Todo block">
          <TodoBlock {...blockProps} />
        </div>
      );

    default:
      return (
        <div 
          className="mb-2 p-2 bg-gray-100 rounded text-gray-600 text-sm"
          role="alert"
          aria-label={`Unsupported block type: ${block.type}`}
        >
          Unsupported block type: {block.type}
        </div>
      );
  }
}

