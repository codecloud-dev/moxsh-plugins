#!/usr/bin/env node
// 校验器的负向回归测试（零依赖）。
// 1.0.3 及之前 check-schemas.mjs 只比 minVersion / revokedVersions，
//    把 plugin.json 的 id 改成 spoofed-id、version 改成 9.9.9、type 改成 rootfs
//    全都 58/0 假绿。本脚本把每一类篡改真正注入临时副本，断言校验器必须拒绝。
//
// 用法：node scripts/check-validators.mjs
// 退出码：任一负向用例被校验器放过 -> 1；全部按预期拒绝 -> 0。
import { mkdtempSync, cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = [
  'scripts/check-schemas.mjs',
  'catalog.json',
  'plugins.json',
  'schema/catalog.schema.json',
  'schema/entry-schema.json',
  'plugins/hello-mox/plugin.json',
  'plugins/glass-terminal-theme/plugin.json',
];

function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), 'moxsh-neg-'));
  for (const rel of FILES) {
    const dest = join(dir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(join(root, rel), dest);
  }
  return dir;
}
const read = (dir, rel) => JSON.parse(readFileSync(join(dir, rel), 'utf8'));
const patch = (dir, rel, fn) => {
  const o = read(dir, rel);
  fn(o);
  writeFileSync(join(dir, rel), JSON.stringify(o, null, 2) + '\n');
};
// catalog.json 用 entries[]、plugins.json 用 plugins[]、plugin.json 本身就是单条 entry。
const primary = (o) => (o.entries ? o.entries[0] : (o.plugins ? o.plugins[0] : o));
function runValidator(dir) {
  const r = spawnSync(process.execPath, [join(dir, 'scripts/check-schemas.mjs')], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const reasons = out.split('\n').filter(l => l.includes('✗')).slice(0, 2).map(l => l.trim());
  return { status: r.status, reasons };
}

const CASES = [
  {
    name: '控制组：未篡改的干净仓库必须通过',
    mutate() {},
    expect: 0,
  },
  {
    name: 'plugin.json 的 id 被冒名改写（spoofed-id）',
    mutate(d) { patch(d, 'plugins/hello-mox/plugin.json', o => { o.id = 'spoofed-id'; }); },
    expect: 1,
  },
  {
    name: 'plugin.json 的 version 与目录不一致（9.9.9）',
    mutate(d) { patch(d, 'plugins/hello-mox/plugin.json', o => { o.version = '9.9.9'; }); },
    expect: 1,
  },
  {
    name: 'plugin.json 的 type 与目录不一致（rootfs）',
    mutate(d) { patch(d, 'plugins/hello-mox/plugin.json', o => { o.type = 'rootfs'; }); },
    expect: 1,
  },
  {
    name: 'plugin.json 文件缺失',
    mutate(d) { unlinkSync(join(d, 'plugins/hello-mox/plugin.json')); },
    expect: 1,
  },
  {
    name: 'plugins.json 的 version 与目录不一致',
    mutate(d) { patch(d, 'plugins.json', o => { o.plugins[0].version = '9.9.9'; }); },
    expect: 1,
  },
  {
    name: 'plugins.json 的 type 与目录不一致',
    mutate(d) { patch(d, 'plugins.json', o => { o.plugins[0].type = 'rootfs'; }); },
    expect: 1,
  },
  {
    name: '三方 minVersion 不一致（回归旧覆盖）',
    mutate(d) { patch(d, 'plugins/hello-mox/plugin.json', o => { o.minVersion = '0.9.0'; }); },
    expect: 1,
  },
  {
    name: '当前 version 被写进自己的 revokedVersions（自我撤销）',
    mutate(d) {
      for (const rel of ['catalog.json', 'plugins.json', 'plugins/hello-mox/plugin.json']) {
        patch(d, rel, o => {
          const e = primary(o);
          e.revokedVersions = [...new Set([...e.revokedVersions, e.version])];
        });
      }
    },
    expect: 1,
  },
  {
    name: '两个索引同步出现重复 id',
    mutate(d) {
      patch(d, 'catalog.json', o => { o.entries[1].id = o.entries[0].id; });
      patch(d, 'plugins.json', o => { o.plugins[1].id = o.plugins[0].id; });
    },
    expect: 1,
  },
  {
    name: 'version 写成 1.0.1garbage（旧弱正则可绕过）',
    mutate(d) {
      for (const rel of ['catalog.json', 'plugins.json', 'plugins/hello-mox/plugin.json']) {
        patch(d, rel, o => {
          primary(o).version = '1.0.1garbage';
        });
      }
    },
    expect: 1,
  },
  {
    name: '两份 schema 的 version 退化回无 $ref 的弱约束',
    mutate(d) {
      patch(d, 'schema/entry-schema.json', o => { o.properties.version = { type: 'string' }; });
      patch(d, 'schema/catalog.schema.json', o => { o.$defs.entry.properties.version = { type: 'string' }; });
    },
    expect: 1,
  },
  {
    name: 'plugins.json 的 repoVersion 与 catalog.json 漂移',
    mutate(d) { patch(d, 'plugins.json', o => { o.repoVersion = '0.0.0-drift'; }); },
    expect: 1,
  },
  {
    name: 'plugins.json 的 updated 与 catalog.json 漂移',
    mutate(d) { patch(d, 'plugins.json', o => { o.updated = '2000-01-01'; }); },
    expect: 1,
  },
  {
    name: 'catalog.json 的 updated 写成非法日期格式',
    mutate(d) {
      patch(d, 'catalog.json', o => { o.updated = 'yesterday'; });
      patch(d, 'plugins.json', o => { o.updated = 'yesterday'; });
    },
    expect: 1,
  },
];

console.log('=== 校验器负向回归（真实注入篡改，断言必须拒绝） ===');
let pass = 0, fail = 0;
for (const c of CASES) {
  const dir = sandbox();
  try {
    c.mutate(dir);
    const r = runValidator(dir);
    const rejected = r.status !== 0;
    const okCase = c.expect === 0 ? r.status === 0 : rejected;
    if (okCase) {
      pass++;
      console.log(`  ✓ ${c.name}`);
    } else {
      fail++;
      console.error(`  ✗ ${c.name}  → 校验器退出码 ${r.status}（期望被拒/通过：${c.expect === 0 ? '通过' : '被拒'}）`);
    }
    if (!okCase && r.reasons.length) console.error('      校验器输出：' + r.reasons.join(' | '));
    if (okCase && c.expect !== 0 && r.reasons.length) console.log(`      ↳ 命中：${r.reasons[0]}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
