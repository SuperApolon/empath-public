// プロトB：入場（ポストURL）・ローカルプール・抽選ルール
export const KEYS = { custom: 'empath.customPool.v1', pool: 'empath.pool.v1', me: 'empath.me.v1', hist: 'empath.drawHistory.v1', demo: 'empath.demoPool.v2' };
export const COOLDOWN_MS = 60 * 60 * 1000;   // 再抽選クールダウン60分
export const RECENT_EXCLUDE = 3;              // 直近3回に出た相手は除外
export const MAX_OTHERS = 7;                  // 自分を含む合計8名＝自分＋最大7
export const MAX_TOTAL = MAX_OTHERS + 1;

const STATUS_RE = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status(?:es)?\/(\d{5,25})(?:[/?#].*)?$/;
export function parsePostUrl(raw) {
  const m = STATUS_RE.exec(String(raw).trim());
  if (!m || ['i', 'intent', 'home', 'search'].includes(m[1].toLowerCase())) return null;
  return { handle: m[1], id: m[2], url: `https://x.com/${m[1]}/status/${m[2]}` };
}

const st = () => globalThis.localStorage;
const get = (k, d) => { try { return JSON.parse(st().getItem(k)) ?? d; } catch { return d; } };
const set = (k, v) => st().setItem(k, JSON.stringify(v));

export const loadPool = () => get(KEYS.pool, []);
export const getMe = () => get(KEYS.me, null);
export const demoOn = () => get(KEYS.demo, false);
export const setDemo = v => set(KEYS.demo, !!v);
export const loadHistory = () => get(KEYS.hist, []);

/** 入場：{displayName, postUrl, enteredAt, hasCard}。同一ポストは上書き。asMe=true なら自分として記録 */
export function enter({ displayName, postUrl, hasCard = false }, asMe = true, now = Date.now()) {
  const p = parsePostUrl(postUrl);
  if (!p) throw new Error('x.com / twitter.com の status URL を貼ってください');
  const name = String(displayName || '').trim() || '@' + p.handle;
  const pool = loadPool().filter(e => e.postUrl !== p.url);
  const entry = { id: 'post:' + p.id, displayName: name, postUrl: p.url, enteredAt: now, hasCard: !!hasCard };
  pool.push(entry); set(KEYS.pool, pool);
  if (asMe) set(KEYS.me, entry.id);
  return entry;
}
export function removeEntry(id) { set(KEYS.pool, loadPool().filter(e => e.id !== id)); if (getMe() === id) st().removeItem(KEYS.me); }

export function cooldownLeft(now = Date.now(), hist = loadHistory()) {
  const last = hist.at(-1); return last ? Math.max(0, last.at + COOLDOWN_MS - now) : 0;
}

/**
 * 抽選（指定不可・ランダム）。candidates から selfId を除き、直近3回の相手を除外、
 * カード付き(hasCard)は重み2で優先。1〜4人。クールダウン中は {wait} を返す。
 */
export function draw(selfId, candidates, { now = Date.now(), rand = Math.random, hist = loadHistory(), save = true } = {}) {
  const wait = cooldownLeft(now, hist);
  if (wait > 0) return { wait };
  const recent = new Set(hist.slice(-RECENT_EXCLUDE).flatMap(h => h.ids));
  let pool = candidates.filter(c => c.id !== selfId && !recent.has(c.id));
  if (!pool.length) return { picked: [], reason: '除外後に相手がいません（直近3回除外）' };
  const n = Math.min(pool.length, 1 + Math.floor(rand() * MAX_OTHERS));
  const picked = [];
  while (picked.length < n) {
    const tot = pool.reduce((s, c) => s + (c.hasCard ? 2 : 1), 0);
    let r = rand() * tot, i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].hasCard ? 2 : 1; if (r < 0) break; }
    picked.push(pool[i]); pool = pool.filter((_, j) => j !== i);
  }
  if (save) set(KEYS.hist, [...hist, { at: now, ids: picked.map(p => p.id) }].slice(-20));
  return { picked };
}

// ---- プレイヤー登録プール（画像＋名前・この端末の localStorage のみ） ----
export const loadCustom = () => get(KEYS.custom, []);
export function addCustom({ name, img }, now = Date.now()) {
  const n = String(name || '').trim();
  if (!n) throw new Error('名前を入力してください');
  if (!img) throw new Error('画像を選んでください');
  const e = { id: 'custom:' + now.toString(36) + Math.random().toString(36).slice(2, 6), name: n, img, custom: true, addedAt: now };
  set(KEYS.custom, [...loadCustom(), e]);  // 容量超過時は setItem が例外を投げる
  return e;
}
export const removeCustom = id => set(KEYS.custom, loadCustom().filter(e => e.id !== id));
/** 選択人数チェック：自分を含め合計 MAX_TOTAL 以下 */
export const withinLimit = othersCount => othersCount + 1 <= MAX_TOTAL;
