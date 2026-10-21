import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const repo = 'NotNull92/hera-agent-unity';
const directory = new URL('../public/hera-unity-status/', import.meta.url);
const validRef = /^(?:v\d+\.\d+\.\d+|[0-9a-f]{7,40})$/;

try {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length && !validRef.test(args[0]))) {
    throw new Error('Expected a version tag or a 7–40 character lowercase commit hash');
  }
  let ref = args[0];
  if (!ref) {
    const headers = process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
    if (response.status !== 200) throw new Error(`Latest release: HTTP ${response.status}`);
    ref = (await response.json()).tag_name;
    if (typeof ref !== 'string' || !validRef.test(ref)) throw new Error('Invalid latest release ref');
  }
  const url = `https://raw.githubusercontent.com/${repo}/${ref}/docs/guide/index.html`;
  const response = await fetch(url);
  if (response.status !== 200) throw new Error(`Guide: HTTP ${response.status}`);
  const content = Buffer.from(await response.arrayBuffer());
  const html = content.toString('utf8');
  if (content.length < 1024 || content.length > 2 * 1024 * 1024 ||
      !html.includes('<html') || !html.includes('</html>')) {
    throw new Error('Invalid guide HTML or size');
  }
  let previous;
  try {
    previous = await readFile(new URL('index.html', directory));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const changed = args.length > 0 || !previous?.equals(content);
  if (changed) {
    const source = { repo, ref, url, sha256: createHash('sha256').update(content).digest('hex'), bytes: content.length };
    await mkdir(directory, { recursive: true });
    await writeFile(new URL('index.html', directory), content);
    await writeFile(new URL('source.json', directory), `${JSON.stringify(source, null, 2)}\n`);
  }
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `ref=${ref}\nchanged=${changed}\n`);
  }
  console.log(`${changed ? 'updated' : 'unchanged'} ${ref}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
