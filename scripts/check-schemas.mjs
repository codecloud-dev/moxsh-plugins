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
// 撤销名单命中忽略构建元数据（与运行时 isRevoked 的 semver 等价语义一致）。
const stripBuild = (v) => (typeof v === 'string' ? v.split('+')[0] : v);

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
// 1.0.4：version 字段必须引用完整锚定的 semver 定义。旧的内联前缀正则结尾无 $
// （entry-schema）/ 干脆没有 pattern（catalog.schema），会让 1.0.1garbage 之类蒙混过关。
ok(catProps.version?.$ref === '#/$defs/semver',
   'catalog.schema.json 的 entry.version 未引用 #/$defs/semver（version 实际无 semver 约束）');
ok(entrySchema.properties?.version?.$ref === '#/$defs/semver',
   'entry-schema.json 的 version 未引用 #/$defs/semver（旧内联正则结尾无 $，可尾部注入垃圾）');
ok(catalogSchema.$defs?.semver?.pattern === entrySchema.$defs?.semver?.pattern,
   '两份 schema 的 semver 正则不一致（防一侧收紧一侧漂移）');
// 负向探针：直接拿 schema 里真实声明的 pattern 反证其严格性，防有人把 ref 改回弱正则。
if (semverRe) {
  for (const bad of ['1.0.1garbage', '1.0.1;rm -rf /', '01.2.3', '1.0.1-', '1.0.1+']) {
    ok(!semverRe.test(bad), `semver 正则不应接受非法版本 ${bad}`);
  }
}

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
// 重复 id / 重复 path 会让 App 安装到错误插件或互相覆盖；三方一致性表也会静默合并条目。
// 显式断言一次，避免将来两个索引同步写重时漏网。
const catIdsAll = (catalog.entries ?? []).map(e => e.id);
const catPathsAll = (catalog.entries ?? []).map(e => e.path);
ok(new Set(catIdsAll).size === catIdsAll.length, 'catalog.entries 存在重复 id');
ok(new Set(catPathsAll).size === catPathsAll.length, 'catalog.entries 存在重复 path');
for (const e of catalog.entries ?? []) {
  const tag = e.id ?? '(无 id)';
  ok(['id','name','version','type'].every(k => typeof e[k] === 'string' && e[k].length > 0), `${tag} 缺必填字段`);
  ok(idRe.test(e.id ?? ''), `${tag} 的 id 不合法`);
  ok(isSemver(e.version), `${tag} 的 version(${e.version}) 不是合法 semver`);
  ok(['planned','available','yanked'].includes(e.packageStatus), `${tag} 缺合法 packageStatus`);
  // ⑤ 每条 entry 必须带合法 minVersion + revokedVersions
  ok(isSemver(e.minVersion), `${tag} 缺合法 minVersion（或不是 semver）`);
  ok(Array.isArray(e.revokedVersions), `${tag} 缺 revokedVersions 数组`);
  ok(Array.isArray(e.revokedVersions) && e.revokedVersions.every(isSemver),
     `${tag} 的 revokedVersions 含非法版本号`);
  ok(Array.isArray(e.revokedVersions) && new Set(e.revokedVersions).size === e.revokedVersions.length,
     `${tag} 的 revokedVersions 有重复项`);
  // 当前可安装版本若在撤销名单里，目录就是自相矛盾的（App 会广告一个自己禁止安装的版本）。
  ok(Array.isArray(e.revokedVersions) && !e.revokedVersions.some(r => stripBuild(r) === stripBuild(e.version)),
     `${tag} 当前 version(${e.version}) 落在自己的 revokedVersions 中（自我撤销）`);
  // 目录当前可安装版本不得低于自身地板（否则清单自相矛盾）
  ok(isSemver(e.version) && isSemver(e.minVersion) && compareCore(e.version, e.minVersion) >= 0,
     `${tag} 当前 version(${e.version}) 非法或低于自身 minVersion(${e.minVersion})`);
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
// App 只读 plugins.json、官网/徽章常读 catalog.json；repoVersion/updated 漂移会让
// 用户看到「仓库版本 1.0.4、索引仍写 1.0.1」这种自相矛盾的信息。这里按同一份真源守门。
ok(catalog.repoVersion === plugins.repoVersion,
   `两份索引 repoVersion 不一致：catalog=${catalog.repoVersion} plugins=${plugins.repoVersion}`);
ok(catalog.updated === plugins.updated,
   `两份索引 updated 不一致：catalog=${catalog.updated} plugins=${plugins.updated}`);
ok(typeof catalog.repoVersion === 'string' && catalog.repoVersion.length > 0,
   'catalog.repoVersion 缺失');
ok(typeof catalog.updated === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(catalog.updated),
   'catalog.updated 不是 YYYY-MM-DD');

// ⑤ 三方策略一致性：catalog.json / plugins.json / plugins/*/plugin.json 的
//    minVersion 与 revokedVersions 必须逐 id 相同（漏改任一入口都会在此暴露）。
console.log('=== 禁止回滚策略：三方一致性（catalog / plugins.json / plugin.json） ===');
const catById = Object.fromEntries((catalog.entries ?? []).map(e => [e.id, e]));
const pluginList = plugins.plugins ?? plugins.entries ?? [];
ok(new Set(pluginList.map(p => p.id)).size === pluginList.length, 'plugins.json 存在重复 id');
for (const p of pluginList) {
  const tag = p.id ?? '(无 id)';
  const c = catById[p.id];
  ok(!!c, `${tag} 在 catalog.json 中无对应条目`);
  if (!c) continue;
  // 身份/版本/类型必须逐 id 完全一致：此前只比 minVersion/revokedVersions，
  // 把 plugin.json 的 id 改成 spoofed-id、version 改成 9.9.9、type 改成 rootfs 都仍是 58/0 假绿。
  ok(isSemver(p.version), `${tag} plugins.json 缺合法 version`);
  ok(p.version === c.version, `${tag} plugins.json.version(${p.version}) != catalog.version(${c.version})`);
  ok(p.type === c.type, `${tag} plugins.json.type(${p.type}) != catalog.type(${c.type})`);
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
    ok(isSemver(pj.version), `${tag} ${pjPath} 缺合法 version`);
    ok(pj.id === c.id, `${tag} ${pjPath}.id(${pj.id}) != catalog.id(${c.id})（防包内清单冒名）`);
    ok(pj.version === c.version, `${tag} ${pjPath}.version(${pj.version}) != catalog.version(${c.version})`);
    ok(pj.type === c.type, `${tag} ${pjPath}.type(${pj.type}) != catalog.type(${c.type})`);
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
