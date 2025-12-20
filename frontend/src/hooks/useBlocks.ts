import { useCallback, useMemo } from 'react';
import { useEditorStore } from '../store/editor';

interface Block {
  uuid: string;
  type: string;
  content: Record<string, any>;
  properties?: Record<string, any>;
  position: number;
  depth: number;
  parent_block_id?: string;
}

export function useBlocks(pageUuid: string) {
  const { blocks, createBlock, updateBlock, deleteBlock } = useEditorStore();

  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => a.position - b.position);
  }, [blocks]);

  const getBlocksByType = useCallback(
    (type: string): Block[] => {
      return sortedBlocks.filter((block) => block.type === type);
    },
    [sortedBlocks]
  );

  const getChildBlocks = useCallback(
    (parentBlockUuid: string): Block[] => {
      return sortedBlocks.filter((block) => block.parent_block_id === parentBlockUuid);
    },
    [sortedBlocks]
  );

  const getTopLevelBlocks = useCallback((): Block[] => {
    return sortedBlocks.filter((block) => !block.parent_block_id);
  }, [sortedBlocks]);

  const createBlockWithPosition = useCallback(
    async (type: string, content: Record<string, any> = {}, position?: number) => {
      // If position not provided, append to end
      const finalPosition = position ?? sortedBlocks.length;
      return await createBlock(pageUuid, type, content, undefined, finalPosition);
    },
    [pageUuid, createBlock, sortedBlocks.length]
  );

  const updateBlockContent = useCallback(
    async (blockUuid: string, content: Record<string, any>) => {
      return await updateBlock(pageUuid, blockUuid, content);
    },
    [pageUuid, updateBlock]
  );

  const removeBlockById = useCallback(
    async (blockUuid: string) => {
      await deleteBlock(pageUuid, blockUuid);
    },
    [pageUuid, deleteBlock]
  );

  return {
    blocks: sortedBlocks,
    getBlocksByType,
    getChildBlocks,
    getTopLevelBlocks,
    createBlock: createBlockWithPosition,
    updateBlock: updateBlockContent,
    deleteBlock: removeBlockById,
  };
}

