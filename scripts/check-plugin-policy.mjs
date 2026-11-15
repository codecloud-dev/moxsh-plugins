#!/usr/bin/env node
// 插件「禁止回滚」策略校验（零依赖，node 直接跑）：
//   node scripts/check-plugin-policy.mjs
//
// 本文件是两套东西：
//  ① PluginVersionPolicy 的「可执行参考实现」——与 moxsh-terminal 生产代码
//     `PluginVersionPolicy.kt` 逐行同构（semver 比较 / revoked 命中 / minVersion
//     地板 / 版本单调 / 隔离判定）。它跑在校验层，用来验证「规则本身没写错」。
//  ② 一组真能跑的断言，绑定到本仓库真实的 catalog.json 策略值，证明：
//       · 回滚到 revoked 版本被拒
//       · 回滚到低于 minVersion 被拒
//       · 升级通过
//     另外覆盖版本单调、同版本重装、全新安装、revoked 改写绕过、预发布、
//     非法版本、隔离判定等边界。
//
// 说明：生产运行时由 Kotlin 侧的 PluginVersionPolicy.evaluate 强制执行；
// 这里的参考实现 + catalog.json 数据 + 断言共同构成「清单→校验→运行时」闭环的可执行证据。
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

// ---------------------------------------------------------------------------
// ① 参考实现（与 PluginVersionPolicy.kt 逐行对应）
// ---------------------------------------------------------------------------

/** 解析 semver 2.0.0；非法返回 null。构建元数据(+...)不参与优先级比较。 */
function parseSemver(input) {
  if (typeof input !== 'string') return null;
  let s = input.trim();
  if (s.length === 0) return null;

  // 拆构建元数据：+ 后必须非空、且只允许 [0-9A-Za-z-] 与点分隔
  let withoutBuild = s;
  const plus = s.indexOf('+');
  if (plus >= 0) {
    withoutBuild = s.slice(0, plus);
    const build = s.slice(plus + 1);
    if (build.length === 0 || !/^[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*$/.test(build)) return null;
  }

  // 拆预发布：- 后必须非空
  let core = withoutBuild;
  let preStr = null;
  const dash = withoutBuild.indexOf('-');
  if (dash >= 0) {
    core = withoutBuild.slice(0, dash);
    preStr = withoutBuild.slice(dash + 1);
    if (preStr.length === 0) return null;
  }

  const parts = core.split('.');
  if (parts.length < 1 || parts.length > 3) return null;
  const nums = [0, 0, 0];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!/^\d+$/.test(p)) return null;
    if (p.length > 1 && p[0] === '0') return null; // 禁止前导零
    const n = Number(p);
    if (!Number.isSafeInteger(n)) return null;
    nums[i] = n;
  }

  const pre = [];
  if (preStr !== null) {
    for (const id of preStr.split('.')) {
      if (id.length === 0 || !/^[0-9A-Za-z-]+$/.test(id)) return null;
      if (/^\d+$/.test(id) && id.length > 1 && id[0] === '0') return null; // 数字标识符禁前导零
      pre.push(id);
    }
  }
  return { major: nums[0], minor: nums[1], patch: nums[2], pre };
}

/** semver 优先级比较：a<b 返回 -1，a>b 返回 1，相等返回 0；任一非法返回 null。 */
function compare(a, b) {
  const va = parseSemver(a);
  const vb = parseSemver(b);
  if (va === null || vb === null) return null;
  for (const k of ['major', 'minor', 'patch']) {
    if (va[k] < vb[k]) return -1;
    if (va[k] > vb[k]) return 1;
  }
  const pa = va.pre, pb = vb.pre;
  if (pa.length === 0 && pb.length === 0) return 0;
  if (pa.length === 0) return 1; // 正式版 > 预发布版
  if (pb.length === 0) return -1;
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    if (i >= pa.length) return -1; // 标识符更少者优先级更低
    if (i >= pb.length) return 1;
    const ia = pa[i], ib = pb[i];
    const na = /^\d+$/.test(ia), nb = /^\d+$/.test(ib);
    if (na && nb) {
      // 数字标识符（已无前导零）：长度不同长者更大，长度相同按字典序（等价数值序）。
      // 与 Kotlin PluginVersionPolicy.compareNumericId 逐行对应，避免超大数字精度问题。
      if (ia.length !== ib.length) return ia.length < ib.length ? -1 : 1;
      if (ia < ib) return -1;
      if (ia > ib) return 1;
    } else if (na && !nb) return -1; // 数字标识符 < 含字母标识符
    else if (!na && nb) return 1;
    else {
      if (ia < ib) return -1;
      if (ia > ib) return 1;
    }
  }
  return 0;
}

/** 版本命中撤销名单：精确串相等 或 semver 优先级相等（防 `1.0.0+build` 改写绕过）。 */
function isRevoked(version, revoked) {
  return revoked.some((r) => version === r || compare(version, r) === 0);
}

/** 单个版本是否满足「最低版本 + 撤销名单」。 */
function checkVersionAgainstPolicy(version, min, revoked) {
  if (parseSemver(version) === null) {
    return { ok: false, reason: 'INVALID_VERSION', detail: `版本 "${version}" 非法或缺失` };
  }
  if (isRevoked(version, revoked)) {
    return { ok: false, reason: 'REVOKED', detail: `版本 "${version}" 在撤销名单中` };
  }
  if (min !== null && min !== undefined && String(min).trim() !== '') {
    const c = compare(version, min);
    if (c === null) {
      // 策略本身损坏：安全特性 fail-closed，拒绝安装而不是放行
      return { ok: false, reason: 'INVALID_VERSION', detail: `minVersion "${min}" 非法，策略 fail-closed` };
    }
    if (c < 0) {
      return { ok: false, reason: 'BELOW_MIN_VERSION', detail: `版本 "${version}" 低于最低允许版本 "${min}"` };
    }
  }
  return { ok: true, reason: 'ALLOW' };
}

/**
 * 安装/覆盖决策：把 candidate 安装到 installed 所在位置是否允许。
 * 优先级：非法版本 → revoked → 低于 minVersion → 版本单调（不得用更旧版本覆盖）。
 */
function evaluate(candidate, min, revoked, installed) {
  const base = checkVersionAgainstPolicy(candidate, min, revoked);
  if (!base.ok) return { allowed: false, reason: base.reason, detail: base.detail };
  const hasInstalled = installed !== null && installed !== undefined && String(installed).trim() !== '';
  if (hasInstalled) {
    const c = compare(candidate, installed);
    if (c === null) {
      // 已装版本无法解析：候选已通过 min/revoked 门槛，属可信修复安装，放行
      // 但记录说明「跳过单调门」，避免与真正校验过的升级混淆。
      return { allowed: true, reason: 'ALLOW', detail: `已装版本 "${installed}" 无法解析，跳过单调门（候选已过策略）` };
    }
    if (c < 0) {
      return { allowed: false, reason: 'DOWNGRADE', detail: `版本 "${candidate}" 低于已装版本 "${installed}"，禁止回滚/降级覆盖` };
    }
  }
  return { allowed: true, reason: 'ALLOW', detail: '允许安装（升级 / 同版本重装 / 全新安装）' };
}

/** 隔离判定：已装版本是否违规（命中撤销 / 低于地板 / 非法 → 必须停用并强制升级）。 */
function evaluateInstalled(installed, min, revoked) {
  const r = checkVersionAgainstPolicy(installed, min, revoked);
  return { compliant: r.ok, reason: r.reason, detail: r.detail || '合规' };
}

// ---------------------------------------------------------------------------
// ② 断言框架
// ---------------------------------------------------------------------------
let pass = 0, fail = 0;
function check(cond, label, extra = '') {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}${extra ? '  ' + extra : ''}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}${extra ? '  ' + extra : ''}`);
  }
}
function verdict(v) {
  return `allowed=${v.allowed} reason=${v.reason}${v.detail ? ' · ' + v.detail : ''}`;
}
function compliance(v) {
  return `compliant=${v.compliant} reason=${v.reason}${v.detail ? ' · ' + v.detail : ''}`;
}

// ---------------------------------------------------------------------------
// 读取真实 catalog.json 的策略值（绑定到真实数据，而非硬编码）
// ---------------------------------------------------------------------------
console.log('=== 读取真实 catalog.json 策略 ===');
const catalog = readJson('catalog.json');
const policyOf = (id) => {
  const e = (catalog.entries || []).find((x) => x.id === id);
  if (!e) throw new Error(`catalog.json 找不到插件 ${id}`);
  return { version: e.version, minVersion: e.minVersion, revokedVersions: e.revokedVersions };
};
const hello = policyOf('hello-mox');
const glass = policyOf('glass-terminal-theme');
console.log(`  hello-mox            : version=${hello.version} minVersion=${hello.minVersion} revoked=[${hello.revokedVersions}]`);
console.log(`  glass-terminal-theme : version=${glass.version} minVersion=${glass.minVersion} revoked=[${glass.revokedVersions}]`);
check(parseSemver(hello.minVersion) !== null, 'hello-mox.minVersion 是合法 semver');
check(Array.isArray(hello.revokedVersions) && hello.revokedVersions.every((r) => parseSemver(r) !== null),
  'hello-mox.revokedVersions 全部是合法 semver');
check(Array.isArray(glass.revokedVersions) && glass.revokedVersions.every((r) => parseSemver(r) !== null),
  'glass-terminal-theme.revokedVersions 全部是合法 semver');
// 目录当前可安装版本必须自身合规（否则清单自相矛盾）
check(hello.minVersion === undefined || compare(hello.version, hello.minVersion) >= 0,
  `hello-mox 当前版本 ${hello.version} 不低于 minVersion ${hello.minVersion}`);

// ---------------------------------------------------------------------------
// 三条安全断言（最关键，绑定 hello-mox 的真实策略）
// ---------------------------------------------------------------------------
console.log('\n=== 三条安全断言（PluginVersionPolicy.evaluate，真实 catalog 策略） ===');
const MIN = hello.minVersion;
const REV = hello.revokedVersions;
const INSTALLED = hello.version;

// 断言 1：回滚到 revoked 版本被拒
{
  const cand = '1.0.0'; // 命中 hello-mox.revokedVersions[0]
  const v = evaluate(cand, MIN, REV, INSTALLED);
  check(!v.allowed && v.reason === 'REVOKED',
    '断言1 回滚到 revoked 版本被拒', `[candidate=${cand} installed=${INSTALLED}] → ${verdict(v)}`);
}
// 断言 2：回滚到低于 minVersion 被拒（0.9.9 < 1.0.1，且不在撤销名单里 → 专门验证地板门）
{
  const cand = '0.9.9';
  const v = evaluate(cand, MIN, REV, INSTALLED);
  check(!isRevoked(cand, REV), '断言2 前置：0.9.9 不在撤销名单（确保测的是 minVersion 门而非 revoked 门）');
  check(!v.allowed && v.reason === 'BELOW_MIN_VERSION',
    '断言2 回滚到低于 minVersion 被拒', `[candidate=${cand} minVersion=${MIN}] → ${verdict(v)}`);
}
// 断言 3：升级通过
{
  const cand = '1.1.0';
  const v = evaluate(cand, MIN, REV, INSTALLED);
  check(v.allowed && v.reason === 'ALLOW',
    '断言3 升级通过', `[candidate=${cand} installed=${INSTALLED}] → ${verdict(v)}`);
}

// ---------------------------------------------------------------------------
// 扩展向量表：逐行擦核心逻辑
// ---------------------------------------------------------------------------
console.log('\n=== 扩展向量表（semver / 单调 / 绕过 / 边界） ===');
// [标签, candidate, min, revoked, installed, 期望 allowed, 期望 reason]
const vectors = [
  ['全新安装 revoked 版本也被拒', '1.0.0', '1.0.1', ['1.0.0'], null, false, 'REVOKED'],
  ['版本单调：低于已装但≥min 也拒(DOWNGRADE)', '1.0.2', '1.0.1', ['1.0.0'], '1.2.0', false, 'DOWNGRADE'],
  ['同版本重装通过', '1.0.1', '1.0.1', ['1.0.0'], '1.0.1', true, 'ALLOW'],
  ['全新安装当前版本通过', '1.0.1', '1.0.1', ['1.0.0'], null, true, 'ALLOW'],
  ['revoked 改写 build 元数据绕过被拒', '1.0.0+build.7', '1.0.1', ['1.0.0'], '1.0.1', false, 'REVOKED'],
  ['revoked 改写省略 patch 绕过被拒', '1.0', '1.0.1', ['1.0.0'], '1.0.1', false, 'REVOKED'],
  ['预发布低于正式版被 minVersion 拦截', '1.0.1-rc.1', '1.0.1', ['1.0.0'], null, false, 'BELOW_MIN_VERSION'],
  ['非法版本被拒', 'not.a.version', '1.0.1', ['1.0.0'], null, false, 'INVALID_VERSION'],
  ['minVersion 非法 → fail-closed 拒绝', '1.2.0', 'garbage', ['1.0.0'], null, false, 'INVALID_VERSION'],
  ['glass 主题 0.9.2(第二个 revoked)被拒', '0.9.2', glass.minVersion, glass.revokedVersions, glass.version, false, 'REVOKED'],
  ['glass 主题 1.0.1→1.2.0 升级通过', '1.2.0', glass.minVersion, glass.revokedVersions, glass.version, true, 'ALLOW'],
];
for (const [label, cand, min, rev, installed, wantAllowed, wantReason] of vectors) {
  const v = evaluate(cand, min, rev, installed);
  check(v.allowed === wantAllowed && v.reason === wantReason, label,
    `[candidate=${cand}] → 期望 ${wantAllowed}/${wantReason}，实际 ${verdict(v)}`);
}

// semver 比较器本身的正确性
console.log('\n=== semver 比较器单元校验 ===');
const cmpCases = [
  ['1.0.0', '1.0.1', -1],
  ['1.2.0', '1.1.9', 1],
  ['1.0.0', '1.0.0', 0],
  ['1.0.0-alpha', '1.0.0', -1],
  ['1.0.0-alpha.1', '1.0.0-alpha.beta', -1],
  ['1.0.0-beta', '1.0.0-beta.2', -1],
  ['1.0.0+build1', '1.0.0+build2', 0], // 构建元数据不参与比较
  ['1.0', '1.0.0', 0],
  ['1.0.0-rc.1', '1.0.0', -1],
];
for (const [a, b, want] of cmpCases) {
  const got = compare(a, b);
  check(got === want, `compare(${a}, ${b}) = ${want}`, `(实际 ${got})`);
}
check(compare('bad', '1.0.0') === null, 'compare 非法版本返回 null');
check(parseSemver('01.2.3') === null, 'parse 拒绝前导零核心段');
check(parseSemver('1.2.3-01') === null, 'parse 拒绝前导零预发布数字标识符');
check(parseSemver('1.2.3+') === null, 'parse 拒绝空构建元数据');

// ---------------------------------------------------------------------------
// 隔离判定（本地已装旧漏洞版 → 必须停用 / 强制升级）
// ---------------------------------------------------------------------------
console.log('\n=== 隔离停用判定（evaluateInstalled，真实 catalog 策略） ===');
{
  const r1 = evaluateInstalled('1.0.0', MIN, REV);          // 命中 revoked
  check(!r1.compliant && r1.reason === 'REVOKED', '已装 1.0.0(漏洞版) → 判定违规需隔离', compliance(r1));
  const r2 = evaluateInstalled('0.9.9', MIN, REV);          // 低于地板
  check(!r2.compliant && r2.reason === 'BELOW_MIN_VERSION', '已装 0.9.9(低于地板) → 判定违规需隔离', compliance(r2));
  const r3 = evaluateInstalled('1.0.1', MIN, REV);          // 合规
  check(r3.compliant, '已装 1.0.1(合规版) → 不需隔离', compliance(r3));
  const r4 = evaluateInstalled(null, MIN, REV);             // 损坏/缺失 → fail-closed
  check(!r4.compliant, '已装版本缺失/损坏 → 判定违规需隔离(fail-closed)', compliance(r4));
}

// ---------------------------------------------------------------------------
console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
