import { PrismaClient, Block } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { BlockCreateInput, BlockUpdateInput } from '../models/block.model';
import prisma from '../config/database';

export class BlockRepository extends BaseRepository<Block> {
  constructor() {
    super(prisma);
  }

  getModel() {
    return this.prisma.block;
  }

  async findByUuid(uuid: string): Promise<Block | null> {
    return this.getModel().findUnique({
      where: { uuid },
    });
  }

  async findByPageId(pageId: bigint): Promise<Block[]> {
    return this.getModel().findMany({
      where: {
        pageId,
        deletedAt: null,
        parentBlockId: null,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async findByParentBlockId(parentBlockId: bigint): Promise<Block[]> {
    return this.getModel().findMany({
      where: {
        parentBlockId,
        deletedAt: null,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async create(data: BlockCreateInput): Promise<Block> {
    return this.getModel().create({
      data: {
        ...data,
        content: data.content || {},
        properties: data.properties || {},
        position: data.position ?? 0,
        depth: data.depth ?? 0,
      },
    });
  }

  async update(id: bigint, data: BlockUpdateInput): Promise<Block> {
    return this.getModel().update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateByUuid(uuid: string, data: BlockUpdateInput): Promise<Block> {
    return this.getModel().update({
      where: { uuid },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async softDelete(id: bigint): Promise<Block> {
    return this.getModel().update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async extractContentText(block: Block): string {
    // Extract plain text from block content for search indexing
    if (typeof block.content === 'object' && block.content !== null) {
      if ('text' in block.content) {
        return String(block.content.text);
      }
      // Recursively extract text from nested structures
      return JSON.stringify(block.content);
    }
    return '';
  }
}

