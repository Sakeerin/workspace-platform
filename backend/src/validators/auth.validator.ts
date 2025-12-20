import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

export async function validateRegisterDto(data: any): Promise<RegisterDto> {
  const dto = plainToInstance(RegisterDto, data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    throw new Error('Validation failed');
  }

  return dto;
}

export async function validateLoginDto(data: any): Promise<LoginDto> {
  const dto = plainToInstance(LoginDto, data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    throw new Error('Validation failed');
  }

  return dto;
}

