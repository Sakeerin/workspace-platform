import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DatabaseService } from '../services/database.service';
import { UserRepository } from '../repositories/user.repository';
import { PageRepository } from '../repositories/page.repository';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { CreateDatabaseDto, UpdateDatabaseDto, CreateDatabaseRowDto, UpdateDatabaseRowDto } from '../dto/database.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('databases')
@UseGuards(JwtAuthGuard)
export class DatabaseController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userRepo: UserRepository,
    private readonly pageRepo: PageRepository,
    private readonly workspaceRepo: WorkspaceRepository
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDatabase(
    @Request() req: any,
    @Body() dto: CreateDatabaseDto
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    // Get workspace from page
    const page = await this.pageRepo.findByUuid(dto.page_id);
    if (!page) {
      throw new Error('Page not found');
    }

    const workspace = await this.workspaceRepo.findById(page.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const database = await this.databaseService.createDatabase(workspace.uuid, user.id, dto);
    return {
      success: true,
      data: database,
    };
  }

  @Get(':databaseUuid')
  async getDatabase(@Param('databaseUuid') databaseUuid: string, @Request() req: any) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const database = await this.databaseService.getDatabase(databaseUuid, user.id);
    return {
      success: true,
      data: database,
    };
  }

  @Put(':databaseUuid')
  async updateDatabase(
    @Param('databaseUuid') databaseUuid: string,
    @Request() req: any,
    @Body() dto: UpdateDatabaseDto
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const database = await this.databaseService.updateDatabase(databaseUuid, user.id, dto);
    return {
      success: true,
      data: database,
    };
  }

  @Delete(':databaseUuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDatabase(@Param('databaseUuid') databaseUuid: string, @Request() req: any) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    await this.databaseService.deleteDatabase(databaseUuid, user.id);
  }

  @Post(':databaseUuid/rows')
  @HttpCode(HttpStatus.CREATED)
  async createRow(
    @Param('databaseUuid') databaseUuid: string,
    @Request() req: any,
    @Body() dto: CreateDatabaseRowDto
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const row = await this.databaseService.createRow(databaseUuid, user.id, dto);
    return {
      success: true,
      data: row,
    };
  }

  @Get(':databaseUuid/rows')
  async getRows(@Param('databaseUuid') databaseUuid: string, @Request() req: any) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const rows = await this.databaseService.getRows(databaseUuid, user.id);
    return {
      success: true,
      data: rows,
    };
  }

  @Get(':databaseUuid/rows/:rowUuid')
  async getRow(
    @Param('databaseUuid') databaseUuid: string,
    @Param('rowUuid') rowUuid: string,
    @Request() req: any
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const row = await this.databaseService.getRow(databaseUuid, rowUuid, user.id);
    return {
      success: true,
      data: row,
    };
  }

  @Put(':databaseUuid/rows/:rowUuid')
  async updateRow(
    @Param('databaseUuid') databaseUuid: string,
    @Param('rowUuid') rowUuid: string,
    @Request() req: any,
    @Body() dto: UpdateDatabaseRowDto
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const row = await this.databaseService.updateRow(databaseUuid, rowUuid, user.id, dto);
    return {
      success: true,
      data: row,
    };
  }

  @Delete(':databaseUuid/rows/:rowUuid')
  @HttpCode(HttpStatus.OK)
  async deleteRow(
    @Param('databaseUuid') databaseUuid: string,
    @Param('rowUuid') rowUuid: string,
    @Request() req: any
  ) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    await this.databaseService.deleteRow(databaseUuid, rowUuid, user.id);
    return {
      success: true,
    };
  }
}

