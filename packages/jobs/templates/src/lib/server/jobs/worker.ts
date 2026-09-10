import { startJobRunner, stopJobRunner } from './runner';

/**
 * Dedicated jobs worker (#328) — the documented production deployment mode
 * (`separate-worker`). Run it with the scaffolded npm script:
 *
 *   bun run jobs:worker
 *
 * The web runtime never starts a poller by itself; this process is the single
 * place where jobs are claimed and executed. Claims are atomic and
 * lease-guarded, so several worker processes can run concurrently (work is
 * split, never duplicated). On SIGTERM/SIGINT the worker stops polling and
 * drains the in-flight batch before exiting — safe under systemd/Docker
 * stop sequences.
 */

startJobRunner();
console.log('[jobs] worker started — polling every 5s (claims are atomic, lease 60s)');

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
	if (shuttingDown) return;
	shuttingDown = true;
	console.log(`[jobs] ${signal} received — draining the active batch…`);
	await stopJobRunner();
	console.log('[jobs] worker stopped cleanly');
	process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
