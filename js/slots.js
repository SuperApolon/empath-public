// スロット座標（見本 1024x1024 から目測。比率で保持し、描画時に実寸へ掛ける）
export const CANVAS = 1024;
export const CARD = {
  bg: 'art/profile-card.jpg',
  avatar: { x: 168, y: 135, w: 692, h: 665, r: 28 },   // 窓（角丸）
  name:   { x: 205, y: 820, w: 620, h: 85, r: 22 },    // 名前帯
};
export const GROUP = {
  bg: 'art/group-photo-5.jpg',
  // 集合写真の背景候補（旧ランダム用。プレイヤー導線では templates を使う）。写真窓は空/光/桜のみ
  bgs: ['art/group-bg-01-sakura-sky.jpg', 'art/group-bg-02-golden-hour.jpg', 'art/group-bg-03-petal-storm.jpg',
    // 集合合成テンプレ6枚（cute3＋cool3）
    'art/group-tpl-cute-01-sakura.jpg',
    'art/group-tpl-cute-02-dusk-road.jpg',
    'art/group-tpl-cute-03-flower-field.jpg',
    'art/group-tpl-cool-01-neon-rain.jpg',
    'art/group-tpl-cool-02-rooftop-stars.jpg',
    'art/group-tpl-cool-03-backlit-sea.jpg'],
  photo:   { x: 70, y: 138, w: 885, h: 700, r: 18 },   // 写真窓（ここを塗り直す）
  caption: { x: 52, y: 848, w: 920, h: 136, r: 18 },          // キャプション＋タグ帯
  // 人数ごとの円スロット（cx, cy, r）。見本の5人の顔位置に準拠
  layouts: {
    2: [[360, 470, 170], [664, 470, 170]],
    3: [[250, 500, 140], [512, 430, 150], [774, 500, 140]],
    4: [[190, 520, 115], [390, 400, 120], [634, 400, 120], [834, 520, 115]],
    5: [[165, 470, 100], [360, 330, 100], [530, 500, 105], [690, 310, 100], [865, 470, 100]],
    // 6〜8人：2段組み。円＋名前が写真窓（x70–955, y138–838）内に収まり重ならない配置
    6: [[230, 330, 95], [512, 330, 95], [794, 330, 95], [230, 610, 95], [512, 610, 95], [794, 610, 95]],
    7: [[270, 320, 88], [512, 320, 88], [754, 320, 88], [170, 600, 88], [390, 600, 88], [634, 600, 88], [854, 600, 88]],
    8: [[170, 320, 85], [390, 320, 85], [634, 320, 85], [854, 320, 85], [170, 600, 85], [390, 600, 85], [634, 600, 85], [854, 600, 85]],
  },
  // プレイヤーが選ぶ背景テンプレ（cute3＋cool3）。ランダム抽選はしない
  templates: [
    { id: 'cute-01', kind: 'cute', label: 'cute：桜', src: 'art/group-tpl-cute-01-sakura.jpg' },
    { id: 'cute-02', kind: 'cute', label: 'cute：夕暮れの道', src: 'art/group-tpl-cute-02-dusk-road.jpg' },
    { id: 'cute-03', kind: 'cute', label: 'cute：花畑', src: 'art/group-tpl-cute-03-flower-field.jpg' },
    { id: 'cool-01', kind: 'cool', label: 'cool：ネオンの雨', src: 'art/group-tpl-cool-01-neon-rain.jpg' },
    { id: 'cool-02', kind: 'cool', label: 'cool：屋上の星', src: 'art/group-tpl-cool-02-rooftop-stars.jpg' },
    { id: 'cool-03', kind: 'cool', label: 'cool：逆光の海', src: 'art/group-tpl-cool-03-backlit-sea.jpg' },
  ],
};
