import { RealtimeHub } from './hub';

/**
 * Shared realtime hub instance — import from anywhere server-side:
 *   import { realtime } from '$lib/server/realtime';
 *   await realtime.publish({ channel, event, payload });
 */
export const realtime = new RealtimeHub();

export type { RealtimeEvent, RealtimeServerOptions } from './hub';
