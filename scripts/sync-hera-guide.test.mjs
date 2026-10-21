import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

test('sync validates input and downloads before writing, and preserves unchanged metadata', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hera-guide-test-'));
  try {
    await mkdir(join(root, 'scripts'));
    await copyFile(new URL('./sync-hera-guide.mjs', import.meta.url), join(root, 'scripts/sync.mjs'));
    const html = `<html>${'a'.repeat(1024)}</html>`;
    await writeFile(join(root, 'mock.mjs'), `
      globalThis.fetch = async (url) => {
        if (url.includes('releases/latest')) return Response.json({ tag_name: 'v0.3.12' });
        if (process.env.CASE === '404') return new Response('', { status: 404 });
        return new Response(process.env.CASE === 'invalid' ? 'not HTML' : ${JSON.stringify(html)});
      };
    `);
    const run = (args = [], scenario = '') => spawnSync(process.execPath,
      ['--import', pathToFileURL(join(root, 'mock.mjs')).href, join(root, 'scripts/sync.mjs'), ...args],
      { encoding: 'utf8', env: { ...process.env, CASE: scenario, GITHUB_OUTPUT: join(root, 'output') } });
    assert.equal(run(['1cdca32']).status, 0);
    const index = join(root, 'public/hera-unity-status/index.html');
    const source = join(root, 'public/hera-unity-status/source.json');
    const before = await readFile(source, 'utf8');
    const modified = (await stat(source)).mtimeMs;
    for (const [args, scenario] of [[['../x'], ''], [['main'], ''], [['v0.3.11'], '404'], [['v0.3.12'], 'invalid']]) {
      assert.equal(run(args, scenario).status, 1);
      assert.equal(await readFile(index, 'utf8'), html);
      assert.equal(await readFile(source, 'utf8'), before);
    }
    const unchanged = run();
    assert.equal(unchanged.status, 0);
    assert.equal(unchanged.stdout.trim(), 'unchanged v0.3.12');
    assert.equal((await stat(source)).mtimeMs, modified);
    assert.equal(await readFile(source, 'utf8'), before);
    assert.match(await readFile(join(root, 'output'), 'utf8'), /ref=v0.3.12\nchanged=false/);
    assert.equal(run(['v0.3.12']).stdout.trim(), 'updated v0.3.12');
    assert.equal(JSON.parse(await readFile(source, 'utf8')).ref, 'v0.3.12');
    assert.equal(run(['unity'], '404').status, 1);

    const godot = join(root, 'public/hera-godot-status');
    const missing = run(['godot'], '404');
    assert.equal(missing.status, 0);
    assert.equal(missing.stdout.trim(), 'missing v0.3.12');
    await assert.rejects(stat(godot));
    assert.match(await readFile(join(root, 'output'), 'utf8'), /ref=v0.3.12\nchanged=false\n$/);
    assert.equal(run(['godot', 'v2.0.3'], '404').status, 1);
    await assert.rejects(stat(godot));
    assert.equal(run(['godot']).stdout.trim(), 'updated v0.3.12');
    assert.equal(await readFile(join(godot, 'index.html'), 'utf8'), html);
    assert.equal(JSON.parse(await readFile(join(godot, 'source.json'), 'utf8')).repo, 'NotNull92/hera-agent-godot');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
