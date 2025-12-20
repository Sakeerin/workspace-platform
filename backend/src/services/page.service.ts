import { PageRepository } from '../repositories/page.repository';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { PermissionService } from './permission.service';
import { CreatePageDto, UpdatePageDto } from '../dto/page.dto';

export class PageService {
  constructor(
    private pageRepo: PageRepository,
    private workspaceRepo: WorkspaceRepository,
    private permissionService: PermissionService
  ) {}

  async createPage(workspaceUuid: string, userId: bigint, dto: CreatePageDto) {
    // Get workspace and verify access
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, workspace.id);

    // Get parent page if parent_id provided
    let parentId: bigint | undefined;
    if (dto.parent_id) {
      const parentPage = await this.pageRepo.findByUuid(dto.parent_id);
      if (!parentPage) {
        throw new Error('Parent page not found');
      }
      if (parentPage.workspaceId !== workspace.id) {
        throw new Error('Parent page must be in the same workspace');
      }
      parentId = parentPage.id;
    }

    // Create page
    const page = await this.pageRepo.create({
      workspaceId: workspace.id,
      parentId,
      createdById: userId,
      lastEditedById: userId,
      title: dto.title,
      icon: dto.icon,
      type: dto.type || 'page',
      visibility: dto.visibility || 'workspace',
    });

    return page;
  }

  async getPage(pageUuid: string, userId: bigint) {
    const page = await this.pageRepo.findByUuid(pageUuid);
    if (!page) {
      throw new Error('Page not found');
    }

    // Verify workspace access
    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    return page;
  }

  async getPagesByWorkspace(workspaceUuid: string, userId: bigint) {
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, workspace.id);

    return this.pageRepo.findByWorkspaceId(workspace.id);
  }

  async updatePage(pageUuid: string, userId: bigint, dto: UpdatePageDto) {
    const page = await this.pageRepo.findByUuid(pageUuid);
    if (!page) {
      throw new Error('Page not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    return this.pageRepo.updateByUuid(pageUuid, {
      ...dto,
      coverImage: dto.cover_image,
      lastEditedById: userId,
    });
  }

  async deletePage(pageUuid: string, userId: bigint) {
    const page = await this.pageRepo.findByUuid(pageUuid);
    if (!page) {
      throw new Error('Page not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    return this.pageRepo.softDelete(page.id);
  }
}

