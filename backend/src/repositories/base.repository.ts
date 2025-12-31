import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}

  abstract getModel(): any;

  async findById(id: bigint | number): Promise<T | null> {
    return this.getModel().findUnique({
      where: { id },
    });
  }

  async findByUuid(uuid: string): Promise<T | null> {
    return this.getModel().findUnique({
      where: { uuid },
    });
  }

  async findAll(): Promise<T[]> {
    return this.getModel().findMany();
  }

  async create(data: Partial<T>): Promise<T> {
    return this.getModel().create({
      data,
    });
  }

  async update(id: bigint | number, data: Partial<T>): Promise<T> {
    return this.getModel().update({
      where: { id },
      data,
    });
  }

  async delete(id: bigint | number): Promise<T> {
    return this.getModel().delete({
      where: { id },
    });
  }

  async softDelete(id: bigint | number): Promise<T> {
    return this.getModel().update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

