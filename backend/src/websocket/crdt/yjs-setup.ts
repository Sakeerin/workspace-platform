import * as Y from 'yjs';
import { Redis } from 'ioredis';
import redis from '../../config/redis';

/**
 * Yjs CRDT Setup for Real-Time Collaboration
 * 
 * This module provides Yjs document management with Redis persistence
 * for collaborative editing of blocks and pages.
 */

export class YjsSetup {
  private static documents = new Map<string, Y.Doc>();
  private static redisClient: Redis;

  /**
   * Initialize Yjs with Redis persistence
   */
  static initialize(redisClient: Redis) {
    this.redisClient = redisClient;
  }

  /**
   * Get or create a Yjs document for a page
   * @param pageUuid - UUID of the page
   * @returns Yjs document
   */
  static getDocument(pageUuid: string): Y.Doc {
    if (!this.documents.has(pageUuid)) {
      const doc = new Y.Doc();
      this.documents.set(pageUuid, doc);
      
      // Load from Redis if available
      this.loadFromRedis(pageUuid, doc);
      
      // Set up persistence
      this.setupPersistence(pageUuid, doc);
    }
    
    return this.documents.get(pageUuid)!;
  }

  /**
   * Load document state from Redis
   */
  private static async loadFromRedis(pageUuid: string, doc: Y.Doc) {
    try {
      const key = `yjs:page:${pageUuid}`;
      const state = await this.redisClient.getBuffer(key);
      
      if (state) {
        Y.applyUpdate(doc, state);
      }
    } catch (error) {
      console.error(`Failed to load Yjs document from Redis for page ${pageUuid}:`, error);
    }
  }

  /**
   * Set up persistence for a document
   */
  private static setupPersistence(pageUuid: string, doc: Y.Doc) {
    doc.on('update', async (update: Uint8Array) => {
      try {
        const key = `yjs:page:${pageUuid}`;
        const currentState = await this.redisClient.getBuffer(key);
        
        if (currentState) {
          // Merge updates
          const currentDoc = new Y.Doc();
          Y.applyUpdate(currentDoc, currentState);
          Y.applyUpdate(currentDoc, update);
          const mergedState = Y.encodeStateAsUpdate(currentDoc);
          await this.redisClient.set(key, Buffer.from(mergedState));
        } else {
          // First update
          await this.redisClient.set(key, Buffer.from(update));
        }
      } catch (error) {
        console.error(`Failed to persist Yjs update for page ${pageUuid}:`, error);
      }
    });
  }

  /**
   * Get the blocks Y.Map for a page
   * @param pageUuid - UUID of the page
   * @returns Y.Map containing blocks
   */
  static getBlocksMap(pageUuid: string): Y.Map<any> {
    const doc = this.getDocument(pageUuid);
    const blocks = doc.getMap('blocks');
    return blocks;
  }

  /**
   * Get the presence Y.Map for a page
   * @param pageUuid - UUID of the page
   * @returns Y.Map containing presence data
   */
  static getPresenceMap(pageUuid: string): Y.Map<any> {
    const doc = this.getDocument(pageUuid);
    const presence = doc.getMap('presence');
    return presence;
  }

  /**
   * Clean up document when no longer needed
   * @param pageUuid - UUID of the page
   */
  static cleanup(pageUuid: string) {
    const doc = this.documents.get(pageUuid);
    if (doc) {
      doc.destroy();
      this.documents.delete(pageUuid);
    }
  }

  /**
   * Encode document state as update
   * @param pageUuid - UUID of the page
   * @returns Encoded state as Uint8Array
   */
  static encodeState(pageUuid: string): Uint8Array {
    const doc = this.getDocument(pageUuid);
    return Y.encodeStateAsUpdate(doc);
  }

  /**
   * Apply update to document
   * @param pageUuid - UUID of the page
   * @param update - Update to apply
   */
  static applyUpdate(pageUuid: string, update: Uint8Array) {
    const doc = this.getDocument(pageUuid);
    Y.applyUpdate(doc, update);
  }
}

// Initialize with Redis connection
YjsSetup.initialize(redis);

