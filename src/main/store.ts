import Store from 'electron-store';
import { randomUUID } from 'crypto';

export type UpdateChannel = 'stable' | 'beta';

export interface StoreSchema {
  userId: string;
  channel: UpdateChannel;
  lastUpdateCheck: number;
}

export const store = new Store<StoreSchema>({
  name: 'app-config',
  defaults: {
    userId: '',
    channel: 'stable',
    lastUpdateCheck: 0,
  },
});

export function getOrCreateUserId(): string {
  let userId = store.get('userId');
  if (!userId) {
    userId = randomUUID();
    store.set('userId', userId);
  }
  return userId;
}

export function getChannel(): UpdateChannel {
  return store.get('channel');
}

export function setChannel(channel: UpdateChannel): void {
  store.set('channel', channel);
}

export function getLastUpdateCheck(): number {
  return store.get('lastUpdateCheck');
}
