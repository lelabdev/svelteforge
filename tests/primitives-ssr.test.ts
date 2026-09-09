// @vitest-environment jsdom
/**
 * #321 — SSR hydration contract for generated ids.
 *
 * Math.random() in template components produced different ids on the server
 * and on hydration, breaking label association (and every id-based aria
 * wiring). `$props.id()` carries the id through the SSR `<!--$uid-->` markers
 * so the hydrating client reuses the server's value.
 *
 * These tests use REAL compiled output of Input.svelte for BOTH targets —
 * server + client — and assert that hydrating the server markup keeps every
 * generated id. Same compile-on-the-fly fixture style as
 * tests/file-upload-contract.test.ts.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { hydrate } from 'svelte';
import { render as ssrRender } from 'svelte/server';
import { compile } from 'svelte/compiler';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const COMPONENT = join(
	ROOT,
	'packages',
	'svforge',
	'templates',
	'base',
	'src',
	'lib',
	'components',
	'svforge',
	'primitives',
	'Input.svelte'
);

let InputServer: any;
let InputClient: any;

beforeAll(async () => {
	// Compile the CURRENT template source for both targets once per run.
	const source = readFileSync(COMPONENT, 'utf-8');
	const server = compile(source, { generate: 'server', filename: 'Input.svelte' });
	const client = compile(source, { generate: 'client', filename: 'Input.svelte' });
	mkdirSync(join(ROOT, 'tests', '__gen__'), { recursive: true });
	writeFileSync(join(ROOT, 'tests', '__gen__', 'Input.ssr.server.js'), server.js.code);
	writeFileSync(join(ROOT, 'tests', '__gen__', 'Input.ssr.client.js'), client.js.code);
	InputServer = (await import(join(ROOT, 'tests/__gen__/Input.ssr.server.js'))).default;
	InputClient = (await import(join(ROOT, 'tests/__gen__/Input.ssr.client.js'))).default;
});

describe('generated ids survive SSR + hydration (#321)', () => {
	it('server output is deterministic: two renders produce identical ids', () => {
		const first = ssrRender(InputServer, { props: { label: 'Email' } }).html;
		const second = ssrRender(InputServer, { props: { label: 'Email' } }).html;
		// With Math.random() the two renders diverged.
		expect(first).toBe(second);
		expect(first).toMatch(/id="[^"]+"/);
	});

	it('the hydrating client reuses the server ids — no hydration mismatch', () => {
		const { html } = ssrRender(InputServer, { props: { label: 'Email', error: 'Invalid' } });
		const ssrId = html.match(/id="([^"]+)"/)?.[1];
		expect(ssrId).toBeTruthy();

		// Hydrate the exact server markup (as SvelteKit does on navigation).
		const target = document.createElement('div');
		target.innerHTML = html;
		document.body.append(target);
		hydrate(InputClient, { target, props: { label: 'Email', error: 'Invalid' } });

		const input = target.querySelector('input')!;
		const label = target.querySelector('label')!;
		const error = target.querySelector('p')!;
		// The id the server produced is still the one in the DOM, wired to the
		// label and the error description.
		expect(input.id).toBe(ssrId);
		expect(label.getAttribute('for')).toBe(ssrId);
		expect(error.id).toBe(`${ssrId}-error`);
		expect(input.getAttribute('aria-describedby')).toBe(`${ssrId}-error`);
		target.remove();
	});
});
