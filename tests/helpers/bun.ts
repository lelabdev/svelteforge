import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

function findBun(): string {
	const candidates = [
		process.env.BUN_EXECUTABLE,
		process.env.BUN_INSTALL && join(process.env.BUN_INSTALL, 'bin', 'bun'),
		process.env.HOME && join(process.env.HOME, '.bun', 'bin', 'bun'),
		'bun'
	].filter((candidate): candidate is string => Boolean(candidate));

	const bun = candidates.find((candidate) => candidate === 'bun' || existsSync(candidate));
	if (!bun) throw new Error('Bun executable not found');
	return bun;
}

export function runBun(args: string[], cwd: string): void {
	const bun = findBun();
	const bunDirectory = bun === 'bun' ? '' : dirname(bun);
	const path = [bunDirectory, process.env.PATH].filter(Boolean).join(':');

	execFileSync(bun, args, {
		cwd,
		stdio: 'pipe',
		timeout: 60_000,
		env: { ...process.env, PATH: path }
	});
}
