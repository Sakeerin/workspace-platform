import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { env } from '../config/env';

/**
 * Yjs Provider Service
 * 
 * Manages Yjs documents and WebSocket connections for real-time collaboration.
 */
class YjsProviderService {
  private documents = new Map<string, Y.Doc>();
  private providers = new Map<string, WebsocketProvider>();

  /**
   * Get or create a Yjs document for a page
   */
  getDocument(pageUuid: string): Y.Doc {
    if (!this.documents.has(pageUuid)) {
      const doc = new Y.Doc();
      this.documents.set(pageUuid, doc);
    }
    return this.documents.get(pageUuid)!;
  }

  /**
   * Connect to WebSocket provider for a page
   */
  connectProvider(pageUuid: string, token: string): WebsocketProvider {
    if (this.providers.has(pageUuid)) {
      return this.providers.get(pageUuid)!;
    }

    const doc = this.getDocument(pageUuid);
    const wsUrl = env.wsUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    const provider = new WebsocketProvider(
      `${wsUrl}/yjs`,
      `page:${pageUuid}`,
      doc,
      {
        params: {
          token,
        },
      }
    );

    this.providers.set(pageUuid, provider);
    return provider;
  }

  /**
   * Disconnect provider for a page
   */
  disconnectProvider(pageUuid: string) {
    const provider = this.providers.get(pageUuid);
    if (provider) {
      provider.destroy();
      this.providers.delete(pageUuid);
    }
  }

  /**
   * Get blocks Y.Map for a page
   */
  getBlocksMap(pageUuid: string): Y.Map<any> {
    const doc = this.getDocument(pageUuid);
    return doc.getMap('blocks');
  }

  /**
   * Get presence Y.Map for a page
   */
  getPresenceMap(pageUuid: string): Y.Map<any> {
    const doc = this.getDocument(pageUuid);
    return doc.getMap('presence');
  }

  /**
   * Clean up document and provider
   */
  cleanup(pageUuid: string) {
    this.disconnectProvider(pageUuid);
    const doc = this.documents.get(pageUuid);
    if (doc) {
      doc.destroy();
      this.documents.delete(pageUuid);
    }
  }
}

export const yjsProvider = new YjsProviderService();
export default yjsProvider;

