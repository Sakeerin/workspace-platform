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

  return (
    <div className="relative">
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
        >
          Type '/' for commands or start typing...
        </div>
      ) : (
        sortedBlocks.map((block, index) => (
          <div
            key={block.uuid}
            className="block-wrapper"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey === false) {
                e.preventDefault();
                if (onBlockCreate) {
                  onBlockCreate('paragraph', block.position + 1);
                }
              } else {
                handleSlashCommand(e, index);
              }
            }}
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

