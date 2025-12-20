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
import { PageService } from '../services/page.service';
import { UserRepository } from '../repositories/user.repository';
import { CreatePageDto, UpdatePageDto } from '../dto/page.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('workspaces/:workspaceUuid/pages')
@UseGuards(JwtAuthGuard)
export class PageController {
  constructor(
    private readonly pageService: PageService,
    private readonly userRepo: UserRepository
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPage(
    @Param('workspaceUuid') workspaceUuid: string,
    @Request() req: any,
    @Body() dto: CreatePageDto
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const page = await this.pageService.createPage(workspaceUuid, user.id, dto);
    return {
      success: true,
      data: page,
    };
  }

  @Get()
  async getPages(@Param('workspaceUuid') workspaceUuid: string, @Request() req: any) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const pages = await this.pageService.getPagesByWorkspace(workspaceUuid, user.id);
    return {
      success: true,
      data: pages,
    };
  }

  @Get(':pageUuid')
  async getPage(@Param('pageUuid') pageUuid: string, @Request() req: any) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const page = await this.pageService.getPage(pageUuid, user.id);
    return {
      success: true,
      data: page,
    };
  }

  @Patch(':pageUuid')
  async updatePage(
    @Param('pageUuid') pageUuid: string,
    @Request() req: any,
    @Body() dto: UpdatePageDto
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const page = await this.pageService.updatePage(pageUuid, user.id, dto);
    return {
      success: true,
      data: page,
    };
  }

  @Delete(':pageUuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePage(@Param('pageUuid') pageUuid: string, @Request() req: any) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    await this.pageService.deletePage(pageUuid, user.id);
  }
}

