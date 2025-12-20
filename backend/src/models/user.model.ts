import { User } from '@prisma/client';

export type UserModel = User;

export interface UserCreateInput {
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string;
  timezone?: string;
  locale?: string;
}

export interface UserUpdateInput {
  name?: string;
  avatarUrl?: string;
  timezone?: string;
  locale?: string;
  preferences?: Record<string, any>;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  isActive?: boolean;
}

