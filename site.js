(function () {
const PG = window.PAGE || { id: "home", blocks: [] };
const NAV = [["home", "index.html"], ["about", "about.html"], ["now", "now.html"], ["blog", "blog.html"], ["projects", "projects.html"], ["degoogle", "degoogle.html"], ["contact", "contact.html"]];const cv = document.getElementById("c"), main = cv.getContext("2d");
let ctx = main;
const F = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
const NAME = "lowpolyphosphorus";
const C = { bone: "#efe9e6", ash: "#a8a09c", soot: "#6e6560", trace: "#3d2c27" };
// imperfect fire: hard, uneven bands
const HB = [[.14,"#d4200a"],[.22,"#ff3b12"],[.47,"#ff5a1f"],[.52,"#e8290b"],[.71,"#ff7a1a"],[.86,"#ff9a24"],[1,"#ffb02e"]];
const VB = [[.19,"#d4200a"],[.33,"#ff4a16"],[.58,"#ff6a1c"],[.81,"#ff8a20"],[1,"#ffb02e"]];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (a, v, b) => Math.max(a, Math.min(b, v));
const mk = () => { const c = document.createElement("canvas"); return [c, c.getContext("2d")]; };
const [sc, scc] = mk(), [ta, tac] = mk(), [nc, ncc] = mk();
const D = 800, RAD = Math.PI / 180;
let dpr = 1, W = 0, H = 0, PAD = 32, ops = [], hits = [], hov = -1, nameBox = null, skipName = false, t0 = performance.now();
let pageOn = false, overName = false, inWin = false, hE = 0, pE = 0, nrx = 0, nry = 0, prx = 0, pry = 0;
let mx = -1, my = -1, gx = .5, gy = .5, lx = 0, ly = 0, spd = 0, nnx = .5, nny = .5;

function bands(c, x0, y0, x1, y1, list) {
  const g = c.createLinearGradient(x0, y0, x1, y1); let p = 0;
  for (const [e, col] of list) { g.addColorStop(p, col); g.addColorStop(e, col); p = e; }
  return g;
}
function wrap(text, font, maxW) {
  main.font = font;
  const lines = []; let cur = "";
  for (const w of text.split(" ")) {
    const test = cur ? cur + " " + w : w;
    if (main.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function layout() {
  dpr = window.devicePixelRatio || 1;
  const vw = innerWidth; W = cv.clientWidth;
  const pad = PAD = clamp(28, vw * .07, 76), maxW = W - pad * 2;
  const ns = clamp(12.8, vw * .02, 16), nf = `400 ${ns}px ${F}`, nl = ns * 1.65;
  const ss = clamp(15, vw * .024, 20), sf = `400 ${ss}px ${F}`, sl = ss * 1.65;
  ops = []; hits = []; nameBox = null;

  // nav
  const fs = clamp(13, vw * .019, 16), ny = clamp(20, vw * .03, 30);
  main.font = `600 ${fs}px ${F}`;
  let x = pad, rowY = ny;
  const gap = clamp(18, vw * .03, 32), rowH = fs * 1.4 + 14;
  NAV.forEach(([label, href], i) => {
    const w = main.measureText(label).width;
    if (x + w > W - pad && x > pad) { x = pad; rowY += rowH; }
    ops.push({ k: "nav", label: label, x: x, y: rowY, w: w, fs: fs, on: label === PG.id, i: i });
    hits.push({ x: x - 6, y: rowY - 6, w: w + 12, h: fs * 1.4 + 12, href: href });
    x += w + gap;
  });
  let y = rowY + fs * 1.4 + 14;
  ops.push({ k: "rule", y: y });
  y += clamp(30, vw * .05, 48);

  // page blocks
  for (const b of PG.blocks) {
    if (b.t === "hero") {
      let hs = clamp(24, vw * .064, 52);
      main.font = `700 ${hs}px ${F}`;
      while (main.measureText(NAME).width > maxW && hs > 14) { hs--; main.font = `700 ${hs}px ${F}`; }
      const iw = main.measureText("I'm ").width, nw = main.measureText(NAME).width, lh = hs * 1.15;
      const one = iw + nw + hs * .5 + 8 <= maxW;
      nameBox = { x: pad + (one ? iw : 0), y: y + (one ? 0 : lh), w: nw, h: lh, hs: hs };
      ops.push({ k: "hero", y: y, hs: hs, one: one });
      y += lh * (one ? 1 : 2) + 12;
    } else if (b.t === "h") {
      const hs = clamp(28, vw * .05, 44), f = `700 ${hs}px ${F}`, ln = wrap(b.x, f, maxW);
      ops.push({ k: "text", ln: ln, f: f, c: C.bone, y: y, lh: hs * 1.15 });
      main.font = f;
      hits.push({ x: pad, y: y, w: Math.max.apply(null, ln.map(l => main.measureText(l).width)), h: ln.length * hs * 1.15, toggle: true });
      y += ln.length * hs * 1.15 + 14;
    } else if (b.t === "p" || b.t === "dim") {
      const ln = wrap(b.x, sf, Math.min(maxW, ss * .6 * 60));
      ops.push({ k: "text", ln: ln, f: sf, c: b.t === "p" ? C.ash : C.soot, y: y, lh: sl });
      y += ln.length * sl + 10;
    } else if (b.t === "list") {
      const dw = ns * .6 * (b.cols || 10) + 20;
      for (const it of b.items) {
        const ln = wrap(it.x, sf, maxW - dw), h = ln.length * sl;
        ops.push({ k: "row", d: it.d, ln: ln, y: y, dw: dw, sf: sf, nf: nf, sl: sl, nl: nl });
        if (it.href) hits.push({ x: pad, y: y - 4, w: maxW, h: h + 8, href: it.href });
        y += h + 10;
      }
    } else if (b.t === "link") {
      main.font = sf;
      const w = main.measureText(b.x).width;
      ops.push({ k: "link", x: b.x, y: y, w: w, f: sf, ss: ss });
      hits.push({ x: pad - 4, y: y - 4, w: w + 8, h: sl + 8, href: b.href });
      y += sl + 10;
    } else if (b.t === "box") {
      y += clamp(18, vw * .04, 40);
      const ln = wrap(b.x, nf, Math.min(maxW - 40, ns * .6 * 46));
      main.font = nf;
      const bw = Math.max.apply(null, ln.map(l => main.measureText(l).width)) + 40, bh = ln.length * nl + 32;
      if (b.go) ln.forEach((l, i) => {
        const k = l.indexOf(b.go.w);
        if (k >= 0) {
          main.font = nf;
          const gx0 = pad + 20 + main.measureText(l.slice(0, k)).width, gw = main.measureText(b.go.w).width;
          hits.push({ x: gx0 - 2, y: y + 16 + i * nl - 2, w: gw + 4, h: ns * 1.4, href: b.go.href });
        }
      });
      ops.push({ k: "box", ln: ln, hl: b.hl, y: y, bw: bw, bh: bh, nf: nf, nl: nl, ns: ns });
      y += bh;
    }
  }
  H = Math.ceil(y + pad);
  cv.style.height = (H + 2) + "px";
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  main.setTransform(dpr, 0, 0, dpr, 0, 0);
  sc.width = cv.width; sc.height = cv.height; scc.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function paint(t) {
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = "top"; ctx.textAlign = "left";
  for (const o of ops) {
    if (o.k === "nav") {
      const lit = o.on || hov === o.i;
      ctx.font = `600 ${o.fs}px ${F}`; ctx.fillStyle = lit ? C.bone : C.ash; ctx.fillText(o.label, o.x, o.y);
      if (lit) { ctx.fillStyle = bands(ctx, o.x, 0, o.x + o.w, 0, HB); ctx.fillRect(o.x, o.y + o.fs * 1.35, o.w, 2); }
    } else if (o.k === "rule") {
      ctx.setLineDash([4, 4]); ctx.strokeStyle = C.trace; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, o.y + .5); ctx.lineTo(W - PAD, o.y + .5); ctx.stroke(); ctx.setLineDash([]);
    } else if (o.k === "hero") {
      ctx.font = `700 ${o.hs}px ${F}`; ctx.fillStyle = C.bone; ctx.fillText(o.one ? "I'm " : "I'm", PAD, o.y);
      if (!skipName) { ctx.fillStyle = bands(ctx, nameBox.x, 0, nameBox.x + nameBox.w, 0, HB); ctx.fillText(NAME, nameBox.x, nameBox.y); }
      if (reduce || Math.floor(t / .55) % 2 === 0) {
        const cx = nameBox.x + nameBox.w + 8, cy = nameBox.y + o.hs * .1, ch = o.hs * .95;
        ctx.fillStyle = bands(ctx, 0, cy + ch, 0, cy, VB); ctx.fillRect(cx, cy, o.hs * .5, ch);
      }
    } else if (o.k === "text") {
      ctx.font = o.f; ctx.fillStyle = o.c;
      o.ln.forEach((l, i) => ctx.fillText(l, PAD, o.y + i * o.lh));
    } else if (o.k === "link") {
      ctx.font = o.f; ctx.fillStyle = C.ash; ctx.fillText(o.x, PAD, o.y);
      ctx.fillStyle = bands(ctx, PAD, 0, PAD + o.w, 0, HB); ctx.fillRect(PAD, o.y + o.ss * 1.25, o.w, 2);
    } else if (o.k === "row") {
      ctx.font = o.nf; ctx.fillStyle = C.soot; ctx.fillText(o.d, PAD, o.y + (o.sl - o.nl) / 2);
      ctx.font = o.sf; ctx.fillStyle = C.bone;
      o.ln.forEach((l, i) => ctx.fillText(l, PAD + o.dw, o.y + i * o.sl));
    } else if (o.k === "box") {
      const bx = PAD, by = o.y;
      ctx.fillStyle = "rgba(122,46,22,.55)"; ctx.fillRect(bx + 6, by + 6, o.bw, o.bh);
      ctx.fillStyle = "#1c1615"; ctx.fillRect(bx, by, o.bw, o.bh);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = C.trace; ctx.lineWidth = 1;
      ctx.strokeRect(bx + .5, by + .5, o.bw - 1, o.bh - 1); ctx.setLineDash([]);
      ctx.font = o.nf;
      o.ln.forEach((l, i) => {
        const ty = by + 16 + i * o.nl;
        ctx.fillStyle = C.soot; ctx.fillText(l, bx + 20, ty);
        const k = o.hl ? l.indexOf(o.hl) : -1;
        if (k >= 0) {
          const x0 = bx + 20 + ctx.measureText(l.slice(0, k)).width, w = ctx.measureText(o.hl).width;
          ctx.fillStyle = C.ash; ctx.fillText(o.hl, x0, ty);
          ctx.fillStyle = bands(ctx, x0, 0, x0 + w, 0, HB); ctx.fillRect(x0, ty + o.ns * 1.25, w, 2);
        }
      });
    }
  }
}

// two-pass perspective tilt + liquid wobble (rows, then columns)
function warp(src, sw, sh, ox, oy, rxd, ryd, amp, t, step) {
  const pad = 40, tw = sw + pad * 2, th = sh + pad * 2;
  ta.width = Math.ceil(tw * dpr); ta.height = Math.ceil(th * dpr);
  tac.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = sw / 2, cy = sh / 2, sx = Math.sin(rxd * RAD), cxr = Math.cos(rxd * RAD);
  for (let y = 0; y < sh; y += step) {
    const yy = y - cy, s = D / (D - yy * sx), w = sw * s;
    const off = Math.sin(y * .045 + t * 2.2) * amp + Math.sin(y * .013 - t * 1.4) * amp * .6;
    tac.drawImage(src, 0, y * dpr, sw * dpr, step * dpr, pad + cx - w / 2 + off, pad + cy + yy * cxr * s, w, step * cxr * s + .8);
  }
  const sy = Math.sin(ryd * RAD), cyr = Math.cos(ryd * RAD);
  for (let x = 0; x < tw; x += step) {
    const xx = x - tw / 2, s = D / (D - xx * sy), hh = th * s;
    main.drawImage(ta, x * dpr, 0, step * dpr, th * dpr, ox - pad + tw / 2 + xx * cyr * s, oy - pad + th / 2 - hh / 2 + Math.sin(x * .05 - t * 2) * amp * .5, step * cyr * s + .8, hh);
  }
}

function frame(now) {
  const t = (now - t0) / 1000, k = reduce ? 0 : 1;
  spd *= .92;
  hE += ((overName && !pageOn && k ? 1 : 0) - hE) * (overName ? .14 : .07);
  pE += ((pageOn && k ? 1 : 0) - pE) * .08;
  const ntx = overName && !pageOn ? (.5 - nny) * 26 : 0, nty = overName && !pageOn ? (nnx - .5) * 32 : 0;
  const ptx = pageOn && inWin ? (.5 - gy) * 10 : 0, pty = pageOn && inWin ? (gx - .5) * 14 : 0;
  nrx += (ntx - nrx) * .15; nry += (nty - nry) * .15;
  prx += (ptx - prx) * .15; pry += (pty - pry) * .15;
  cv.style.setProperty("--rx", prx.toFixed(2) + "deg"); cv.style.setProperty("--ry", pry.toFixed(2) + "deg");
  if (pE > .01) {
    ctx = scc; skipName = false; paint(t); ctx = main;
    main.clearRect(0, 0, W, H);
    warp(sc, W, H, 0, 0, 0, 0, pE * (3 + Math.min(spd, 1.2) * 12), t, 3);
  } else {
    skipName = hE > .01 && !!nameBox; ctx = main; paint(t);
    if (skipName) {
      const pad = 24, w = nameBox.w, h = nameBox.h;
      nc.width = Math.ceil((w + pad * 2) * dpr); nc.height = Math.ceil((h + pad * 2) * dpr);
      ncc.setTransform(dpr, 0, 0, dpr, 0, 0);
      ncc.font = `700 ${nameBox.hs}px ${F}`; ncc.textBaseline = "top";
      const g0 = pad - .7 * w + (nnx - .5) * .7 * w + Math.sin(t * 1.4) * .25 * w;
      ncc.fillStyle = bands(ncc, g0, 0, g0 + 2.4 * w, 0, HB); ncc.fillText(NAME, pad, pad);
      warp(nc, w + pad * 2, h + pad * 2, nameBox.x - pad, nameBox.y - pad, nrx, nry, hE * (6 + Math.min(spd, 1.2) * 22), t, 2);
    }
  }
  requestAnimationFrame(frame);
}

function track(ev) {
  const r = cv.getBoundingClientRect(), b = nameBox;
  spd = Math.min(2, spd + Math.hypot(ev.clientX - lx, ev.clientY - ly) / 40); lx = ev.clientX; ly = ev.clientY;
  gx = ev.clientX / innerWidth; gy = ev.clientY / innerHeight; inWin = true;
  mx = ev.clientX - r.left - 1; my = ev.clientY - r.top - 1;
  overName = !!b && mx >= b.x - 4 && mx <= b.x + b.w + 4 && my >= b.y && my <= b.y + b.h;
  if (b) { nnx = clamp(0, (mx - b.x) / b.w, 1); nny = clamp(0, (my - b.y) / b.h, 1); }
  hov = hits.findIndex(h => mx >= h.x && mx <= h.x + h.w && my >= h.y && my <= h.y + h.h);
  cv.style.cursor = overName || hov >= 0 ? "pointer" : "default";
}
function toggle() { pageOn = !pageOn; document.body.setAttribute("data-fx", pageOn ? "on" : "off"); location.hash = pageOn ? "fx" : ""; }
function nav(href) { location.href = href + (pageOn && !/^https?:/.test(href) ? "#fx" : ""); }
function go(step) { const c = NAV.findIndex(n => n[0] === PG.id); if (c < 0) return; const i = c + step; if (i >= 0 && i < NAV.length) nav(NAV[i][1]); }
addEventListener("pointermove", track);
cv.addEventListener("pointerdown", ev => { track(ev); if (overName) toggle(); else if (hov >= 0) { const h = hits[hov]; if (h.toggle) toggle(); else nav(h.href); } });
cv.addEventListener("keydown", ev => {
  if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggle(); }
  else if (ev.key === "ArrowRight") go(1); else if (ev.key === "ArrowLeft") go(-1);
});
document.documentElement.addEventListener("pointerleave", () => { inWin = false; overName = false; hov = -1; });
addEventListener("resize", layout);

pageOn = location.hash === "#fx";
if (pageOn) { pE = 1; document.body.setAttribute("data-fx", "on"); }
cv.setAttribute("aria-label", "Pages: " + NAV.map(n => n[0]).join(", ") + " (left and right arrow keys switch pages). " +
  PG.blocks.map(b => b.t === "hero" ? "I'm " + NAME : b.items ? b.items.map(i => i.d + " " + i.x).join(". ") : b.x).join(" "));
const fl = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('700 20px "JetBrains Mono"'), document.fonts.load('400 20px "JetBrains Mono"'), document.fonts.load('600 20px "JetBrains Mono"')]).catch(() => {}) : Promise.resolve();
fl.then(() => { layout(); t0 = performance.now(); requestAnimationFrame(frame); });
})();