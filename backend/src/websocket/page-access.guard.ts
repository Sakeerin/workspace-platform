import { Socket } from 'socket.io';

export type PageAccessGuard = (client: Socket, pageUuid: string) => Promise<boolean>;

export async function canAccessPage(
  client: Socket,
  pageUuid: string,
  guard: PageAccessGuard
): Promise<boolean> {
  if (!client.data.user || !pageUuid) {
    return false;
  }

  try {
    return await guard(client, pageUuid);
  } catch {
    return false;
  }
}

export function emitPageAccessDenied(client: Socket, pageUuid: string) {
  client.emit('error', {
    code: 'PAGE_ACCESS_DENIED',
    message: 'Access denied to page',
    page_id: pageUuid,
  });
}
