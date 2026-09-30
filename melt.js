(function () {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var IDLE = 30000, MELT = 14000, UNDO = 900, SW = 3, SOFT = 120;
  var last = performance.now(), p = 0, raf = 0, prev = 0;
  var over = null, ctx = null, src = null, vw = 0, vh = 0, dpr = 1;

  function rnd(i) { var s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(v) { v = clamp(v); return v * v * (3 - 2 * v); }

  function setup() {
    src = document.getElementById("c");
    if (!src || !src.width || !src.height) return false;
    if (!over) {
      over = document.createElement("canvas");
      over.style.cssText = "position:fixed;left:0;top:0;pointer-events:none;z-index:50;margin:0;padding:0;background:none;border:0;box-shadow:none;outline:0;animation:none;transition:none;transform:none;";
      document.body.appendChild(over);
      ctx = over.getContext("2d");
      vw = 0;
    }
    return true;
  }

  function fit() {
    var w = document.documentElement.clientWidth, h = window.innerHeight;
    if (w === vw && h === vh) return;
    vw = w; vh = h; dpr = window.devicePixelRatio || 1;
    over.width = Math.round(vw * dpr);
    over.height = Math.round(vh * dpr);
    over.style.width = vw + "px";
    over.style.height = vh + "px";
  }

  function teardown() {
    if (src) src.style.visibility = "";
    if (over) { over.remove(); over = null; ctx = null; }
    p = 0;
  }

  function draw(t) {
    fit();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    var r = src.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var G = Math.max(70, vh * 0.16);
    var g = G * smooth((p - 0.2) / 0.8);
    var spread = clamp(p / 0.85);
    var half = spread * (Math.max(cx, vw - cx) + SOFT);
    var ph = t / 700;

    function surface(x) {
      var f = smooth((half - Math.abs(x - cx)) / SOFT);
      var wob = 0.85 + 0.15 * Math.sin(x * 0.018 + ph) + 0.08 * Math.sin(x * 0.047 - ph * 1.3);
      var bulge = 0.35 * Math.exp(-Math.pow((x - cx) / (r.width * 0.5), 2));
      return vh - g * (f * wob + bulge * f);
    }

    // board strips: same height or shorter, they fall and shrink into the puddle
    var scale = src.width / r.width;
    var n = Math.ceil(r.width / SW);
    for (var i = 0; i < n; i++) {
      var x = i * SW, sw = Math.min(SW, r.width - x);
      var chunk = 0.5 * rnd(i) + 0.5 * rnd(Math.floor(i / 6) + 999);
      var d = (0.6 * chunk + 0.4 * rnd(i * 3 + 1)) * 0.35;
      var q = clamp((p - d) / (1 - d));
      var e = q * q * (3 - 2 * q);
      var Y = surface(r.left + x + sw / 2);
      var top = r.top + e * (Y - r.top);
      var bottom = Math.min(top + r.height * (1 - e), Y);
      if (bottom - top < 0.5) continue;
      ctx.drawImage(src, x * scale, 0, sw * scale, src.height, r.left + x, top, sw, bottom - top);
    }
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = "rgba(255,90,31," + (0.18 * p) + ")";
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalCompositeOperation = "source-over";

    // goop: one continuous body across the bottom
    if (g > 0.5) {
      var top0 = vh - g * 1.6 - 10;
      var grad = ctx.createLinearGradient(0, top0, 0, vh);
      grad.addColorStop(0, "#3a2117");
      grad.addColorStop(0.35, "#2a1710");
      grad.addColorStop(1, "#151110");
      ctx.beginPath();
      ctx.moveTo(0, vh + 2);
      for (var gx = 0; gx <= vw + 6; gx += 6) ctx.lineTo(gx, surface(Math.min(gx, vw)));
      ctx.lineTo(vw, vh + 2);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      for (var sx = 0; sx <= vw + 6; sx += 6) {
        var sy = surface(Math.min(sx, vw));
        if (sx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = "rgba(255,90,31,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.translate(0, 5);
      ctx.strokeStyle = "rgba(255,150,90,0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function loop(t) {
    raf = 0;
    var dt = Math.min(64, t - prev); prev = t;
    var idle = t - last >= IDLE;
    p = clamp(p + (idle ? dt / MELT : -dt / UNDO));
    if (p <= 0 && !idle) { teardown(); return; }
    if (!over && !setup()) { p = 0; return; }
    src.style.visibility = "hidden";
    draw(t);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (raf) return;
    prev = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function poke() {
    last = performance.now();
    if (p > 0) start();
  }

  ["mousemove", "mousedown", "pointerdown", "pointermove", "keydown", "touchstart", "wheel", "scroll", "focus"].forEach(function (ev) {
    window.addEventListener(ev, poke, { passive: true, capture: true });
  });
  document.addEventListener("visibilitychange", poke);

  setInterval(function () {
    if (!raf && p === 0 && performance.now() - last >= IDLE) start();
  }, 1000);
})();