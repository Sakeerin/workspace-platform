import { IsString, IsOptional, IsUUID, IsNotEmpty, IsArray, IsBoolean } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsUUID()
  @IsOptional()
  block_id?: string;

  @IsUUID()
  @IsOptional()
  parent_comment_id?: string;

  @IsArray()
  @IsOptional()
  mentions?: string[];
}

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  mentions?: string[];
}

export class ResolveCommentDto {
  @IsBoolean()
  @IsOptional()
  resolved?: boolean;
}

