#!/usr/bin/env node
// 校验器真实基准：在临时目录生成 N 条自洽的合成 catalog，真跑 check-schemas.mjs 并计时。
// 用法：node scripts/bench-check.mjs [N]   （默认 N=200）
// 这是基准而非门禁：不设性能阈值，只输出真跑数字，避免编造或随机器负载波动的假阈值。
import { mkdtempSync, cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const N = Math.max(1, Number.parseInt(process.argv[2] ?? '200', 10) || 200);
const dir = mkdtempSync(join(tmpdir(), 'moxsh-bench-'));
const writeJson = (rel, obj) => {
  const dest = join(dir, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify(obj, null, 2) + '\n');
};
try {
  for (const rel of ['scripts/check-schemas.mjs', 'schema/catalog.schema.json', 'schema/entry-schema.json']) {
    const dest = join(dir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(join(root, rel), dest);
  }
  const template = JSON.parse(readFileSync(join(root, 'plugins/hello-mox/plugin.json'), 'utf8'));
  const entries = [], plugins = [];
  for (let i = 0; i < N; i++) {
    const id = `bench-${String(i).padStart(5, '0')}`;
    const entry = {
      id, name: `Bench ${i}`, version: '1.0.0', minVersion: '1.0.0',
      revokedVersions: [], type: 'plugin', path: `plugins/${id}`,
      packageStatus: 'planned', sizeBytes: 0,
    };
    entries.push(entry);
    plugins.push({ id, name: entry.name, version: '1.0.0', minVersion: '1.0.0', revokedVersions: [], type: 'plugin', path: entry.path });
    writeJson(`${entry.path}/plugin.json`, {
      ...template, id, name: entry.name, version: '1.0.0', type: 'plugin',
      minVersion: '1.0.0', revokedVersions: [],
    });
  }
  writeJson('catalog.json', { schemaVersion: '1.0', repoVersion: 'bench', updated: '2026-11-19', entries });
  writeJson('plugins.json', { schemaVersion: '1.0', repoVersion: 'bench', updated: '2026-11-19', plugins });

  const samples = [];
  let lastStatus = null, lastOut = '';
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    const r = spawnSync(process.execPath, [join(dir, 'scripts/check-schemas.mjs')], { encoding: 'utf8' });
    samples.push(performance.now() - t0);
    lastStatus = r.status;
    lastOut = (r.stdout || '') + (r.stderr || '');
  }
  samples.sort((a, b) => a - b);
  const median = samples[1];
  console.log(JSON.stringify({
    entries: N, runs: 3,
    medianMs: Number(median.toFixed(1)),
    minMs: Number(samples[0].toFixed(1)),
    maxMs: Number(samples[2].toFixed(1)),
    entriesPerSecond: Math.round(N / (median / 1000)),
    validatorExit: lastStatus,
  }));
  if (lastStatus !== 0) {
    console.error('基准样本未通过校验（基准无效）：' + lastOut.split('\n').filter(l => l.includes('✗')).slice(0, 3).join(' | '));
    process.exitCode = 1;
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
