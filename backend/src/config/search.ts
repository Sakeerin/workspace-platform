import { MeiliSearch } from 'meilisearch';
import { env } from './env';

let meilisearchClient: MeiliSearch | null = null;

export function getMeilisearchClient(): MeiliSearch {
  if (!meilisearchClient) {
    meilisearchClient = new MeiliSearch({
      host: env.search.meilisearch.url,
      apiKey: env.search.meilisearch.masterKey,
    });
  }
  return meilisearchClient;
}

export async function initializeSearchIndexes() {
  const client = getMeilisearchClient();

  try {
    // Create or get workspace index
    const workspaceIndex = client.index('workspace');
    
    // Configure searchable attributes
    await workspaceIndex.updateSearchableAttributes([
      'title',
      'content_text',
      'type',
    ]);

    // Configure filterable attributes
    await workspaceIndex.updateFilterableAttributes([
      'workspace_id',
      'type',
      'page_id',
      'block_id',
    ]);

    // Configure sortable attributes
    await workspaceIndex.updateSortableAttributes([
      'updated_at',
      'created_at',
    ]);

    console.log('Meilisearch indexes initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Meilisearch indexes:', error);
    // Don't throw - allow app to start even if search is unavailable
  }
}

export default getMeilisearchClient;

