import { Injectable } from '@nestjs/common';
import { CreatePageDto, UpdatePageDto } from '../dto/page.dto';

@Injectable()
export class PageValidator {
  validateCreate(dto: CreatePageDto): void {
    if (!dto.title || dto.title.trim().length === 0) {
      throw new Error('Page title is required');
    }

    if (dto.title.length > 500) {
      throw new Error('Page title must be 500 characters or less');
    }

    if (dto.type && !['page', 'database'].includes(dto.type)) {
      throw new Error('Invalid page type');
    }

    if (dto.visibility && !['private', 'workspace', 'public'].includes(dto.visibility)) {
      throw new Error('Invalid visibility value');
    }
  }

  validateUpdate(dto: UpdatePageDto): void {
    if (dto.title !== undefined) {
      if (!dto.title || dto.title.trim().length === 0) {
        throw new Error('Page title cannot be empty');
      }

      if (dto.title.length > 500) {
        throw new Error('Page title must be 500 characters or less');
      }
    }

    if (dto.visibility && !['private', 'workspace', 'public'].includes(dto.visibility)) {
      throw new Error('Invalid visibility value');
    }
  }
}

