import { Injectable } from '@nestjs/common';
import { PageRepository } from '../repositories/page.repository';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { PermissionService } from './permission.service';
import { CreatePageDto, UpdatePageDto } from '../dto/page.dto';

/**
 * Page Service
 * 
 * Handles page-related business logic:
 * - Creating and updating pages
 * - Managing page hierarchy (parent-child relationships)
 * - Page access control and permissions
 * - Page deletion (soft delete)
 * 
 * @class PageService
 */
@Injectable()
export class PageService {
  constructor(
    private pageRepo: PageRepository,
    private workspaceRepo: WorkspaceRepository,
    private permissionService: PermissionService
  ) {}

  /**
   * Create a new page in a workspace
   * 
   * @param {string} workspaceUuid - UUID of the workspace
   * @param {bigint} userId - ID of the user creating the page
   * @param {CreatePageDto} dto - Page creation data
   * @returns {Promise<any>} Created page
   * @throws {Error} If workspace not found or user lacks permission
   */
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

  /**
   * Get a page by UUID
   * 
   * @param {string} pageUuid - UUID of the page
   * @param {bigint} userId - ID of the user requesting the page
   * @returns {Promise<any>} Page data
   * @throws {Error} If page not found or user lacks permission
   */
  async getPage(pageUuid: string, userId: bigint) {
    const page = await this.pageRepo.findByUuid(pageUuid);
    if (!page) {
      throw new Error('Page not found');
    }

    // Verify workspace access
    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    return page;
  }

  /**
   * Get all pages in a workspace
   * 
   * @param {string} workspaceUuid - UUID of the workspace
   * @param {bigint} userId - ID of the user
   * @returns {Promise<any[]>} Array of pages
   * @throws {Error} If workspace not found or user lacks permission
   */
  async getPagesByWorkspace(workspaceUuid: string, userId: bigint) {
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, workspace.id);

    return this.pageRepo.findByWorkspaceId(workspace.id);
  }

  /**
   * Update a page
   * 
   * @param {string} pageUuid - UUID of the page to update
   * @param {bigint} userId - ID of the user updating the page
   * @param {UpdatePageDto} dto - Page update data
   * @returns {Promise<any>} Updated page
   * @throws {Error} If page not found or user lacks permission
   */
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

  /**
   * Delete a page (soft delete)
   * 
   * @param {string} pageUuid - UUID of the page to delete
   * @param {bigint} userId - ID of the user deleting the page
   * @returns {Promise<any>} Deleted page
   * @throws {Error} If page not found or user lacks permission
   */
  async deletePage(pageUuid: string, userId: bigint) {
    const page = await this.pageRepo.findByUuid(pageUuid);
    if (!page) {
      throw new Error('Page not found');
    }

    await this.permissionService.requireWorkspaceAccess(userId, page.workspaceId);

    return this.pageRepo.softDelete(page.id);
  }
}

