import { Injectable } from '@nestjs/common';
import { CreateDatabaseDto, UpdateDatabaseDto, CreateDatabaseRowDto, UpdateDatabaseRowDto } from '../dto/database.dto';

@Injectable()
export class DatabaseValidator {
  validateCreateDatabase(dto: CreateDatabaseDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dto.page_id) {
      errors.push('page_id is required');
    }

    if (dto.properties && typeof dto.properties !== 'object') {
      errors.push('properties must be an object');
    }

    if (dto.views && !Array.isArray(dto.views)) {
      errors.push('views must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateUpdateDatabase(dto: UpdateDatabaseDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.properties && typeof dto.properties !== 'object') {
      errors.push('properties must be an object');
    }

    if (dto.views && !Array.isArray(dto.views)) {
      errors.push('views must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateCreateDatabaseRow(dto: CreateDatabaseRowDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dto.properties || typeof dto.properties !== 'object') {
      errors.push('properties is required and must be an object');
    }

    if (dto.position !== undefined && typeof dto.position !== 'number') {
      errors.push('position must be a number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateUpdateDatabaseRow(dto: UpdateDatabaseRowDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (dto.properties && typeof dto.properties !== 'object') {
      errors.push('properties must be an object');
    }

    if (dto.position !== undefined && typeof dto.position !== 'number') {
      errors.push('position must be a number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

