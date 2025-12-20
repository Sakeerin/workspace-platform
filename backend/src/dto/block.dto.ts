import { IsString, IsObject, IsOptional, IsInt, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateBlockDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsObject()
  @IsNotEmpty()
  content!: Record<string, any>;

  @IsUUID()
  @IsOptional()
  parent_block_id?: string;

  @IsInt()
  @IsOptional()
  position?: number;
}

export class UpdateBlockDto {
  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;
}

