import { useCallback } from 'react';
import { useEditorStore } from '../store/editor';

export function useEditor(pageUuid: string) {
  const { blocks, isLoading, error, fetchBlocks, createBlock, updateBlock, deleteBlock } = useEditorStore();

  const loadBlocks = useCallback(async () => {
    await fetchBlocks(pageUuid);
  }, [pageUuid, fetchBlocks]);

  const addBlock = useCallback(
    async (type: string, content: Record<string, any> = {}, position?: number, parentBlockId?: string) => {
      return await createBlock(pageUuid, type, content, parentBlockId, position);
    },
    [pageUuid, createBlock]
  );

  const editBlock = useCallback(
    async (blockUuid: string, content?: Record<string, any>, properties?: Record<string, any>) => {
      return await updateBlock(pageUuid, blockUuid, content, properties);
    },
    [pageUuid, updateBlock]
  );

  const removeBlock = useCallback(
    async (blockUuid: string) => {
      await deleteBlock(pageUuid, blockUuid);
    },
    [pageUuid, deleteBlock]
  );

  return {
    blocks,
    isLoading,
    error,
    loadBlocks,
    addBlock,
    editBlock,
    removeBlock,
  };
}

