import { IsString, IsOptional, IsUUID, IsNotEmpty, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDatabaseDto {
  @IsUUID()
  @IsNotEmpty()
  page_id!: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @IsArray()
  @IsOptional()
  views?: any[];

  @IsString()
  @IsOptional()
  default_view_id?: string;
}

export class UpdateDatabaseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @IsArray()
  @IsOptional()
  views?: any[];

  @IsString()
  @IsOptional()
  default_view_id?: string;
}

export class CreateDatabaseRowDto {
  @IsObject()
  @IsNotEmpty()
  properties!: Record<string, any>;

  @IsUUID()
  @IsOptional()
  page_id?: string;

  @IsString()
  @IsOptional()
  properties_text?: string;

  @IsOptional()
  position?: number;
}

export class UpdateDatabaseRowDto {
  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @IsString()
  @IsOptional()
  properties_text?: string;

  @IsOptional()
  position?: number;
}

