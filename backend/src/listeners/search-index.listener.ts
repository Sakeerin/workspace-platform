import { SearchService } from '../services/search.service';
import { PageRepository } from '../repositories/page.repository';
import { BlockRepository } from '../repositories/block.repository';

export class SearchIndexListener {
  constructor(
    private searchService: SearchService,
    private pageRepo: PageRepository,
    private blockRepo: BlockRepository
  ) {}

  /**
   * Listen for page creation/update events and index them
   */
  async onPageCreated(pageId: bigint) {
    try {
      await this.searchService.indexPage(pageId);
    } catch (error) {
      console.error('Failed to index page:', error);
    }
  }

  async onPageUpdated(pageId: bigint) {
    try {
      await this.searchService.indexPage(pageId);
    } catch (error) {
      console.error('Failed to re-index page:', error);
    }
  }

  async onPageDeleted(pageUuid: string) {
    try {
      await this.searchService.deleteFromIndex(pageUuid);
    } catch (error) {
      console.error('Failed to delete page from index:', error);
    }
  }

  /**
   * Listen for block creation/update events and index them
   */
  async onBlockCreated(blockId: bigint) {
    try {
      await this.searchService.indexBlock(blockId);
    } catch (error) {
      console.error('Failed to index block:', error);
    }
  }

  async onBlockUpdated(blockId: bigint) {
    try {
      await this.searchService.indexBlock(blockId);
    } catch (error) {
      console.error('Failed to re-index block:', error);
    }
  }

  async onBlockDeleted(blockUuid: string) {
    try {
      await this.searchService.deleteFromIndex(blockUuid);
    } catch (error) {
      console.error('Failed to delete block from index:', error);
    }
  }
}

