import { IsOptional, IsUUID, IsDateString } from 'class-validator';

export class BaseDto {
  @IsOptional()
  @IsUUID()
  uuid?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}

export class PaginationDto {
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}

export class ResponseDto<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp?: string;
  requestId?: string;
}

