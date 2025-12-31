import React, { useState, useCallback } from 'react';
import BlockRenderer from './BlockRenderer';
import SlashMenu from './SlashMenu';

interface Block {
  uuid: string;
  type: string;
  content: Record<string, any>;
  properties?: Record<string, any>;
  position: number;
  depth: number;
}

interface BlockEditorProps {
  blocks: Block[];
  onBlockCreate?: (type: string, position: number) => Promise<void>;
  onBlockUpdate?: (blockUuid: string, content: Record<string, any>, properties?: Record<string, any>) => Promise<void>;
  onBlockDelete?: (blockUuid: string) => Promise<void>;
}

interface SlashMenuState {
  show: boolean;
  position: { x: number; y: number };
  insertPosition: number;
}

export default function BlockEditor({
  blocks,
  onBlockCreate,
  onBlockUpdate,
  onBlockDelete,
}: BlockEditorProps) {
  const [slashMenu, setSlashMenu] = useState<SlashMenuState>({
    show: false,
    position: { x: 0, y: 0 },
    insertPosition: 0,
  });

  const handleSlashCommand = useCallback(
    (e: React.KeyboardEvent, blockIndex: number) => {
      if (e.key === '/' && !slashMenu.show) {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        setSlashMenu({
          show: true,
          position: { x: rect.left, y: rect.bottom + 5 },
          insertPosition: blockIndex + 1,
        });
      }
    },
    [slashMenu.show]
  );

  const handleSlashMenuSelect = useCallback(
    async (item: { type: string; label: string; icon?: string }) => {
      if (onBlockCreate) {
        await onBlockCreate(item.type, slashMenu.insertPosition);
      }
      setSlashMenu({ show: false, position: { x: 0, y: 0 }, insertPosition: 0 });
    },
    [onBlockCreate, slashMenu.insertPosition]
  );

  const handleBlockUpdate = useCallback(
    async (blockUuid: string, content: Record<string, any>, properties?: Record<string, any>) => {
      if (onBlockUpdate) {
        await onBlockUpdate(blockUuid, content, properties);
      }
    },
    [onBlockUpdate]
  );

  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, blockIndex: number) => {
      // Arrow Up: Focus previous block
      if (e.key === 'ArrowUp' && e.ctrlKey) {
        e.preventDefault();
        if (blockIndex > 0) {
          const prevBlock = sortedBlocks[blockIndex - 1];
          const element = document.querySelector(`[data-block-uuid="${prevBlock.uuid}"]`);
          (element as HTMLElement)?.focus();
        }
        return;
      }

      // Arrow Down: Focus next block
      if (e.key === 'ArrowDown' && e.ctrlKey) {
        e.preventDefault();
        if (blockIndex < sortedBlocks.length - 1) {
          const nextBlock = sortedBlocks[blockIndex + 1];
          const element = document.querySelector(`[data-block-uuid="${nextBlock.uuid}"]`);
          (element as HTMLElement)?.focus();
        }
        return;
      }

      // Enter: Create new block below
      if (e.key === 'Enter' && e.shiftKey === false) {
        e.preventDefault();
        if (onBlockCreate) {
          onBlockCreate('paragraph', blockIndex + 1);
        }
        return;
      }

      // Backspace at start: Delete block or merge with previous
      if (e.key === 'Backspace' && blockIndex > 0) {
        const target = e.target as HTMLElement;
        const selection = window.getSelection();
        if (selection?.isCollapsed && selection.anchorOffset === 0) {
          e.preventDefault();
          if (onBlockDelete) {
            onBlockDelete(block.uuid);
          }
        }
      }

      // Slash command
      handleSlashCommand(e, blockIndex);
    },
    [sortedBlocks, onBlockCreate, onBlockDelete, handleSlashCommand]
  );

  return (
    <div 
      className="relative"
      role="textbox"
      aria-label="Page editor"
      aria-multiline="true"
      tabIndex={0}
    >
      {sortedBlocks.length === 0 ? (
        <div
          className="text-gray-400 cursor-text mb-4"
          onKeyDown={(e) => handleSlashCommand(e, -1)}
          onClick={() => {
            if (onBlockCreate) {
              onBlockCreate('paragraph', 0);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Empty page. Type '/' for commands or start typing"
        >
          Type '/' for commands or start typing...
        </div>
      ) : (
        sortedBlocks.map((block, index) => (
          <div
            key={block.uuid}
            className="block-wrapper"
            data-block-uuid={block.uuid}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="textbox"
            aria-label={`Block ${index + 1} of ${sortedBlocks.length}`}
            tabIndex={0}
          >
            <BlockRenderer
              block={block}
              onUpdate={handleBlockUpdate}
              isEditable={true}
            />
          </div>
        ))
      )}

      {slashMenu.show && (
        <SlashMenu
          position={slashMenu.position}
          onSelect={handleSlashMenuSelect}
          onClose={() => setSlashMenu({ show: false, position: { x: 0, y: 0 }, insertPosition: 0 })}
        />
      )}
    </div>
  );
}

