import { Injectable } from '@nestjs/common';
import { CreateBlockDto, UpdateBlockDto } from '../dto/block.dto';

@Injectable()
export class BlockValidator {
  private readonly VALID_BLOCK_TYPES = [
    'paragraph',
    'heading1',
    'heading2',
    'heading3',
    'heading4',
    'heading5',
    'heading6',
    'bullet_list',
    'numbered_list',
    'todo',
    'toggle',
    'quote',
    'callout',
    'code',
    'divider',
    'image',
    'video',
    'embed',
    'file',
    'table',
    'database_view',
  ];

  validateCreate(dto: CreateBlockDto): void {
    if (!dto.type || !this.VALID_BLOCK_TYPES.includes(dto.type)) {
      throw new Error(`Invalid block type. Must be one of: ${this.VALID_BLOCK_TYPES.join(', ')}`);
    }

    if (!dto.content || typeof dto.content !== 'object') {
      throw new Error('Block content is required and must be an object');
    }

    if (dto.position !== undefined && dto.position < 0) {
      throw new Error('Block position must be 0 or greater');
    }
  }

  validateUpdate(dto: UpdateBlockDto): void {
    if (dto.content !== undefined && typeof dto.content !== 'object') {
      throw new Error('Block content must be an object');
    }

    if (dto.properties !== undefined && typeof dto.properties !== 'object') {
      throw new Error('Block properties must be an object');
    }

    if (dto.position !== undefined && dto.position < 0) {
      throw new Error('Block position must be 0 or greater');
    }
  }
}

