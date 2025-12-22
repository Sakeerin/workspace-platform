import { PageRepository } from '../repositories/page.repository';
import { BlockRepository } from '../repositories/block.repository';
import { PermissionService } from './permission.service';
import { getMeilisearchClient } from '../config/search';

export interface SearchResult {
  uuid: string;
  title: string;
  type: 'page' | 'block' | 'database';
  content?: string;
  page_id?: string;
  block_id?: string;
  workspace_id: string;
  updated_at: string;
  created_at: string;
}

export interface SearchOptions {
  type?: 'page' | 'block' | 'database';
  limit?: number;
  offset?: number;
}

export class SearchService {
  constructor(
    private pageRepo: PageRepository,
    private blockRepo: BlockRepository,
    private permissionService: PermissionService
  ) {}

  async search(workspaceUuid: string, userId: bigint, query: string, options: SearchOptions = {}) {
    // Verify workspace access
    const workspace = await this.pageRepo.findByWorkspaceId(
      (await this.pageRepo.findByUuid(workspaceUuid))?.workspaceId || BigInt(0)
    );
    
    if (!workspace || workspace.length === 0) {
      throw new Error('Workspace not found');
    }

    const workspaceId = workspace[0].workspaceId;
    await this.permissionService.requireWorkspaceAccess(userId, workspaceId);

    const client = getMeilisearchClient();
    const index = client.index('workspace');

    // Build search query
    const searchParams: any = {
      limit: options.limit || 20,
      offset: options.offset || 0,
      attributesToRetrieve: ['uuid', 'title', 'type', 'content_text', 'page_id', 'block_id', 'workspace_id', 'updated_at', 'created_at'],
    };

    // Add filters
    const filters: string[] = [`workspace_id = ${workspaceId}`];
    if (options.type) {
      filters.push(`type = ${options.type}`);
    }
    searchParams.filter = filters.join(' AND ');

    try {
      const results = await index.search(query, searchParams);

      // Transform results to match SearchResult interface
      const searchResults: SearchResult[] = results.hits.map((hit: any) => ({
        uuid: hit.uuid,
        title: hit.title || '',
        type: hit.type || 'page',
        content: hit.content_text,
        page_id: hit.page_id,
        block_id: hit.block_id,
        workspace_id: hit.workspace_id?.toString() || workspaceUuid,
        updated_at: hit.updated_at,
        created_at: hit.created_at,
      }));

      return searchResults;
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to database search if Meilisearch fails
      return this.fallbackSearch(workspaceId, userId, query, options);
    }
  }

  private async fallbackSearch(
    workspaceId: bigint,
    userId: bigint,
    query: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Search pages
    if (!options.type || options.type === 'page') {
      const pages = await this.pageRepo.findByWorkspaceId(workspaceId);
      const filtered = pages.filter(
        (page) =>
          page.title.toLowerCase().includes(query.toLowerCase()) ||
          (page.contentText && page.contentText.toLowerCase().includes(query.toLowerCase()))
      );

      results.push(
        ...filtered.map((page) => ({
          uuid: page.uuid,
          title: page.title,
          type: page.type as 'page' | 'database',
          content: page.contentText || undefined,
          workspace_id: workspaceId.toString(),
          updated_at: page.updatedAt.toISOString(),
          created_at: page.createdAt.toISOString(),
        }))
      );
    }

    return results.slice(options.offset || 0, (options.offset || 0) + (options.limit || 20));
  }

  async indexPage(pageId: bigint) {
    const page = await this.pageRepo.findById(pageId);
    if (!page || page.deletedAt) {
      return;
    }

    const client = getMeilisearchClient();
    const index = client.index('workspace');

    await index.addDocuments([
      {
        uuid: page.uuid,
        title: page.title,
        type: page.type,
        content_text: page.contentText || '',
        page_id: page.uuid,
        workspace_id: page.workspaceId.toString(),
        updated_at: page.updatedAt.toISOString(),
        created_at: page.createdAt.toISOString(),
      },
    ]);
  }

  async indexBlock(blockId: bigint) {
    const block = await this.blockRepo.findById(blockId);
    if (!block || block.deletedAt) {
      return;
    }

    const page = await this.pageRepo.findById(block.pageId);
    if (!page) {
      return;
    }

    const client = getMeilisearchClient();
    const index = client.index('workspace');

    await index.addDocuments([
      {
        uuid: block.uuid,
        title: `${page.title} - Block`,
        type: 'block',
        content_text: block.contentText || '',
        page_id: page.uuid,
        block_id: block.uuid,
        workspace_id: page.workspaceId.toString(),
        updated_at: block.updatedAt.toISOString(),
        created_at: block.createdAt.toISOString(),
      },
    ]);
  }

  async deleteFromIndex(uuid: string) {
    const client = getMeilisearchClient();
    const index = client.index('workspace');

    try {
      await index.deleteDocument(uuid);
    } catch (error) {
      // Document might not exist, ignore
      console.warn('Failed to delete from search index:', error);
    }
  }
}

