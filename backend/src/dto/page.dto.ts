import { IsString, IsOptional, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';

export class CreatePageDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsUUID()
  @IsOptional()
  parent_id?: string;

  @IsEnum(['page', 'database'])
  @IsOptional()
  type?: 'page' | 'database';

  @IsString()
  @IsOptional()
  icon?: string;

  @IsEnum(['private', 'workspace', 'public'])
  @IsOptional()
  visibility?: 'private' | 'workspace' | 'public';
}

export class UpdatePageDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  cover_image?: string;

  @IsEnum(['private', 'workspace', 'public'])
  @IsOptional()
  visibility?: 'private' | 'workspace' | 'public';
}

