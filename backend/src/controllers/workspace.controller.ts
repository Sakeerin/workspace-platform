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
import { WorkspaceService } from '../services/workspace.service';
import { UserRepository } from '../repositories/user.repository';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
} from '../dto/workspace.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly userRepo: UserRepository
  ) {}

  @Get()
  async getWorkspaces(@Request() req: any) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }
    const workspaces = await this.workspaceService.getWorkspaces(user.id);
    return {
      success: true,
      data: workspaces,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWorkspace(@Request() req: any, @Body() dto: CreateWorkspaceDto) {
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }
    const workspace = await this.workspaceService.createWorkspace(user.id, dto);
    return {
      success: true,
      data: workspace,
    };
  }

  @Get(':uuid')
  async getWorkspace(@Param('uuid') uuid: string, @Request() req: any) {
    const workspace = await this.workspaceService.getWorkspaceByUuid(
      uuid,
      req.user.userId
    );
    return {
      success: true,
      data: workspace,
    };
  }

  @Patch(':uuid')
  async updateWorkspace(
    @Param('uuid') uuid: string,
    @Request() req: any,
    @Body() dto: UpdateWorkspaceDto
  ) {
    const workspace = await this.workspaceService.getWorkspaceByUuid(
      uuid,
      req.user.userId
    );
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }
    const updated = await this.workspaceService.updateWorkspace(
      workspace.id,
      user.id,
      dto
    );
    return {
      success: true,
      data: updated,
    };
  }

  @Get(':uuid/members')
  async getWorkspaceMembers(@Param('uuid') uuid: string, @Request() req: any) {
    const workspace = await this.workspaceService.getWorkspaceByUuid(
      uuid,
      req.user.userId
    );
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }
    const members = await this.workspaceService.getWorkspaceMembers(
      workspace.id,
      user.id
    );
    return {
      success: true,
      data: members,
    };
  }

  @Post(':uuid/members')
  async inviteMember(
    @Param('uuid') uuid: string,
    @Request() req: any,
    @Body() dto: InviteMemberDto
  ) {
    const workspace = await this.workspaceService.getWorkspaceByUuid(
      uuid,
      req.user.userId
    );
    const userUuid = req.user.userId;
    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new Error('User not found');
    }
    const member = await this.workspaceService.inviteMember(
      workspace.id,
      user.id,
      dto
    );
    return {
      success: true,
      data: member,
    };
  }
}

