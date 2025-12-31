import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import BlockRenderer from './BlockRenderer';

interface Block {
  uuid: string;
  type: string;
  content: Record<string, any>;
  properties?: Record<string, any>;
  position: number;
  depth: number;
}

interface BlockListProps {
  blocks: Block[];
  onBlockUpdate?: (blockUuid: string, content: Record<string, any>, properties?: Record<string, any>) => void;
  isEditable?: boolean;
}

/**
 * Virtualized Block List Component
 * 
 * Renders a list of blocks with virtual scrolling for optimal performance
 * when dealing with large numbers of blocks. 
 * 
 * **Note**: Requires @tanstack/react-virtual package. Install with:
 * ```bash
 * npm install @tanstack/react-virtual
 * ```
 * 
 * For lists with < 50 blocks, renders without virtualization for simplicity.
 * For larger lists, uses virtual scrolling to maintain performance.
 * 
 * @param {BlockListProps} props - Component props
 * @param {Block[]} props.blocks - Array of blocks to render
 * @param {Function} props.onBlockUpdate - Callback when a block is updated
 * @param {boolean} props.isEditable - Whether blocks are editable
 * 
 * @example
 * <BlockList
 *   blocks={pageBlocks}
 *   onBlockUpdate={handleBlockUpdate}
 *   isEditable={true}
 * />
 */
export default function BlockList({
  blocks,
  onBlockUpdate,
  isEditable = true,
}: BlockListProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Sort blocks by position
  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => a.position - b.position);
  }, [blocks]);

  // Virtual scrolling configuration
  const virtualizer = useVirtualizer({
    count: sortedBlocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated height per block
    overscan: 5, // Render 5 extra items outside viewport
  });

  // For small lists, render without virtualization
  if (sortedBlocks.length < 50) {
    return (
      <div className="block-list" role="list" aria-label="Page blocks">
        {sortedBlocks.map((block) => (
          <div key={block.uuid} role="listitem">
            <BlockRenderer
              block={block}
              onUpdate={onBlockUpdate}
              isEditable={isEditable}
            />
          </div>
        ))}
      </div>
    );
  }

  // Virtual scrolling for large lists
  return (
    <div
      ref={parentRef}
      className="block-list h-full overflow-auto"
      role="list"
      aria-label="Page blocks"
      aria-setsize={sortedBlocks.length}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const block = sortedBlocks[virtualItem.index];
          return (
            <div
              key={block.uuid}
              role="listitem"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <BlockRenderer
                block={block}
                onUpdate={onBlockUpdate}
                isEditable={isEditable}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

