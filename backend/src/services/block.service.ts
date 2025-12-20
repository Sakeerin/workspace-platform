import { BlockRepository } from '../repositories/block.repository';
import { PageRepository } from '../repositories/page.repository';
import { PermissionService } from './permission.service';
import { CreateBlockDto, UpdateBlockDto } from '../dto/block.dto';

export class BlockService {
  constructor(
    private blockRepo: BlockRepository,
    private pageRepo: PageRepository,
    private permissionService: PermissionService
  ) {}

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

    return this.blockRepo.updateByUuid(blockUuid, {
      ...dto,
      contentText,
      lastEditedById: userId,
    });
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

    return this.blockRepo.softDelete(block.id);
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

