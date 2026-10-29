import { CANVAS, CARD, GROUP } from './slots.js';
import * as E from './entry.js';
export const TAGS = ['#EMPATH', '#共鳴'];
export const ENTRY_PHRASE = 'EMPATHはじめる。';
const DEFAULT_EVENT = '言えなかった夜の話';
// 初期プール：ORRERY QUBIT 19名。canvas合成は raw/（枠なし）を使う＝二重枠防止
export const ORRERY = [
  ['setsuna', 'セツナ'], ['toua', 'トワ'], ['alice', 'アリス'], ['cloud', 'クラウド'], ['zex', 'ゼクス'],
  ['lux', 'ルクス'], ['featherio', 'フェザリオ'], ['mira', 'ミラ'], ['signa', 'シグナ'], ['sona', 'ソナ'],
  ['toria', 'トリア'], ['kanata', 'カナタ'], ['tetra', 'テトラ'], ['harbor', 'ハーバー'], ['super_apollon', '超アポロン'],
  ['choco', 'チョコ'], ['shiori', 'シオリ'], ['wizcraft', 'Wizcraft'], ['mouse', 'マウス'],
].map(([slug, name]) => ({ id: 'orrery:' + slug, slug, name, img: `art/pool/raw/${slug}.jpg`, card: `art/pool/cards/card-${slug}.jpg`, orrery: true }));
// デモ用ダミー：「デモ用ダミープールも含める」ON のときだけ追加
const DUMMY = [
  { name: 'ミナト', img: 'art/avatar-diversity-02-ash-blond-masc.jpg' },
  { name: 'ヒカリ', img: 'art/avatar-diversity-01-warm-brunette.jpg' },
  { name: 'ソラ', img: 'art/avatar-diversity-04-black-hair-masc.jpg' },
  { name: 'ユイ', img: 'art/avatar-diversity-03-lavender.jpg' },
  { name: 'ハルカ', img: 'art/profile-avatar.jpg' },
  { name: 'アオ' }, // img なし→テンプレ割り当て
].map((p, i) => ({ ...p, id: 'dummy:' + i, dummy: true }));
// 旧：自動キャプション（プレイヤー合成では使わない・互換のため残す）
export function caption(names, ev = DEFAULT_EVENT) {
  const others = names.slice(1);
  if (others.length === 0) return '';
  return others.length === 1 ? `${others[0]}さんと、${ev}をして撮った一枚。` : `${others[0]}さんたちと、${ev}をして撮った一枚。`;
}
const cache = {};
const load = src => cache[src] ??= new Promise((ok, ng) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ng; i.src = src; });
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function cover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}
// img なし時のフォールバック：頭文字グラデは廃止し、人物テンプレ6枚から1枚割り当て。
// 方針：p.gender が 'f'/'m' ならその性別の3枚から、未指定なら6枚全体から、名前ハッシュ(FNV-1a)で選ぶ
// （同じ名前なら常に同じ画像で安定。名前から性別は推定しない）。
const AVATAR_TPL = { f: [1, 2, 3].map(i => `art/avatar-templates/avatar-f-0${i}.jpg`), m: [1, 2, 3].map(i => `art/avatar-templates/avatar-m-0${i}.jpg`) };
function nameHash(s) { let h = 0x811c9dc5; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h; }
export function fallbackAvatar(p) {
  const list = AVATAR_TPL[p.gender] ?? [...AVATAR_TPL.f, ...AVATAR_TPL.m];
  return list[nameHash(p.name ?? p.id ?? '') % list.length];
}
async function drawAvatar(ctx, p, x, y, w, h) {
  return cover(ctx, await load(p.img || fallbackAvatar(p)), x, y, w, h);
}
// 非同期描画中に別描画が走ると表示キャンバスが途中状態になる→オフスクリーンで描いてから一括反映
function commit(cv, off) { cv.width = cv.height = CANVAS; cv.getContext('2d').drawImage(off, 0, 0); }
const offscreen = () => { const c = document.createElement('canvas'); c.width = c.height = CANVAS; return c; };
export async function drawCard(cv, p) { const off = offscreen(); await drawCardTo(off, p); commit(cv, off); }
export async function drawGroup(cv, people, opt = {}) { const off = offscreen(); await drawGroupTo(off, people, opt); commit(cv, off); cv.dataset.bg = off.dataset.bg; }
async function drawCardTo(cv, p) {
  const ctx = cv.getContext('2d');
  ctx.drawImage(await load(CARD.bg), 0, 0, CANVAS, CANVAS);
  const a = CARD.avatar; ctx.save(); rr(ctx, a.x, a.y, a.w, a.h, a.r); ctx.clip(); await drawAvatar(ctx, p, a.x, a.y, a.w, a.h); ctx.restore();
  const n = CARD.name; ctx.fillStyle = 'rgba(248,246,255,.97)'; rr(ctx, n.x, n.y, n.w, n.h, n.r); ctx.fill();
  ctx.fillStyle = '#1c2340'; ctx.font = '600 52px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`「${p.name}」`, n.x + n.w / 2, n.y + n.h / 2 + 2);
}
// 旧：抽選ごとに背景をランダム選択（プレイヤー導線では使わない・互換のため残す）
let lastBg = null;
export function pickGroupBg(list = GROUP.bgs) {
  const pool = list.length > 1 ? list.filter(b => b !== lastBg) : list;
  lastBg = pool[Math.floor(Math.random() * pool.length)]; return lastBg;
}
// 文言を帯幅で折り返し（最大 maxLines 行、超過は…）
export function wrapLines(ctx, text, maxW, maxLines = 2) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const ch of para) { if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; }
    out.push(line);
  }
  const lines = out.filter((l, i) => l || i === 0);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…'; }
  return lines;
}
/** opt.bg：プレイヤーが選んだ背景（未指定なら先頭テンプレ）／opt.text：プレイヤー入力の全文（自動文は使わない） */
async function drawGroupTo(cv, people, { bg = GROUP.templates[0].src, text = '' } = {}) {
  const ctx = cv.getContext('2d');
  cv.dataset.bg = bg;
  ctx.drawImage(await load(bg), 0, 0, CANVAS, CANVAS);
  const ph = GROUP.photo; ctx.save(); rr(ctx, ph.x, ph.y, ph.w, ph.h, ph.r); ctx.clip();
  const small = people.length >= 6;
  for (const [i, [cx, cy, r]] of GROUP.layouts[people.length].entries()) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    await drawAvatar(ctx, people[i], cx - r, cy - r, r * 2, r * 2); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#1c2340'; ctx.font = `500 ${small ? 24 : 28}px sans-serif`; ctx.textAlign = 'center';
    // 暗い背景でも読めるよう白フチを付ける
    ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.92)';
    ctx.strokeText(people[i].name, cx, cy + r + 34, r * 2 + 30); ctx.fillText(people[i].name, cx, cy + r + 34, r * 2 + 30);
  }
  ctx.restore();
  // 背景画像の帯にはサンプル文言が焼き込まれているので、帯を不透明に塗ってから描く
  const c = GROUP.caption; ctx.fillStyle = '#faf8ff'; rr(ctx, c.x, c.y, c.w, c.h, c.r); ctx.fill();
  ctx.fillStyle = '#1c2340'; ctx.textAlign = 'center'; ctx.font = '500 28px serif';
  const lines = text.trim() ? wrapLines(ctx, text.trim(), c.w - 40, 2) : [];
  lines.forEach((l, i) => ctx.fillText(l, CANVAS / 2, c.y + (lines.length === 1 ? 52 : 38 + i * 34)));
  ctx.font = '500 24px sans-serif'; ctx.fillText(TAGS.join(' '), CANVAS / 2, c.y + 112);
}
export function intentUrl(text) {
  return 'https://x.com/intent/post?text=' + encodeURIComponent(`${text}\n${TAGS.join(' ')}`);
}
// ---- UI ----
if (typeof document !== 'undefined' && document.getElementById('pool')) {
  const $ = id => document.getElementById(id);
  // プール = ORRERY 19名＋入場済み（localStorage）＋プレイヤー登録（localStorage）＋（トグルONなら）ダミー
  function buildPool() {
    const entered = E.loadPool().map(e => ({ ...e, name: e.displayName }));
    const meId = E.getMe();
    let me = entered.find(e => e.id === meId) ?? ORRERY[0];
    if (customImg) me = { ...me, img: customImg };
    const others = [...E.loadCustom(), ...ORRERY.filter(o => o.id !== me.id), ...entered.filter(e => e.id !== me.id), ...(E.demoOn() ? DUMMY.filter(d => d.id !== me.id) : [])];
    return { me, others };
  }
  let customImg = null, cardReady = Promise.resolve(), groupReady = Promise.resolve();
  let bgSel = GROUP.templates[0].src;
  const selected = new Set();   // 選んだ相手の id（自分は含まない）
  const cardText = me => `${ENTRY_PHRASE}\n「${me.name}」のプロフィールカード`;
  // 背景テンプレ（cute/cool）をサムネで選ぶ
  function renderBgs() {
    const box = $('bgs'); box.innerHTML = '';
    for (const t of GROUP.templates) {
      const l = document.createElement('label'); l.className = 'bgopt';
      const r = document.createElement('input'); r.type = 'radio'; r.name = 'bg'; r.value = t.src; r.checked = t.src === bgSel;
      r.onchange = () => { bgSel = t.src; render(); };
      const im = document.createElement('img'); im.src = t.src; im.alt = t.label; im.width = 96; im.height = 96;
      l.append(r, im, document.createElement('br'), t.label); box.append(l);
    }
  }
  function renderPool() {
    const { me, others } = buildPool();
    $('me').textContent = me.orrery || me.dummy ? `${me.name}（初期プール・未入場）` : `${me.name}${me.hasCard ? ' ★' : ''}`;
    const ids = new Set(others.map(o => o.id));
    for (const id of [...selected]) if (!ids.has(id)) selected.delete(id);
    const ul = $('pool'); ul.innerHTML = '';
    for (const p of others) {
      const li = document.createElement('li');
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = selected.has(p.id);
      cb.onchange = () => {
        if (cb.checked && !E.withinLimit(selected.size + 1)) { cb.checked = false; $('limitMsg').textContent = `上限です：自分を含めて最大${E.MAX_TOTAL}名（相手は${E.MAX_OTHERS}人まで）`; return; }
        cb.checked ? selected.add(p.id) : selected.delete(p.id); $('limitMsg').textContent = ''; render();
      };
      const lab = document.createElement('label'); lab.append(cb, ` ${p.name}${p.custom ? '（登録）' : ''}${p.dummy ? '（デモ）' : ''}`); li.append(lab);
      if (p.postUrl) { const a = document.createElement('a'); a.href = p.postUrl; a.target = '_blank'; a.rel = 'noopener'; a.textContent = ' ポスト'; li.append(a); }
      if (p.custom || p.postUrl) {
        const b = document.createElement('button'); b.textContent = '削除';
        b.onclick = () => { p.custom ? E.removeCustom(p.id) : E.removeEntry(p.id); selected.delete(p.id); renderPool(); render(); };
        li.append(' ', b);
      }
      ul.append(li);
    }
    cardReady = drawCard($('card'), me).catch(err => { console.error(err); });
    $('postCard').href = intentUrl(cardText(me));
  }
  $('demoEnter').onclick = () => {
    const nm = ['あなた', 'ハル', 'ナギ', 'ツムギ'][Math.floor(Math.random() * 4)];
    const e = E.enter({ displayName: nm, postUrl: `https://x.com/empath_demo/status/${Date.now()}`, hasCard: true });
    E.setDemo(true); $('demo').checked = true;
    $('demoMsg').textContent = `入場しました：${e.displayName}（デモ）→ 下で背景・相手・文言を選んでください`; renderPool(); render();
  };
  $('avatarFile').onchange = e => { const f = e.target.files[0]; if (!f) return; customImg = URL.createObjectURL(f); renderPool(); render(); };
  $('entry').href = intentUrl(ENTRY_PHRASE);
  $('demo').checked = E.demoOn(); $('demo').onchange = e => { E.setDemo(e.target.checked); renderPool(); render(); };
  $('enter').onclick = () => {
    try {
      const e = E.enter({ displayName: $('name').value, postUrl: $('url').value, hasCard: $('hasCard').checked });
      $('msg').textContent = `入場しました：${e.displayName}`; $('url').value = ''; renderPool(); render();
    } catch (err) { $('msg').textContent = err.message; }
  };
  // プール登録：画像は 320px 角に縮小した JPEG dataURL で localStorage に保存
  const toDataUrl = f => new Promise((ok, ng) => {
    const u = URL.createObjectURL(f), im = new Image();
    im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 320; cover(c.getContext('2d'), im, 0, 0, 320, 320); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', 0.85)); };
    im.onerror = () => ng(new Error('画像を読み込めませんでした')); im.src = u;
  });
  $('regAdd').onclick = async () => {
    try {
      const f = $('regFile').files[0]; if (!f) throw new Error('画像を選んでください');
      const e = E.addCustom({ name: $('regName').value, img: await toDataUrl(f) });
      $('regMsg').textContent = `登録しました：${e.name}`; $('regName').value = ''; $('regFile').value = ''; renderPool();
    } catch (err) { $('regMsg').textContent = err.name === 'QuotaExceededError' ? '保存容量がいっぱいです（登録を削除してください）' : err.message; }
  };
  $('text').oninput = render;
  $('compose').onclick = render;
  async function render() {
    const { me, others } = buildPool();
    const picked = others.filter(o => selected.has(o.id));
    const people = [me, ...picked];   // 自分は常に先頭
    $('count').textContent = `${people.length}/${E.MAX_TOTAL}人`;
    $('picked').textContent = picked.map(p => p.name).join('・') || '—';
    const text = $('text').value;
    if (people.length < 2) { $('cap').textContent = 'プールから一緒に撮る相手を選んでください'; $('post').removeAttribute('href'); return; }
    groupReady = drawGroup($('group'), people, { bg: bgSel, text }); await groupReady;
    $('cap').textContent = text.trim() ? '' : '（文言は空です。下の欄に自由に書けます）';
    $('post').href = intentUrl(text.trim());
  }
  // PNG保存: 描画完了を待ち、toBlob→ObjectURL、<a>をDOMに追加してクリック（Firefox/大容量dataURL対策）
  const dl = (id, name, ready, msgId) => async () => {
    const say = t => { $(msgId).textContent = t; };
    try {
      await ready();
      const blob = await new Promise((ok, ng) => $(id).toBlob(b => b ? ok(b) : ng(new Error('画像を作れませんでした')), 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener';
      document.body.append(a); a.click(); a.remove();
      // iOS Safari等 download属性非対応なら新しいタブで開いて長押し保存
      if (!('download' in HTMLAnchorElement.prototype)) window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      say('PNGを保存しました（保存されない端末は画像を長押し）');
    } catch (err) { console.error(err); say('PNG保存に失敗：' + (err.name === 'SecurityError' ? 'ページを http(s) で開いてください' : err.message)); }
  };
  $('dlCard').onclick = dl('card', 'empath-card.png', () => cardReady, 'dlCardMsg');
  $('dlGroup').onclick = dl('group', 'empath-group.png', () => groupReady, 'dlGroupMsg');
  renderBgs(); renderPool(); render();
}
