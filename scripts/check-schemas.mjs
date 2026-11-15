#!/usr/bin/env node
// 零依赖 Schema 契约自测。
// 目的不是替代完整 JSON Schema 引擎，而是验证「规则本身没失效」：
//   ① catalog.schema.json / entry-schema.json 都带 integrity/signature/keyId 定义；
//   ② 两份定义的算法枚举与 moxsh-suite 规格保持同构（防对齐后又漂移）；
//   ③ catalog.json 每条 entry 满足必填、id 合法、packageStatus 与 sizeBytes 自洽；
//   ④ catalog.json 与 plugins.json 的插件 id 集合一致；
//   ⑤ 禁止回滚（安全硬需求）：schema 声明了 minVersion / revokedVersions 并纳入
//      catalog 的 required；catalog.json / plugins.json / 各 plugins/*/plugin.json
//      三方都补齐字段、格式合法且彼此一致（防「清单加了字段、某个入口漏改」漂移）。
//
// 策略行为（回滚被拒 / 低于地板被拒 / 升级通过）由 check-plugin-policy.mjs 真跑断言。
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };

const catalogSchema = read('schema/catalog.schema.json');
const entrySchema = read('schema/entry-schema.json');
const catalog = read('catalog.json');
const plugins = read('plugins.json');

// 直接复用 catalog.schema.json 里声明的 semver 正则，避免校验脚本与 schema 各写一份而漂移。
const semverPattern = catalogSchema.$defs?.semver?.pattern;
const semverRe = semverPattern ? new RegExp(semverPattern) : null;
const isSemver = (v) => typeof v === 'string' && semverRe !== null && semverRe.test(v);
const sortStr = (arr) => [...arr].sort();
const sameSet = (a, b) =>
  Array.isArray(a) && Array.isArray(b) &&
  JSON.stringify(sortStr(a)) === JSON.stringify(sortStr(b));

console.log('=== Schema 规则自测 ===');
const catProps = catalogSchema.$defs?.entry?.properties ?? {};
const catRequired = catalogSchema.$defs?.entry?.required ?? [];
ok(!!catProps.integrity, 'catalog.schema.json 的 entry 缺 integrity');
ok(!!catProps.signingKeyId, 'catalog.schema.json 的 entry 缺 signingKeyId');
ok(!!catalogSchema.$defs?.integrity, 'catalog.schema.json 缺 $defs.integrity');
ok(Array.isArray(entrySchema.required) && ['id','name','version','type'].every(k => entrySchema.required.includes(k)),
   'entry-schema.json 未强制 .mox manifest 的 id/name/version/type');
ok(!!entrySchema.properties?.integrity, 'entry-schema.json 缺 integrity');
ok(!!entrySchema.$defs?.integrity, 'entry-schema.json 缺 $defs.integrity');
// ⑤ 新字段必须真的写进两份 schema，且 catalog 侧纳入 required（清单缺失即不合规）
ok(!!catProps.minVersion, 'catalog.schema.json 的 entry 缺 minVersion');
ok(!!catProps.revokedVersions, 'catalog.schema.json 的 entry 缺 revokedVersions');
ok(catRequired.includes('minVersion') && catRequired.includes('revokedVersions'),
   'catalog.schema.json 的 entry.required 未强制 minVersion / revokedVersions');
ok(!!catalogSchema.$defs?.semver?.pattern, 'catalog.schema.json 缺 $defs.semver.pattern');
ok(catProps.revokedVersions?.uniqueItems === true, 'catalog.schema.json 的 revokedVersions 未设 uniqueItems');
ok(!!entrySchema.properties?.minVersion, 'entry-schema.json 缺 minVersion');
ok(!!entrySchema.properties?.revokedVersions, 'entry-schema.json 缺 revokedVersions');
ok(!!entrySchema.$defs?.semver?.pattern, 'entry-schema.json 缺 $defs.semver.pattern');

const signatureAlgos = ['ed25519','rsa-pss','ecdsa'];
for (const [label, def] of [['catalog', catalogSchema.$defs?.integrity], ['entry', entrySchema.$defs?.integrity]]) {
  const a = def?.properties?.signature?.properties?.algo?.enum ?? [];
  ok(signatureAlgos.every(x => a.includes(x)), `${label} schema 的 signature.algo 枚举与 suite spec 不一致`);
  const c = def?.properties?.checksum?.properties?.algo?.enum ?? [];
  ok(['sha256','sha512'].every(x => c.includes(x)), `${label} schema 的 checksum.algo 枚举与 suite spec 不一致`);
  ok(!!def?.properties?.signature?.properties?.keyId, `${label} schema 缺 signature.keyId`);
}

console.log('=== catalog.json 契约 ===');
ok(Array.isArray(catalog.entries) && catalog.entries.length > 0, 'catalog.entries 为空');
const idRe = /^(?!\.)[A-Za-z0-9._-]+$/;
for (const e of catalog.entries ?? []) {
  const tag = e.id ?? '(无 id)';
  ok(['id','name','version','type'].every(k => typeof e[k] === 'string' && e[k].length > 0), `${tag} 缺必填字段`);
  ok(idRe.test(e.id ?? ''), `${tag} 的 id 不合法`);
  ok(['planned','available','yanked'].includes(e.packageStatus), `${tag} 缺合法 packageStatus`);
  // ⑤ 每条 entry 必须带合法 minVersion + revokedVersions
  ok(isSemver(e.minVersion), `${tag} 缺合法 minVersion（或不是 semver）`);
  ok(Array.isArray(e.revokedVersions), `${tag} 缺 revokedVersions 数组`);
  ok(Array.isArray(e.revokedVersions) && e.revokedVersions.every(isSemver),
     `${tag} 的 revokedVersions 含非法版本号`);
  ok(Array.isArray(e.revokedVersions) && new Set(e.revokedVersions).size === e.revokedVersions.length,
     `${tag} 的 revokedVersions 有重复项`);
  // 目录当前可安装版本不得低于自身地板（否则清单自相矛盾）
  ok(isSemver(e.version) && isSemver(e.minVersion) && compareCore(e.version, e.minVersion) >= 0,
     `${tag} 当前 version(${e.version}) 低于自身 minVersion(${e.minVersion})`);
  if (e.packageStatus === 'planned') {
    ok(e.sizeBytes === 0, `${tag} 标记 planned 却写了非 0 的 sizeBytes（禁止伪造包体积）`);
  }
  if (e.packageStatus === 'available') {
    ok(e.sizeBytes > 0, `${tag} 标记 available 却 sizeBytes=0`);
    ok(!!e.integrity?.checksum, `${tag} 已发布却缺 integrity.checksum`);
    ok(!!e.integrity?.signature, `${tag} 已发布却缺 integrity.signature`);
  }
}

// 仅用于「version >= minVersion」的轻量核心段比较（不引完整 semver 引擎；
// 行为级比较由 check-plugin-policy.mjs 的参考实现覆盖）。
function compareCore(a, b) {
  const nums = (s) => s.split('+')[0].split('-')[0].split('.').map(Number);
  const x = nums(a), y = nums(b);
  for (let i = 0; i < 3; i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

console.log('=== catalog / plugins 索引一致性 ===');
const catIds = (catalog.entries ?? []).map(e => e.id).sort();
const plugIds = (plugins.plugins ?? plugins.entries ?? []).map(e => e.id).sort();
ok(JSON.stringify(catIds) === JSON.stringify(plugIds),
   `两份索引 id 集合不一致：catalog=[${catIds}] plugins=[${plugIds}]`);

// ⑤ 三方策略一致性：catalog.json / plugins.json / plugins/*/plugin.json 的
//    minVersion 与 revokedVersions 必须逐 id 相同（漏改任一入口都会在此暴露）。
console.log('=== 禁止回滚策略：三方一致性（catalog / plugins.json / plugin.json） ===');
const catById = Object.fromEntries((catalog.entries ?? []).map(e => [e.id, e]));
const pluginList = plugins.plugins ?? plugins.entries ?? [];
for (const p of pluginList) {
  const tag = p.id ?? '(无 id)';
  const c = catById[p.id];
  ok(!!c, `${tag} 在 catalog.json 中无对应条目`);
  if (!c) continue;
  ok(isSemver(p.minVersion), `${tag} plugins.json 缺合法 minVersion`);
  ok(Array.isArray(p.revokedVersions) && p.revokedVersions.every(isSemver),
     `${tag} plugins.json 的 revokedVersions 非法`);
  ok(p.minVersion === c.minVersion,
     `${tag} plugins.json.minVersion(${p.minVersion}) != catalog.json.minVersion(${c.minVersion})`);
  ok(sameSet(p.revokedVersions, c.revokedVersions),
     `${tag} plugins.json.revokedVersions 与 catalog.json 不一致`);

  // 各 plugins/*/plugin.json（路径取自 catalog.json 的 entry.path）
  const pjPath = join(c.path ?? `plugins/${c.id}`, 'plugin.json');
  if (existsSync(join(root, pjPath))) {
    const pj = read(pjPath);
    ok(isSemver(pj.minVersion), `${tag} ${pjPath} 缺合法 minVersion`);
    ok(Array.isArray(pj.revokedVersions) && pj.revokedVersions.every(isSemver),
       `${tag} ${pjPath} 的 revokedVersions 非法`);
    ok(pj.minVersion === c.minVersion,
       `${tag} ${pjPath}.minVersion(${pj.minVersion}) != catalog.json.minVersion(${c.minVersion})`);
    ok(sameSet(pj.revokedVersions, c.revokedVersions),
       `${tag} ${pjPath}.revokedVersions 与 catalog.json 不一致`);
  } else {
    ok(false, `${tag} 缺包内 ${pjPath}`);
  }
}

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
