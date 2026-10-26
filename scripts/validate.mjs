#!/usr/bin/env node
// Awase-maintained package checks against Cursor's documented single-plugin format.
// No installation, credential access or authenticated tool calls.
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve, isAbsolute, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const endpoint = 'https://awase.dev/stem';
const checks = [];
function check(label, fn) { fn(); checks.push(label); }
async function json(path) { return JSON.parse(await readFile(join(root, path), 'utf8')); }
async function localPath(value) {
  assert.equal(typeof value, 'string');
  assert(value && !isAbsolute(value) && !value.split(/[\\/]/).includes('..'));
  const target = resolve(root, value);
  assert(!relative(root, target).startsWith('..'));
  await stat(target);
  return target;
}

const manifest = await json('.cursor-plugin/plugin.json');
check('manifest identity, types and version', () => {
  assert.equal(manifest.name, 'stem');
  assert.match(manifest.name, /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  for (const key of ['description', 'displayName']) assert.equal(typeof manifest[key], 'string');
  assert(manifest.description.length > 0);
  assert.equal(manifest.author.name, 'Awase LLC');
  assert.equal(manifest.author.email, 'support@awase.dev');
  assert.equal(manifest.repository, 'https://github.com/devawasedev/stem-cursor-connector');
  assert.equal(new URL(manifest.homepage).origin, 'https://awase.dev');
  assert(Array.isArray(manifest.keywords) && manifest.keywords.every(k => typeof k === 'string' && k.length > 0));
  assert.equal(manifest.license, 'MIT');
});
for (const key of ['logo', 'skills', 'mcpServers']) await localPath(manifest[key]);
checks.push('all component paths are present and stay inside the package');
const mcp = await json('mcp.json');
check('one remote endpoint, no commands, headers, variables or credentials', () => {
  assert.deepEqual(mcp, { mcpServers: { stem: { url: endpoint } } });
  for (const key of ['hooks', 'agents', 'rules', 'commands', 'variables']) assert(!(key in manifest));
});
const topLevel = await readdir(root);
check('no hooks or always-on component directories', () => {
  for (const name of ['hooks', 'agents', 'rules', 'commands']) assert(!topLevel.includes(name));
});
const skills = await readdir(join(root, manifest.skills), { withFileTypes: true });
assert.equal(skills.length, 1);
assert.equal(skills[0].name, 'stem-project-context');
const skill = await readFile(join(root, manifest.skills, skills[0].name, 'SKILL.md'), 'utf8');
check('skill frontmatter has matching name and specific description', () => {
  const header = skill.match(/^---\n([\s\S]+?)\n---\n/);
  assert(header);
  const fields = Object.fromEntries(header[1].split('\n').map(line => {
    const colon = line.indexOf(':');
    assert(colon > 0);
    return [line.slice(0, colon), line.slice(colon + 1).trim()];
  }));
  assert.equal(fields.name, skills[0].name);
  assert(fields.description.length > 0);
  assert.equal(Object.keys(fields).length, 2);
});
const logo = await readFile(join(root, manifest.logo));
check('committed canonical logo is a 1024-pixel PNG', () => {
  assert.equal(logo.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(logo.readUInt32BE(16), 1024);
  assert.equal(logo.readUInt32BE(20), 1024);
});
const readme = await readFile(join(root, 'README.md'), 'utf8');
const installLinks = [...readme.matchAll(/\]\((https:\/\/cursor\.com\/install-mcp\?[^)]+)\)/g)].map(m => m[1]);
assert.equal(installLinks.length, 1);
const install = new URL(installLinks[0]);
check('install link round-trips exactly to the remote MCP configuration', () => {
  assert.equal(install.origin, 'https://cursor.com');
  assert.equal(install.pathname, '/install-mcp');
  assert.equal(install.searchParams.get('name'), 'stem');
  assert.deepEqual([...install.searchParams.keys()].sort(), ['config', 'name']);
  const config = JSON.parse(Buffer.from(install.searchParams.get('config'), 'base64').toString('utf8'));
  assert.deepEqual(config, mcp.mcpServers.stem);
});
const license = await readFile(join(root, 'LICENSE'), 'utf8');
const notice = await readFile(join(root, 'NOTICE.md'), 'utf8');
check('license and branding notice present', () => {
  assert(license.startsWith('MIT License\n'));
  assert(notice.includes('not licensed under MIT'));
});

const network = [];
if (process.argv.includes('--network')) {
  async function get(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, `GET ${url}: ${response.status}`);
    network.push({ url, status: response.status, finalUrl: response.url, contentType: response.headers.get('content-type') });
    return response;
  }
  const landing = await get(install.href);
  assert.equal(new URL(landing.url).origin, 'https://cursor.com');
  assert(landing.headers.get('content-type')?.includes('text/html'));
  const resource = await (await get('https://awase.dev/.well-known/oauth-protected-resource/stem')).json();
  assert.equal(resource.resource, endpoint);
  assert.deepEqual(resource.authorization_servers, ['https://awase.dev']);
  const auth = await (await get('https://awase.dev/.well-known/oauth-authorization-server')).json();
  assert.equal(auth.issuer, 'https://awase.dev');
  assert.equal(auth.registration_endpoint, 'https://awase.dev/oauth/register');
  assert(auth.code_challenge_methods_supported.includes('S256'));
  assert(auth.token_endpoint_auth_methods_supported.includes('none'));
  assert(auth.grant_types_supported.includes('authorization_code'));
  assert(auth.grant_types_supported.includes('refresh_token'));
  assert(auth.scopes_supported.includes('stem'));
  checks.push('public install landing and OAuth discovery metadata');
}
console.log(JSON.stringify({ ok: true, scope: 'package validation; no authenticated Cursor runtime test', checks, network }, null, 2));
