import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { UserRepository } from '../repositories/user.repository';
import { PermissionService } from './permission.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto, InviteMemberDto } from '../dto/workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    private workspaceRepo: WorkspaceRepository,
    private workspaceMemberRepo: WorkspaceMemberRepository,
    private userRepo: UserRepository,
    private permissionService: PermissionService
  ) {}

  async createWorkspace(userId: bigint, dto: CreateWorkspaceDto) {
    // Generate slug if not provided
    let slug = dto.slug || this.generateSlug(dto.name);

    // Ensure slug is unique by appending a number if needed
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.workspaceRepo.findBySlug(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
      // Prevent infinite loop (max 1000 attempts)
      if (counter > 1000) {
        // Fallback to UUID-based slug
        uniqueSlug = `${slug}-${Date.now()}`;
        break;
      }
    }
    slug = uniqueSlug;

    // Create workspace
    const workspace = await this.workspaceRepo.create({
      name: dto.name,
      slug,
      icon: dto.icon,
    });

    // Add creator as owner
    await this.workspaceMemberRepo.create({
      workspaceId: workspace.id,
      userId,
      role: 'owner',
    });

    return workspace;
  }

  async getWorkspaces(userId: bigint) {
    return this.workspaceRepo.findByUserId(userId);
  }

  async getWorkspace(workspaceId: bigint, userId: bigint) {
    // Check access
    await this.permissionService.requireWorkspaceAccess(userId, workspaceId);

    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async getWorkspaceByUuid(uuid: string, userUuid: string) {
    const workspace = await this.workspaceRepo.findByUuid(uuid);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const user = await this.userRepo.findByUuid(userUuid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.permissionService.requireWorkspaceAccess(user.id, workspace.id);

    return workspace;
  }

  async updateWorkspace(
    workspaceId: bigint,
    userId: bigint,
    dto: UpdateWorkspaceDto
  ) {
    // Check management access
    await this.permissionService.requireWorkspaceManagement(userId, workspaceId);

    return this.workspaceRepo.update(workspaceId, dto);
  }

  async getWorkspaceMembers(workspaceId: bigint, userId: bigint) {
    // Check access
    await this.permissionService.requireWorkspaceAccess(userId, workspaceId);

    return this.workspaceMemberRepo.findByWorkspaceId(workspaceId);
  }

  async inviteMember(
    workspaceId: bigint,
    inviterId: bigint,
    dto: InviteMemberDto
  ) {
    // Check management access
    await this.permissionService.requireWorkspaceManagement(inviterId, workspaceId);

    // Find user by email
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already member
    const existing = await this.workspaceMemberRepo.findByWorkspaceAndUser(
      workspaceId,
      user.id
    );
    if (existing) {
      throw new ConflictException('User is already a member of this workspace');
    }

    // Create membership
    return this.workspaceMemberRepo.create({
      workspaceId,
      userId: user.id,
      role: dto.role || 'member',
      invitedBy: inviterId,
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50);
  }
}

