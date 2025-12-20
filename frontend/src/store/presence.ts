import { create } from 'zustand';

interface PresenceUser {
  user_id: string;
  user_name: string;
  user_email: string;
  cursor?: {
    x: number;
    y: number;
    block_uuid?: string;
  };
  last_seen: string;
}

interface PresenceState {
  presence: Map<string, Map<string, PresenceUser>>; // pageUuid -> userId -> user
  setPresence: (pageUuid: string, users: Map<string, PresenceUser>) => void;
  updateUser: (pageUuid: string, userId: string, user: PresenceUser) => void;
  removeUser: (pageUuid: string, userId: string) => void;
  getPresence: (pageUuid: string) => Map<string, PresenceUser>;
  clearPresence: (pageUuid: string) => void;
}

/**
 * Presence Store
 * 
 * Manages user presence state across pages
 */
export const usePresenceStore = create<PresenceState>((set, get) => ({
  presence: new Map(),

  setPresence: (pageUuid: string, users: Map<string, PresenceUser>) => {
    set((state) => {
      const newPresence = new Map(state.presence);
      newPresence.set(pageUuid, users);
      return { presence: newPresence };
    });
  },

  updateUser: (pageUuid: string, userId: string, user: PresenceUser) => {
    set((state) => {
      const newPresence = new Map(state.presence);
      const pagePresence = newPresence.get(pageUuid) || new Map();
      pagePresence.set(userId, user);
      newPresence.set(pageUuid, pagePresence);
      return { presence: newPresence };
    });
  },

  removeUser: (pageUuid: string, userId: string) => {
    set((state) => {
      const newPresence = new Map(state.presence);
      const pagePresence = newPresence.get(pageUuid);
      if (pagePresence) {
        pagePresence.delete(userId);
        if (pagePresence.size === 0) {
          newPresence.delete(pageUuid);
        } else {
          newPresence.set(pageUuid, pagePresence);
        }
      }
      return { presence: newPresence };
    });
  },

  getPresence: (pageUuid: string) => {
    return get().presence.get(pageUuid) || new Map();
  },

  clearPresence: (pageUuid: string) => {
    set((state) => {
      const newPresence = new Map(state.presence);
      newPresence.delete(pageUuid);
      return { presence: newPresence };
    });
  },
}));

