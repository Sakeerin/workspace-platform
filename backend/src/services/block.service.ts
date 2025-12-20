import { BlockRepository } from '../repositories/block.repository';
import { PageRepository } from '../repositories/page.repository';
import { PermissionService } from './permission.service';
import { CreateBlockDto, UpdateBlockDto } from '../dto/block.dto';
import { WebSocketService } from './websocket.service';
import { YjsSetup } from '../websocket/crdt/yjs-setup';

export class BlockService {
  private websocketService: WebSocketService | null = null;

  constructor(
    private blockRepo: BlockRepository,
    private pageRepo: PageRepository,
    private permissionService: PermissionService
  ) {}

  /**
   * Set WebSocket service for real-time updates
   */
  setWebSocketService(websocketService: WebSocketService) {
    this.websocketService = websocketService;
  }

  async createBlock(pageUuid: string, userId: bigint, dto: CreateBlockDto) {
    // Get page and verify access
    const page = await this.pageRepo.findByUuid(pageUuid);
    if (!page) {
      throw new Error('Page not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    // Get parent block if parent_block_id provided
    let parentBlockId: bigint | undefined;
    let depth = 0;
    if (dto.parent_block_id) {
      const parentBlock = await this.blockRepo.findByUuid(dto.parent_block_id);
      if (!parentBlock) {
        throw new Error('Parent block not found');
      }
      if (parentBlock.pageId !== page.id) {
        throw new Error('Parent block must be in the same page');
      }
      parentBlockId = parentBlock.id;
      depth = parentBlock.depth + 1;
    }

    // Extract content text for search
    const contentText = this.extractContentText(dto.content);

    // Create block
    const block = await this.blockRepo.create({
      pageId: page.id,
      parentBlockId,
      createdById: userId,
      lastEditedById: userId,
      type: dto.type,
      content: dto.content,
      contentText,
      position: dto.position ?? 0,
      depth,
    });

    // Update Yjs document
    const blocksMap = YjsSetup.getBlocksMap(pageUuid);
    blocksMap.set(block.uuid, {
      uuid: block.uuid,
      type: block.type,
      content: block.content,
      properties: block.properties,
      position: block.position,
      depth: block.depth,
      created_by: userId.toString(),
      last_edited_by: userId.toString(),
      created_at: block.createdAt.toISOString(),
      updated_at: block.updatedAt.toISOString(),
    });

    // Broadcast real-time update
    if (this.websocketService) {
      this.websocketService.broadcastBlockCreate(pageUuid, {
        uuid: block.uuid,
        type: block.type,
        content: block.content,
        properties: block.properties,
        position: block.position,
        depth: block.depth,
      });
    }

    return block;
  }

  async getBlocksByPage(pageUuid: string, userId: bigint) {
    const page = await this.pageRepo.findByUuid(pageUuid);
    if (!page) {
      throw new Error('Page not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    return this.blockRepo.findByPageId(page.id);
  }

  async updateBlock(blockUuid: string, pageUuid: string, userId: bigint, dto: UpdateBlockDto) {
    // Verify page access
    const page = await this.pageRepo.findByUuid(pageUuid);
    if (!page) {
      throw new Error('Page not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    // Get block
    const block = await this.blockRepo.findByUuid(blockUuid);
    if (!block) {
      throw new Error('Block not found');
    }

    if (block.pageId !== page.id) {
      throw new Error('Block does not belong to this page');
    }

    // Extract content text if content is updated
    let contentText: string | undefined;
    if (dto.content) {
      contentText = this.extractContentText(dto.content);
    }

    const updatedBlock = await this.blockRepo.updateByUuid(blockUuid, {
      ...dto,
      contentText,
      lastEditedById: userId,
    });

    // Update Yjs document
    const blocksMap = YjsSetup.getBlocksMap(pageUuid);
    const currentBlock = blocksMap.get(blockUuid) || {};
    blocksMap.set(blockUuid, {
      ...currentBlock,
      uuid: updatedBlock.uuid,
      type: updatedBlock.type,
      content: updatedBlock.content,
      properties: updatedBlock.properties,
      position: updatedBlock.position,
      depth: updatedBlock.depth,
      last_edited_by: userId.toString(),
      updated_at: updatedBlock.updatedAt.toISOString(),
    });

    // Broadcast real-time update
    if (this.websocketService) {
      this.websocketService.broadcastBlockUpdate(pageUuid, {
        uuid: updatedBlock.uuid,
        type: updatedBlock.type,
        content: updatedBlock.content,
        properties: updatedBlock.properties,
        position: updatedBlock.position,
        depth: updatedBlock.depth,
      });
    }

    return updatedBlock;
  }

  async deleteBlock(blockUuid: string, pageUuid: string, userId: bigint) {
    // Verify page access
    const page = await this.pageRepo.findByUuid(pageUuid);
    if (!page) {
      throw new Error('Page not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    // Get block
    const block = await this.blockRepo.findByUuid(blockUuid);
    if (!block) {
      throw new Error('Block not found');
    }

    if (block.pageId !== page.id) {
      throw new Error('Block does not belong to this page');
    }

    await this.blockRepo.softDelete(block.id);

    // Remove from Yjs document
    const blocksMap = YjsSetup.getBlocksMap(pageUuid);
    blocksMap.delete(blockUuid);

    // Broadcast real-time update
    if (this.websocketService) {
      this.websocketService.broadcastBlockDelete(pageUuid, blockUuid);
    }

    return { success: true };
  }

  extractContentText(content: Record<string, any>): string {
    // Extract plain text from block content for search indexing
    if (typeof content === 'object' && content !== null) {
      if ('text' in content && typeof content.text === 'string') {
        return content.text;
      }
      // For nested structures, recursively extract text
      return JSON.stringify(content);
    }
    return '';
  }
}

