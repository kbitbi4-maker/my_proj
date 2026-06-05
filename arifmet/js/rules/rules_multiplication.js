// version: v1.1
export const MULTIPLICATION_RULES = [
    {
        id: "multi_win",
        match: (ctx) => ctx.operation === '×' && ctx.isFullySolved,
        config: (ctx) => ({
            layout: "monster-scene", status: "win", sound: "alien_win",
            monsters: ctx.math.monsters, items: ctx.math.items, mClass: "monster-happy",
            subtitleHTML: `<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;max-width:80px;background:#dcfce7;padding:4px 6px;border-radius:6px;border:1px dashed #22c55e;min-height:32px;align-items:center;"><span style="font-size:14px;color:#22c55e;font-weight:bold;animation:fadeIn 0.3s;">Ням-ням! 😋</span></div>`
        })
    },
    {
        id: "multi_sad",
        match: (ctx) => ctx.operation === '×' && ctx.isWrongAnswer,
        config: (ctx) => ({
            layout: "monster-scene", status: "sad", sound: "fail",
            monsters: ctx.math.monsters, items: ctx.math.items, mClass: "monster-sad",
            subtitleHTML: `<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;max-width:80px;background:#eff6ff;padding:4px 6px;border-radius:6px;border:1px dashed #60a5fa;min-height:32px;align-items:center;"><span class="tears-animation" style="font-size:22px;">💦</span></div>`
        })
    },
    {
        id: "multi_play",
        match: (ctx) => ctx.operation === '×',
        config: (ctx) => ({
            layout: "monster-scene", status: "play", sound: null,
            monsters: ctx.math.monsters, items: ctx.math.items, mClass: "", subtitleHTML: null
        })
    }
];
