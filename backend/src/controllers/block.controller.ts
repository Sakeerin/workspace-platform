import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BlockService } from '../services/block.service';
import { UserRepository } from '../repositories/user.repository';
import { CreateBlockDto, UpdateBlockDto } from '../dto/block.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('pages/:pageUuid/blocks')
@UseGuards(JwtAuthGuard)
export class BlockController {
  constructor(
    private readonly blockService: BlockService,
    private readonly userRepo: UserRepository
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBlock(
    @Param('pageUuid') pageUuid: string,
    @Request() req: any,
    @Body() dto: CreateBlockDto
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const block = await this.blockService.createBlock(pageUuid, user.id, dto);
    return {
      success: true,
      data: block,
    };
  }

  @Get()
  async getBlocks(@Param('pageUuid') pageUuid: string, @Request() req: any) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const blocks = await this.blockService.getBlocksByPage(pageUuid, user.id);
    return {
      success: true,
      data: blocks,
    };
  }

  @Patch(':blockUuid')
  async updateBlock(
    @Param('pageUuid') pageUuid: string,
    @Param('blockUuid') blockUuid: string,
    @Request() req: any,
    @Body() dto: UpdateBlockDto
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const block = await this.blockService.updateBlock(blockUuid, pageUuid, user.id, dto);
    return {
      success: true,
      data: block,
    };
  }

  @Delete(':blockUuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlock(
    @Param('pageUuid') pageUuid: string,
    @Param('blockUuid') blockUuid: string,
    @Request() req: any
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    await this.blockService.deleteBlock(blockUuid, pageUuid, user.id);
  }
}

