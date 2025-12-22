import { Injectable } from '@nestjs/common';
import { CreateCommentDto, UpdateCommentDto } from '../dto/comment.dto';

@Injectable()
export class CommentValidator {
  validateCreateComment(dto: CreateCommentDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dto.content || dto.content.trim().length === 0) {
      errors.push('content is required and cannot be empty');
    }

    if (dto.content && dto.content.length > 10000) {
      errors.push('content must be less than 10000 characters');
    }

    if (dto.mentions && !Array.isArray(dto.mentions)) {
      errors.push('mentions must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateUpdateComment(dto: UpdateCommentDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.content !== undefined) {
      if (dto.content.trim().length === 0) {
        errors.push('content cannot be empty');
      }
      if (dto.content.length > 10000) {
        errors.push('content must be less than 10000 characters');
      }
    }

    if (dto.mentions && !Array.isArray(dto.mentions)) {
      errors.push('mentions must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

