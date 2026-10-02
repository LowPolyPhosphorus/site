(function () {
  var GO_DELAY = 650, TARGET = "somewhere.html";
  var src = null, over = null, ctx = null, dpr = 1;
  var W = 0, H = 0, L = 0, T = 0;
  var Pd = null, Pt = null;
  var dragging = false, done = false, doneAt = 0;

  function rest() { return { x: W - 14, y: H - 14 }; }
  function inZone(x, y) { return x >= W - 64 && y >= H - 64 && x <= W + 8 && y <= H + 8; }
  function lerp(a, b, k) { return a + (b - a) * k; }

  // pull colors from the CSS custom properties so the curl matches the theme
  function pal() {
    var cs = getComputedStyle(document.documentElement);
    function v(name, fb) { return cs.getPropertyValue(name).trim() || fb; }
    return {
      bench: v("--bench", "#17110f"),
      board: v("--board", "#3a211b"),
      edge:  v("--board-edge", "#6b3a2b"),
      label: v("--copper", "#b4552b"),
      hole:  v("--hole", "#0e0907")
    };
  }

  function clipHalf(poly, M, n) {
    var out = [];
    for (var i = 0; i < poly.length; i++) {
      var a = poly[i], b = poly[(i + 1) % poly.length];
      var da = (a.x - M.x) * n.x + (a.y - M.y) * n.y;
      var db = (b.x - M.x) * n.x + (b.y - M.y) * n.y;
      if (da <= 0) out.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        var t = da / (da - db);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
    return out;
  }
  function path(poly) {
    ctx.beginPath();
    for (var i = 0; i < poly.length; i++) {
      if (i) ctx.lineTo(poly[i].x, poly[i].y); else ctx.moveTo(poly[i].x, poly[i].y);
    }
    ctx.closePath();
  }

  function setup() {
    src = document.getElementById("c");
    if (!src || !src.offsetWidth || !src.width) return false;
    if (!over) {
      over = document.createElement("canvas");
      // globals.css styles every <canvas> as the board, so strip all of that off this overlay
      over.style.cssText = "position:fixed;pointer-events:none;z-index:40;margin:0;padding:0;" +
        "background:none;border:0;box-shadow:none;outline:0;animation:none;transition:none;";
      document.body.appendChild(over);
      ctx = over.getContext("2d");
      src.style.touchAction = "none";
    }
    return true;
  }

  var Minv = null;
  function inv3(m) {
    var a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5], g = m[6], h = m[7], i = m[8];
    var A = e * i - f * h, B = -(d * i - f * g), Cc = d * h - e * g;
    var det = a * A + b * B + c * Cc;
    if (Math.abs(det) < 1e-12) return null;
    var k = 1 / det;
    return [A * k, -(b * i - c * h) * k, (b * f - c * e) * k,
            B * k, (a * i - c * g) * k, -(a * f - c * d) * k,
            Cc * k, -(a * h - b * g) * k, (a * e - b * d) * k];
  }

  function layout() {
    // real (untransformed) layout position, so tilt/shake transforms can't skew it
    var w = src.offsetWidth, h = src.offsetHeight, x = 0, y = 0, el = src;
    while (el) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    L = x - window.scrollX;
    T = y - window.scrollY;
    dpr = window.devicePixelRatio || 1;
    if (w !== W || h !== H || over.width !== Math.round(w * dpr)) {
      W = w; H = h;
      over.width = Math.round(W * dpr);
      over.height = Math.round(H * dpr);
      over.style.width = W + "px";
      over.style.height = H + "px";
    }
    over.style.left = L + "px";
    over.style.top = T + "px";
    var cs = getComputedStyle(src);
    var tf = cs.transform === "none" ? "none" : cs.transform;
    over.style.transformOrigin = cs.transformOrigin;
    over.style.transform = tf;
    over.style.filter = cs.filter === "none" ? "none" : cs.filter;
    var o = cs.transformOrigin.split(" ");
    var ox = parseFloat(o[0]) || W / 2, oy = parseFloat(o[1]) || H / 2;
    try {
      var M = tf === "none" ? new DOMMatrix() : new DOMMatrix(tf);
      var A = new DOMMatrix().translate(L + ox, T + oy).multiply(M).translate(-ox, -oy);
      Minv = inv3([A.m11, A.m21, A.m41, A.m12, A.m22, A.m42, A.m14, A.m24, A.m44]);
    } catch (err) { Minv = null; }
    if (!Pd) { Pd = rest(); Pt = rest(); }
  }

  function draw() {
    var P = pal();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var C = { x: W, y: H };
    var vx = Pd.x - C.x, vy = Pd.y - C.y, D = Math.sqrt(vx * vx + vy * vy);
    if (D < 1) return;
    var n = { x: vx / D, y: vy / D };
    var M = { x: (C.x + Pd.x) / 2, y: (C.y + Pd.y) / 2 };
    var cut = clipHalf([{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }], M, n);
    if (cut.length < 3) return;

    // what's under the page: bare bench, flat label, no glow
    ctx.save();
    path(cut);
    ctx.fillStyle = P.bench;
    ctx.fill();
    ctx.clip();
    ctx.textAlign = "right";
    ctx.font = "600 18px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillStyle = P.label;
    ctx.fillText("hi :) \u2192", W - 20, H - 22);
    ctx.restore();

    // the lifted part of the page: the real index page, folded over
    var flap = cut.map(function (p) {
      var d = (p.x - M.x) * n.x + (p.y - M.y) * n.y;
      return { x: p.x - 2 * d * n.x, y: p.y - 2 * d * n.y };
    });

    // hard offset shadow, no blur
    ctx.save();
    path(flap);
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = -n.x * 3 * dpr;
    ctx.shadowOffsetY = -n.y * 3 * dpr;
    ctx.fillStyle = P.board;
    ctx.fill();
    ctx.restore();

    ctx.save();
    path(flap);
    ctx.clip();
    var mn = M.x * n.x + M.y * n.y;
    ctx.transform(1 - 2 * n.x * n.x, -2 * n.x * n.y, -2 * n.x * n.y, 1 - 2 * n.y * n.y, 2 * mn * n.x, 2 * mn * n.y);
    ctx.fillStyle = P.board;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, W, H);
    ctx.restore();

    // curl shading: one flat tint, no gradient
    ctx.save();
    path(flap);
    ctx.clip();
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // edge
    path(flap);
    ctx.strokeStyle = P.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (!over && !setup()) return;
    var hidden = src.style.visibility === "hidden";
    over.style.display = hidden ? "none" : "";
    if (hidden) return;
    layout();
    if (!dragging && !done) Pt = rest();
    var k = done ? 0.16 : dragging ? 0.4 : 0.22;
    Pd.x = lerp(Pd.x, Pt.x, k);
    Pd.y = lerp(Pd.y, Pt.y, k);
    draw();
    if (done && now - doneAt > GO_DELAY) { done = false; location.href = TARGET; }
  }

  function local(e) {
    if (!Minv) return { x: e.clientX - L, y: e.clientY - T };
    var X = e.clientX, Y = e.clientY;
    var w = Minv[6] * X + Minv[7] * Y + Minv[8] || 1;
    return { x: (Minv[0] * X + Minv[1] * Y + Minv[2]) / w, y: (Minv[3] * X + Minv[4] * Y + Minv[5]) / w };
  }
  function canGrab() { return over && src && src.style.visibility !== "hidden" && !done && Pd; }

  window.addEventListener("pointerdown", function (e) {
    if (!canGrab()) return;
    var l = local(e);
    if (!inZone(l.x, l.y)) return;
    dragging = true;
    src.style.cursor = "grabbing";
    e.stopPropagation();
    e.preventDefault();
  }, true);

  window.addEventListener("pointermove", function (e) {
    if (!canGrab()) return;
    var l = local(e);
    if (dragging) {
      var x = Math.min(l.x, W - 2), y = Math.min(l.y, H - 2);
      var dx = W - x, dy = H - y, D = Math.sqrt(dx * dx + dy * dy), max = Math.sqrt(W * W + H * H) * 0.8;
      if (D > max) { x = W - dx * max / D; y = H - dy * max / D; }
      Pt = { x: x, y: y };
    }
  });

  function release() {
    if (!dragging) return;
    dragging = false;
    src.style.cursor = "";
    var dx = W - Pt.x, dy = H - Pt.y;
    if (Math.sqrt(dx * dx + dy * dy) >= Math.min(W, H) * 0.55) {
      done = true;
      doneAt = performance.now();
      Pt = { x: W * 0.1, y: H * 0.06 };
    }
  }
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);

  requestAnimationFrame(loop);
})();