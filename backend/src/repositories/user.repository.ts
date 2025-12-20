import { PrismaClient, User } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { UserCreateInput, UserUpdateInput } from '../models/user.model';
import prisma from '../config/database';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(prisma);
  }

  getModel() {
    return this.prisma.user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.getModel().findUnique({
      where: { email },
    });
  }

  async findByUuid(uuid: string): Promise<User | null> {
    return this.getModel().findUnique({
      where: { uuid },
    });
  }

  async create(data: UserCreateInput): Promise<User> {
    return this.getModel().create({
      data: {
        ...data,
        preferences: data.preferences || {},
      },
    });
  }

  async update(id: bigint, data: UserUpdateInput): Promise<User> {
    return this.getModel().update({
      where: { id },
      data,
    });
  }

  async updateByUuid(uuid: string, data: UserUpdateInput): Promise<User> {
    return this.getModel().update({
      where: { uuid },
      data,
    });
  }
}

