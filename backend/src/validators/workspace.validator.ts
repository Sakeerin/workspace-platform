import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
} from '../dto/workspace.dto';

export async function validateCreateWorkspaceDto(
  data: any
): Promise<CreateWorkspaceDto> {
  const dto = plainToInstance(CreateWorkspaceDto, data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    throw new Error('Validation failed');
  }

  return dto;
}

export async function validateUpdateWorkspaceDto(
  data: any
): Promise<UpdateWorkspaceDto> {
  const dto = plainToInstance(UpdateWorkspaceDto, data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    throw new Error('Validation failed');
  }

  return dto;
}

export async function validateInviteMemberDto(
  data: any
): Promise<InviteMemberDto> {
  const dto = plainToInstance(InviteMemberDto, data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    throw new Error('Validation failed');
  }

  return dto;
}

