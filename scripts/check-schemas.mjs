#!/usr/bin/env node
// 2026-11-11 全仓审计回归：零依赖 Schema 契约自测。
// 目的不是替代完整 JSON Schema 引擎，而是验证「规则本身没失效」：
//   ① catalog.schema.json / entry-schema.json 都带 integrity/signature/keyId 定义；
//   ② 两份定义的算法枚举与 moxsh-suite 规格保持同构（防对齐后又漂移）；
//   ③ catalog.json 每条 entry 满足必填、id 合法、packageStatus 与 sizeBytes 自洽；
//   ④ catalog.json 与 plugins.json 的插件 id 集合一致。
import { readFileSync } from 'node:fs';
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

console.log('=== Schema 规则自测 ===');
const catProps = catalogSchema.$defs?.entry?.properties ?? {};
ok(!!catProps.integrity, 'catalog.schema.json 的 entry 缺 integrity');
ok(!!catProps.signingKeyId, 'catalog.schema.json 的 entry 缺 signingKeyId');
ok(!!catalogSchema.$defs?.integrity, 'catalog.schema.json 缺 $defs.integrity');
ok(Array.isArray(entrySchema.required) && ['id','name','version','type'].every(k => entrySchema.required.includes(k)),
   'entry-schema.json 未强制 .mox manifest 的 id/name/version/type');
ok(!!entrySchema.properties?.integrity, 'entry-schema.json 缺 integrity');
ok(!!entrySchema.$defs?.integrity, 'entry-schema.json 缺 $defs.integrity');

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
  if (e.packageStatus === 'planned') {
    ok(e.sizeBytes === 0, `${tag} 标记 planned 却写了非 0 的 sizeBytes（禁止伪造包体积）`);
  }
  if (e.packageStatus === 'available') {
    ok(e.sizeBytes > 0, `${tag} 标记 available 却 sizeBytes=0`);
    ok(!!e.integrity?.checksum, `${tag} 已发布却缺 integrity.checksum`);
    ok(!!e.integrity?.signature, `${tag} 已发布却缺 integrity.signature`);
  }
}

console.log('=== catalog / plugins 索引一致性 ===');
const catIds = (catalog.entries ?? []).map(e => e.id).sort();
const plugIds = (plugins.plugins ?? plugins.entries ?? []).map(e => e.id).sort();
ok(JSON.stringify(catIds) === JSON.stringify(plugIds),
   `两份索引 id 集合不一致：catalog=[${catIds}] plugins=[${plugIds}]`);

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
