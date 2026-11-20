/* Oryne — clean-room Squarespace 7.1 no-code plugin
   Original code, written from scratch. Inspired only by the general
   workflow of loader-snippet + click-to-select editor + effects.
   No proprietary code, branding, logo or text was copied.
   v2.2: floating button + editor panel are draggable; positions saved in localStorage.
   Usage: paste the loader snippet in Squarespace Code Injection (Header).
   Config lives in window.__ORYNE_CONFIG__ or localStorage (demo).
*/
(function () {
  'use strict';

  var STORAGE_KEY = 'oryneConfig.v1';
  var FAB_POS_KEY = 'oryne-fab-pos';
  var PANEL_POS_KEY = 'oryne-panel-pos';
  var LS = window.localStorage;

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function defaultConfig() { return { version: 1, items: [] }; }

  function loadConfig() {
    if (window.__ORYNE_CONFIG__ && window.__ORYNE_CONFIG__.items) return clone(window.__ORYNE_CONFIG__);
    try {
      var raw = LS.getItem(STORAGE_KEY);
      if (raw) { var c = JSON.parse(raw); if (c && c.items) return c; }
    } catch (e) {}
    return defaultConfig();
  }
  function saveConfig(cfg) {
    window.__ORYNE_CONFIG__ = clone(cfg);
    try { LS.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  /* ---------- Drag positions (v2.2): saved in localStorage ---------- */
  function loadPos(key) {
    try { var p = JSON.parse(LS.getItem(key)); if (p && isFinite(p.left) && isFinite(p.top)) return p; } catch (e) {}
    return null;
  }
  function savePos(key, left, top) {
    try { LS.setItem(key, JSON.stringify({ left: Math.round(left), top: Math.round(top) })); } catch (e) {}
  }

  /* ---------- EFFECTS registry ----------
     Each effect: { id, name, category, desc, targets, options, cssClass, js }
     targets: block | section | button | text | image | header | any
     options: [{key,label,type,default,min,max,step,choices}]
     cssClass is added to the element; JS effects get a js init function.
  */
  var EFFECTS = {};

  function reg(e) { EFFECTS[e.id] = e; return e; }
  function cssEffect(id, name, cat, desc, targets, options) {
    return reg({ id: id, name: name, category: cat, desc: desc, targets: targets, options: options || [], cssClass: 'oryne-fx-' + id, js: null });
  }
  function jsEffect(id, name, cat, desc, targets, options, initFn) {
    return reg({ id: id, name: name, category: cat, desc: desc, targets: targets, options: options || [], cssClass: 'oryne-fx-' + id, js: initFn });
  }
  function rangeOpt(key, label, def, min, max, step, unit) { return { key: key, label: label, type: 'range', default: def, min: min, max: max, step: step || 1, unit: unit || '' }; }
  function colorOpt(key, label, def) { return { key: key, label: label, type: 'color', default: def }; }
  function textOpt(key, label, def) { return { key: key, label: label, type: 'text', default: def }; }
  function selectOpt(key, label, def, choices) { return { key: key, label: label, type: 'select', default: def, choices: choices }; }

  /* Motion */
  cssEffect('fade-up', 'Fade Up', 'Animations & Motion', 'Neeche se upar aate hue appear ho', ['block', 'section', 'image', 'text'], [rangeOpt('duration', 'Duration (s)', 0.7, 0.2, 2, 0.1), rangeOpt('delay', 'Delay (s)', 0, 0, 1, 0.1)]);
  cssEffect('fade-in', 'Fade In', 'Animations & Motion', 'Halke se fade in ho', ['block', 'section', 'image', 'text'], [rangeOpt('duration', 'Duration (s)', 0.7, 0.2, 2, 0.1)]);
  cssEffect('slide-left', 'Slide Left', 'Animations & Motion', 'Left se slide karke aaye', ['block', 'section', 'image'], [rangeOpt('duration', 'Duration (s)', 0.7, 0.2, 2, 0.1)]);
  cssEffect('slide-right', 'Slide Right', 'Animations & Motion', 'Right se slide karke aaye', ['block', 'section', 'image'], [rangeOpt('duration', 'Duration (s)', 0.7, 0.2, 2, 0.1)]);
  cssEffect('zoom-in', 'Zoom In', 'Animations & Motion', 'Chhota se bara hoke aaye', ['block', 'section', 'image'], [rangeOpt('duration', 'Duration (s)', 0.7, 0.2, 2, 0.1)]);
  cssEffect('reveal-scroll', 'Reveal on Scroll', 'Animations & Motion', 'Scroll par reveal ho', ['block', 'section', 'text', 'image'], [rangeOpt('duration', 'Duration (s)', 0.8, 0.2, 2, 0.1)]);
  cssEffect('sticky-section', 'Sticky Section', 'Animations & Motion', 'Section scroll par chipki rahe', ['section'], [rangeOpt('top', 'Top offset (px)', 0, 0, 120, 5)]);
  jsEffect('stagger-children', 'Stagger Children', 'Animations & Motion', 'Bachche elements ek ke baad ek aayein', ['section', 'block'], [rangeOpt('stagger', 'Stagger (ms)', 120, 40, 400, 20)], function (el, o) {
    $$(':scope > *', el).forEach(function (c, i) { c.style.setProperty('--oryne-index', i); });
  });
  jsEffect('parallax', 'Parallax', 'Animations & Motion', 'Scroll par halki movement', ['section', 'image', 'block'], [rangeOpt('speed', 'Speed', 0.25, 0.05, 0.6, 0.05)], function (el, o) {
    if (el.dataset.oryneParallax) return; el.dataset.oryneParallax = '1';
    var speed = parseFloat(o.speed) || 0.25;
    window.addEventListener('scroll', function () {
      var r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) el.style.transform = 'translateY(' + ((window.innerHeight / 2 - (r.top + r.height / 2)) * speed * 0.2) + 'px)';
    }, { passive: true });
  });

  /* Text */
  cssEffect('gradient-heading', 'Gradient Heading', 'Typography', 'Heading par gradient rang', ['text'], [colorOpt('color1', 'Color 1', '#ff6a00'), colorOpt('color2', 'Color 2', '#7b2fff'), rangeOpt('angle', 'Angle', 90, 0, 360, 10)]);
  cssEffect('highlight-word', 'Highlight Word', 'Typography', 'Text ke peeche highlight', ['text'], [colorOpt('highlight', 'Highlight color', '#ffe08a')]);
  cssEffect('letter-spacing', 'Letter Spacing', 'Typography', 'Harfon ke darmiyan fasla', ['text'], [rangeOpt('spacing', 'Spacing (em)', 0.12, 0, 0.4, 0.02)]);
  cssEffect('underline-anim', 'Underline Animation', 'Typography', 'Hover par underline aaye', ['text', 'button'], []);
  jsEffect('typewriter', 'Typewriter', 'Typography', 'Typewriter effect se likha jaye', ['text'], [textOpt('words', 'Text', 'Hello, welcome to my site'), rangeOpt('speed', 'Speed (ms)', 70, 20, 200, 10)], function (el, o) {
    if (el.dataset.oryneTyped) return; el.dataset.oryneTyped = '1';
    var full = String(o.words || el.textContent).trim(); el.textContent = '';
    var i = 0, speed = parseInt(o.speed, 10) || 70;
    (function tick() { if (i <= full.length) { el.textContent = full.slice(0, i); i++; setTimeout(tick, speed); } })();
  });
  jsEffect('word-loop', 'Word Loop', 'Typography', 'Alfazon ko badal badal kar dikhaye', ['text'], [textOpt('words', 'Words (comma se alag)', 'creative, bold, beautiful, simple'), rangeOpt('speed', 'Speed (ms)', 1800, 800, 4000, 100)], function (el, o) {
    if (el.dataset.oryneLoop) return; el.dataset.oryneLoop = '1';
    var words = String(o.words || 'creative, bold').split(',').map(function (w) { return w.trim(); }).filter(Boolean);
    if (!words.length) return;
    var base = el.textContent.replace(/\s*\|?\s*$/, '');
    var idx = 0;
    setInterval(function () { el.textContent = base + ' ' + words[idx % words.length]; idx++; }, parseInt(o.speed, 10) || 1800);
  });

  /* Buttons */
  cssEffect('btn-gradient', 'Gradient Button', 'Buttons', 'Button par gradient', ['button'], [colorOpt('color1', 'Color 1', '#ff6a00'), colorOpt('color2', 'Color 2', '#7b2fff')]);
  cssEffect('btn-pill', 'Pill Button', 'Buttons', 'Gol kinare wala button', ['button'], []);
  cssEffect('btn-outline', 'Outline Button', 'Buttons', 'Sirf border wala button', ['button'], [colorOpt('color1', 'Border color', '#111111')]);
  cssEffect('btn-lift', 'Hover Lift', 'Buttons', 'Hover par upar uthe', ['button'], []);
  cssEffect('btn-glow', 'Hover Glow', 'Buttons', 'Hover par glow kare', ['button'], [colorOpt('glow', 'Glow color', '#7b2fff')]);
  cssEffect('btn-shine', 'Shine Sweep', 'Buttons', 'Hover par shine guzre', ['button'], []);
  cssEffect('btn-underline', 'Underline Button', 'Buttons', 'Neeche moti line wala button', ['button'], [colorOpt('color1', 'Line color', '#ff6a00')]);

  /* Blocks / Images */
  cssEffect('img-zoom', 'Hover Zoom', 'Images & Blocks', 'Hover par image zoom ho', ['image', 'block'], []);
  jsEffect('img-reveal', 'Hover Reveal Caption', 'Images & Blocks', 'Hover par caption dikhaye', ['image', 'block'], [textOpt('caption', 'Caption', 'View this work')], function (el, o) {
    if (el.querySelector('.oryne-caption')) return;
    var cap = document.createElement('div'); cap.className = 'oryne-caption'; cap.textContent = o.caption || 'View this work'; el.appendChild(cap);
  });
  cssEffect('img-grayscale', 'Grayscale to Color', 'Images & Blocks', 'Pehle gray, hover par color', ['image', 'block'], []);
  cssEffect('img-tilt', 'Tilt on Hover', 'Images & Blocks', 'Hover par halka tilt', ['image', 'block'], []);
  cssEffect('block-shadow', 'Shadow', 'Images & Blocks', 'Bara soft shadow', ['block', 'section', 'image'], []);
  cssEffect('block-rounded', 'Rounded Corners', 'Images & Blocks', 'Gol kinare', ['block', 'section', 'image'], [rangeOpt('radius', 'Radius (px)', 18, 0, 40, 2)]);
  cssEffect('block-rotate', 'Rotate', 'Images & Blocks', 'Halka sa tedha', ['block', 'image'], [rangeOpt('rotate', 'Rotate (deg)', -2, -8, 8, 1)]);
  cssEffect('block-border', 'Border', 'Images & Blocks', 'Mot border lagaye', ['block', 'section', 'image'], [colorOpt('color1', 'Border color', '#111111'), rangeOpt('borderWidth', 'Width (px)', 3, 1, 8, 1)]);

  /* Visibility */
  cssEffect('hide-mobile', 'Hide on Mobile', 'Marketing & Widgets', 'Mobile par chhupaye', ['block', 'section', 'any'], []);
  cssEffect('hide-desktop', 'Hide on Desktop', 'Marketing & Widgets', 'Desktop par chhupaye', ['block', 'section', 'any'], []);
  cssEffect('hide-tablet', 'Hide on Tablet', 'Marketing & Widgets', 'Tablet par chhupaye', ['block', 'section', 'any'], []);

  /* Navigation */
  cssEffect('sticky-header', 'Sticky Header', 'Navigation & Header', 'Header upar chipka rahe', ['header', 'section'], [colorOpt('headerBg', 'Header background', '#ffffff')]);
  cssEffect('announce-anim', 'Announcement Animation', 'Navigation & Header', 'Announcement bar animate ho', ['header', 'block', 'text'], []);
  jsEffect('mega-menu', 'Mega Menu', 'Navigation & Header', 'Nav par bada dropdown panel', ['header'], [textOpt('links', 'Links (Title: URL, comma se)', 'Services: #services, Pricing: #pricing, About: #about, Contact: #contact')], function (el, o) {
    if (el.querySelector('.oryne-mega-panel')) return;
    var nav = el.querySelector('nav') || el;
    var wrap = document.createElement('div'); wrap.className = 'oryne-mega';
    var btn = document.createElement('a'); btn.href = '#'; btn.textContent = 'Explore ▾'; btn.style.cssText = 'font-weight:700;text-decoration:none;color:inherit;padding:8px;';
    var panel = document.createElement('div'); panel.className = 'oryne-mega-panel';
    String(o.links || '').split(',').forEach(function (part) {
      var bits = part.split(':'); if (bits.length < 2) return;
      var a = document.createElement('a'); a.href = bits.slice(1).join(':').trim(); a.textContent = bits[0].trim();
      var s = document.createElement('small'); s.textContent = 'Go to ' + bits[0].trim(); a.appendChild(s); panel.appendChild(a);
    });
    btn.addEventListener('click', function (e) { e.preventDefault(); wrap.classList.toggle('oryne-open'); });
    wrap.appendChild(btn); wrap.appendChild(panel); nav.appendChild(wrap);
  });

  /* Content / Marketing */
  jsEffect('popup-builder', 'Popup Builder', 'Marketing & Widgets', 'Kuch seconds baad popup dikhaye', ['any'], [textOpt('title', 'Popup title', 'Join our newsletter'), textOpt('text', 'Popup text', 'Get 10% off your first order.'), rangeOpt('delay', 'Delay (seconds)', 3, 0, 15, 1)], function (el, o) {
    if (document.querySelector('.oryne-popup')) return;
    var delay = (parseFloat(o.delay) || 3) * 1000;
    setTimeout(function () {
      if (document.querySelector('.oryne-popup')) return;
      var p = document.createElement('div'); p.className = 'oryne-popup';
      p.innerHTML = '<div class="oryne-popup-card"><button class="oryne-popup-close" aria-label="Close">&times;</button><h3>' + esc(o.title || 'Hello') + '</h3><p>' + esc(o.text || '') + '</p><button class="oryne-btn oryne-btn-primary" style="margin-top:10px">Subscribe</button></div>';
      p.querySelector('.oryne-popup-close').addEventListener('click', function () { p.remove(); });
      p.addEventListener('click', function (e) { if (e.target === p) p.remove(); });
      document.body.appendChild(p);
    }, delay);
  });
  jsEffect('countdown-timer', 'Countdown Timer', 'Marketing & Widgets', 'Offer ka countdown dikhaye', ['block', 'section', 'text'], [textOpt('date', 'Target date (YYYY-MM-DD)', '2026-12-31')], function (el, o) {
    if (el.querySelector('.oryne-countdown')) return;
    var wrap = document.createElement('div'); wrap.className = 'oryne-countdown';
    wrap.innerHTML = '<span><b class="oryne-d">00</b><small>Days</small></span><span><b class="oryne-h">00</b><small>Hours</small></span><span><b class="oryne-m">00</b><small>Mins</small></span><span><b class="oryne-s">00</b><small>Secs</small></span>';
    el.appendChild(wrap);
    var target = new Date((o.date || '2026-12-31') + 'T23:59:59').getTime();
    function pad(n) { return String(n).padStart(2, '0'); }
    setInterval(function () {
      var d = Math.max(0, target - Date.now());
      wrap.querySelector('.oryne-d').textContent = pad(Math.floor(d / 86400000));
      wrap.querySelector('.oryne-h').textContent = pad(Math.floor(d / 3600000) % 24);
      wrap.querySelector('.oryne-m').textContent = pad(Math.floor(d / 60000) % 60);
      wrap.querySelector('.oryne-s').textContent = pad(Math.floor(d / 1000) % 60);
    }, 1000);
  });
  jsEffect('testimonial-slider', 'Testimonial Slider', 'Content', 'Testimonials slide karein', ['block', 'section'], [], function (el, o) {
    if (el.dataset.oryneSlider) return; el.dataset.oryneSlider = '1';
    var kids = $$(':scope > *', el); if (kids.length < 2) return;
    el.classList.add('oryne-testimonial');
    var track = document.createElement('div'); track.className = 'oryne-testimonial-track';
    kids.forEach(function (k) { track.appendChild(k); });
    el.appendChild(track);
    var nav = document.createElement('div'); nav.className = 'oryne-testimonial-nav';
    nav.innerHTML = '<button type="button">← Prev</button><button type="button">Next →</button>';
    el.appendChild(nav);
    var i = 0;
    function go(n) { i = (n + kids.length) % kids.length; track.style.transform = 'translateX(-' + (i * 100) + '%)'; }
    nav.children[0].addEventListener('click', function () { go(i - 1); });
    nav.children[1].addEventListener('click', function () { go(i + 1); });
  });
  cssEffect('pricing-highlight', 'Pricing Highlight', 'Content', 'Pricing card ko highlight kare', ['block', 'section'], [colorOpt('color1', 'Highlight color', '#7b2fff')]);
  jsEffect('logo-carousel', 'Scrolling Logo Carousel', 'Content', 'Logos scroll karte rahein', ['block', 'section'], [rangeOpt('speed', 'Speed (s)', 18, 8, 40, 2)], function (el, o) {
    if (el.dataset.oryneLogo) return; el.dataset.oryneLogo = '1';
    el.classList.add('oryne-logo-carousel');
    var track = document.createElement('div'); track.className = 'oryne-logo-track';
    track.style.setProperty('--oryne-speed', (o.speed || 18) + 's');
    var items = $$(':scope > *', el); if (!items.length) { track.innerHTML = '<b>LOGO ONE</b><b>LOGO TWO</b><b>LOGO THREE</b><b>LOGO FOUR</b>'; }
    else items.forEach(function (it) { track.appendChild(it); });
    track.innerHTML += track.innerHTML; // duplicate for seamless loop
    el.appendChild(track);
  });
  jsEffect('number-counter', 'Number Counter', 'Marketing & Widgets', 'Number 0 se count up ho', ['text', 'block'], [textOpt('number', 'Target number', '250'), textOpt('suffix', 'Suffix', '+')], function (el, o) {
    if (el.dataset.oryneCount) return; el.dataset.oryneCount = '1';
    var target = parseInt(o.number, 10) || 100; var suffix = o.suffix || '';
    var start = null;
    function step(ts) { if (!start) start = ts; var p = Math.min(1, (ts - start) / 1200); el.textContent = Math.floor(target * p) + suffix; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  });
  jsEffect('before-after', 'Before / After Slider', 'Content', 'Drag karke before/after dekhein', ['image', 'block'], [], function (el, o) {
    if (el.dataset.oryneBA) return; el.dataset.oryneBA = '1';
    var imgs = $$('img', el); if (imgs.length < 2) return;
    el.classList.add('oryne-before-after');
    var after = document.createElement('div'); after.className = 'oryne-after-img'; after.appendChild(imgs[1].cloneNode(true));
    var range = document.createElement('input'); range.type = 'range'; range.min = 0; range.max = 100; range.value = 50;
    range.addEventListener('input', function () { after.style.width = range.value + '%'; });
    imgs[1].remove(); el.appendChild(after); el.appendChild(range);
  });
  cssEffect('accordion-style', 'Accordion Styling', 'Content', 'Accordion ko styled box banaye', ['block', 'section'], []);


  /* ---- NEW: Scroll / Momentum Animations (12) ---- */
  cssEffect('flip-in', 'Flip In', 'Animations & Motion', 'Scroll par flip hoke aaye', ['block', 'section', 'image'], [rangeOpt('duration', 'Duration (s)', 0.7, 0.2, 2, 0.1)]);
  cssEffect('bounce-in', 'Bounce In', 'Animations & Motion', 'Bounce karke aaye', ['block', 'section', 'image'], [rangeOpt('duration', 'Duration (s)', 0.8, 0.2, 2, 0.1)]);
  cssEffect('rotate-in', 'Rotate In', 'Animations & Motion', 'Ghoomte hue aaye', ['block', 'section', 'image'], [rangeOpt('duration', 'Duration (s)', 0.7, 0.2, 2, 0.1)]);
  cssEffect('blur-in', 'Blur In', 'Animations & Motion', 'Blur se clear ho', ['block', 'section', 'text', 'image'], [rangeOpt('duration', 'Duration (s)', 0.8, 0.2, 2, 0.1)]);
  cssEffect('fade-down', 'Fade Down', 'Animations & Motion', 'Upar se neeche fade ho', ['block', 'section', 'text'], [rangeOpt('duration', 'Duration (s)', 0.7, 0.2, 2, 0.1)]);
  cssEffect('slide-up', 'Slide Up', 'Animations & Motion', 'Neeche se slide up', ['block', 'section'], [rangeOpt('duration', 'Duration (s)', 0.7, 0.2, 2, 0.1)]);
  cssEffect('scale-in', 'Scale In', 'Animations & Motion', 'Scale hoke aaye', ['block', 'section', 'image'], [rangeOpt('duration', 'Duration (s)', 0.7, 0.2, 2, 0.1)]);
  cssEffect('skew-in', 'Skew In', 'Animations & Motion', 'Tedha hoke seedha ho', ['block', 'section'], [rangeOpt('duration', 'Duration (s)', 0.7, 0.2, 2, 0.1)]);
  cssEffect('momentum-scroll', 'Momentum Scroll', 'Animations & Motion', 'Scroll par smooth momentum feel', ['section', 'block'], [rangeOpt('speed', 'Speed', 0.25, 0.05, 0.6, 0.05)]);
  cssEffect('reveal-left', 'Reveal Left', 'Animations & Motion', 'Left se reveal', ['block', 'section', 'text'], []);
  cssEffect('reveal-right', 'Reveal Right', 'Animations & Motion', 'Right se reveal', ['block', 'section', 'text'], []);
  cssEffect('reveal-zoom', 'Reveal Zoom', 'Animations & Motion', 'Zoom ke saath reveal', ['block', 'section', 'image'], []);

  /* ---- Block Animator: loop animations (5) ---- */
  cssEffect('loop-float', 'Loop Float', 'Animations & Motion', 'Hamesha halka float kare', ['block', 'image', 'text'], []);
  cssEffect('loop-pulse', 'Loop Pulse', 'Animations & Motion', 'Halka pulse kare', ['block', 'button', 'image'], []);
  cssEffect('loop-wiggle', 'Loop Wiggle', 'Animations & Motion', 'Halka wiggle kare', ['block', 'image'], []);
  cssEffect('loop-spin', 'Loop Spin (slow)', 'Animations & Motion', 'Aahista ghoome', ['block', 'image'], []);
  cssEffect('loop-bounce', 'Loop Bounce', 'Animations & Motion', 'Halka bounce kare', ['block', 'button'], []);

  /* ---- Text Effects extra (7) + Block Text Options (3) ---- */
  cssEffect('text-glow', 'Text Glow', 'Typography', 'Text par glow', ['text'], [colorOpt('color1', 'Glow color', '#7b2fff')]);
  cssEffect('text-outline', 'Text Outline', 'Typography', 'Sirf outline wala text', ['text'], [colorOpt('color1', 'Outline color', '#111111')]);
  cssEffect('text-shadow', 'Text Shadow', 'Typography', 'Text ke peeche shadow', ['text'], []);
  cssEffect('text-gradient-anim', 'Animated Gradient Text', 'Typography', 'Gradient harkat kare', ['text'], [colorOpt('color1', 'Color 1', '#ff6a00'), colorOpt('color2', 'Color 2', '#7b2fff')]);
  cssEffect('text-uppercase', 'Uppercase Text', 'Typography', 'Sara text capital', ['text'], []);
  cssEffect('text-italic', 'Italic Accent', 'Typography', 'Italic style', ['text'], []);
  cssEffect('text-strikethrough', 'Strikethrough', 'Typography', 'Text par line', ['text'], []);
  cssEffect('text-center', 'Center Text', 'Typography', 'Text center mein', ['text', 'block'], []);
  cssEffect('text-lineheight', 'Line Height', 'Typography', 'Lines ke darmiyan fasla', ['text', 'block'], [rangeOpt('spacing', 'Line height', 1.6, 1, 2.5, 0.1)]);
  cssEffect('text-letterspacing-wide', 'Wide Letters', 'Typography', 'Chaude harf', ['text'], []);

  /* ---- Button Designer extra (8) ---- */
  cssEffect('btn-3d', '3D Button', 'Buttons', '3D dabba wala button', ['button'], [colorOpt('color1', 'Color', '#ff6a00')]);
  cssEffect('btn-glass', 'Glass Button', 'Buttons', 'Sheeshe jaisa button', ['button'], []);
  cssEffect('btn-neon', 'Neon Button', 'Buttons', 'Neon glow button', ['button'], [colorOpt('color1', 'Neon color', '#00e5ff')]);
  cssEffect('btn-arrow', 'Arrow Button', 'Buttons', 'Hover par arrow aaye', ['button'], []);
  cssEffect('btn-rounded', 'Rounded Button', 'Buttons', 'Halke gol kinare', ['button'], []);
  cssEffect('btn-square', 'Square Button', 'Buttons', 'Bilkul square button', ['button'], []);
  cssEffect('btn-ghost', 'Ghost Button', 'Buttons', 'Halka transparent button', ['button'], []);
  cssEffect('btn-dark', 'Dark Button', 'Buttons', 'Kaala button, safed text', ['button'], []);

  /* ---- Hover Effects (8) ---- */
  cssEffect('hover-lift-block', 'Hover Lift Block', 'Images & Blocks', 'Hover par block upar uthe', ['block', 'section'], []);
  cssEffect('hover-glow-block', 'Hover Glow Block', 'Images & Blocks', 'Hover par block glow kare', ['block', 'section'], []);
  cssEffect('hover-scale', 'Hover Scale', 'Images & Blocks', 'Hover par bara ho', ['block', 'image'], []);
  cssEffect('hover-flip', 'Hover Flip', 'Images & Blocks', 'Hover par flip ho', ['block', 'image'], []);
  cssEffect('hover-overlay', 'Hover Dark Overlay', 'Images & Blocks', 'Hover par kaala overlay', ['block', 'image'], []);
  cssEffect('hover-border-anim', 'Hover Border', 'Images & Blocks', 'Hover par border aaye', ['block', 'image'], []);
  cssEffect('hover-shadow-grow', 'Hover Shadow Grow', 'Images & Blocks', 'Hover par shadow bara ho', ['block', 'section'], []);
  cssEffect('hover-rotate-block', 'Hover Rotate', 'Images & Blocks', 'Hover par halka rotate', ['block', 'image'], []);

  /* ---- Image Design & Effects: shapes + effects (8) ---- */
  cssEffect('img-circle', 'Circle Image', 'Images & Blocks', 'Image gol banaye', ['image', 'block'], []);
  cssEffect('img-triangle', 'Triangle Image', 'Images & Blocks', 'Image triangle shape mein', ['image', 'block'], []);
  cssEffect('img-parallelogram', 'Parallel Image', 'Images & Blocks', 'Image parallelogram shape mein', ['image', 'block'], []);
  cssEffect('img-arrow-shape', 'Arrow Image', 'Images & Blocks', 'Image arrow shape mein', ['image', 'block'], []);
  cssEffect('img-spotlight', 'Spotlight Image', 'Images & Blocks', 'Spotlight glow effect', ['image', 'block'], []);
  cssEffect('img-pop', 'Pop Image', 'Images & Blocks', 'Image pop hoke aaye', ['image', 'block'], []);
  cssEffect('img-fade-hover', 'Fade on Hover', 'Images & Blocks', 'Hover par halka fade', ['image', 'block'], []);
  cssEffect('img-flip-hover', 'Flip on Hover', 'Images & Blocks', 'Hover par flip', ['image', 'block'], []);

  /* ---- Background Effects (7) + Dynamic Background Colors (2) ---- */
  cssEffect('bg-gradient-anim', 'Animated Gradient BG', 'Backgrounds', 'Background gradient harkat kare', ['section', 'block'], [colorOpt('color1', 'Color 1', '#ff6a00'), colorOpt('color2', 'Color 2', '#7b2fff')]);
  cssEffect('bg-dots', 'Dots Background', 'Backgrounds', 'Dots wala background', ['section', 'block'], []);
  cssEffect('bg-grid', 'Grid Background', 'Backgrounds', 'Grid lines background', ['section', 'block'], []);
  cssEffect('bg-glow-orb', 'Glow Orb Background', 'Backgrounds', 'Roshni wala background', ['section', 'block'], []);
  cssEffect('bg-diagonal', 'Diagonal Background', 'Backgrounds', 'Diagonal stripes background', ['section', 'block'], []);
  cssEffect('bg-noise', 'Soft Noise Background', 'Backgrounds', 'Halka textured background', ['section', 'block'], []);
  cssEffect('bg-dark', 'Dark Background', 'Backgrounds', 'Kaala background, safed text', ['section', 'block'], []);
  cssEffect('bg-color-cycle', 'Color Cycle Background', 'Backgrounds', 'Background rang badalta rahe', ['section', 'block'], []);
  jsEffect('bg-scroll-color', 'Scroll Color Background', 'Backgrounds', 'Scroll par background rang badle', ['section'], [colorOpt('color1', 'Color 1', '#fff3e8'), colorOpt('color2', 'Color 2', '#f3eaff')], function (el, o) {
    if (el.dataset.oryneBgScroll) return; el.dataset.oryneBgScroll = '1';
    window.addEventListener('scroll', function () { var r = el.getBoundingClientRect(); el.style.background = (r.top < window.innerHeight / 2) ? (o.color2 || '#f3eaff') : (o.color1 || '#fff3e8'); }, { passive: true });
  });

  /* ---- Block Designer (4) ---- */
  cssEffect('block-bg', 'Block Background', 'Images & Blocks', 'Block ko rang aur padding de', ['block', 'section'], [colorOpt('color1', 'Background', '#fff7ed')]);
  cssEffect('block-padding', 'Block Padding', 'Images & Blocks', 'Block ke andar fasla', ['block', 'section'], [rangeOpt('radius', 'Padding (px)', 24, 0, 60, 4)]);
  cssEffect('block-glass', 'Glass Block', 'Images & Blocks', 'Sheeshe jaisa card', ['block', 'section'], []);
  cssEffect('block-minimal', 'Minimal Block', 'Images & Blocks', 'Saaf minimal card', ['block', 'section'], []);

  /* ---- Navigation / Header / Menu (10) ---- */
  jsEffect('back-to-top', 'Back to Top Button', 'Navigation & Header', 'Neeche scroll par upar jane ka button', ['any'], [textOpt('label', 'Button label', '↑ Top')], function (el, o) {
    if (document.querySelector('.oryne-backtop')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'oryne-backtop'; b.textContent = o.label || '↑ Top';
    b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.body.appendChild(b);
    window.addEventListener('scroll', function () { b.classList.toggle('oryne-show', window.scrollY > 400); }, { passive: true });
  });
  jsEffect('loading-screen', 'Loading Screen', 'Marketing & Widgets', 'Site khulte waqt branded loading screen', ['any'], [textOpt('text', 'Loading text', 'Oryne'), rangeOpt('delay', 'Show (ms)', 900, 300, 2500, 100)], function (el, o) {
    if (document.querySelector('.oryne-loader')) return;
    var d = document.createElement('div'); d.className = 'oryne-loader'; d.innerHTML = '<div class="oryne-loader-inner">' + LOGO_SVG + '<p>' + esc(o.text || 'Oryne') + '</p><div class="oryne-loader-bar"><span></span></div></div>';
    document.body.appendChild(d);
    setTimeout(function () { d.classList.add('oryne-done'); setTimeout(function () { d.remove(); }, 600); }, parseInt(o.delay, 10) || 900);
  });
  jsEffect('scroll-indicators', 'Scroll Indicators', 'Navigation & Header', 'Sections par jump karne wale dots', ['any'], [], function (el, o) {
    if (document.querySelector('.oryne-dots')) return;
    var secs = $$('section[data-section-id], .page-section'); if (!secs.length) return;
    var nav = document.createElement('div'); nav.className = 'oryne-dots';
    secs.forEach(function (sec, i) { var b = document.createElement('button'); b.type = 'button'; b.textContent = String(i + 1); b.title = sec.id || ('Section ' + (i + 1)); b.addEventListener('click', function () { sec.scrollIntoView({ behavior: 'smooth' }); }); nav.appendChild(b); });
    document.body.appendChild(nav);
  });
  cssEffect('dropdown-designer', 'Dropdown Designer', 'Navigation & Header', 'Dropdown ko styled menu banaye', ['header', 'block'], []);
  cssEffect('header-transparent', 'Transparent Header', 'Navigation & Header', 'Header transparent ho', ['header'], []);
  cssEffect('header-centered', 'Centered Header', 'Navigation & Header', 'Logo center mein, nav neeche', ['header'], []);
  cssEffect('header-shadow', 'Header Shadow', 'Navigation & Header', 'Header par shadow aur border', ['header'], []);
  jsEffect('mobile-menu', 'Mobile Menu Designer', 'Navigation & Header', 'Mobile par hamburger menu', ['header'], [], function (el, o) {
    if (el.querySelector('.oryne-hamburger')) return;
    var nav = el.querySelector('nav'); if (!nav) return;
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'oryne-hamburger'; btn.textContent = '☰ Menu';
    btn.addEventListener('click', function () { nav.classList.toggle('oryne-nav-open'); });
    el.insertBefore(btn, nav);
  });
  jsEffect('slide-in-menu', 'Slide-in Menu', 'Navigation & Header', 'Side se slide hone wala menu', ['header', 'any'], [textOpt('links', 'Links (Title: URL, comma se)', 'Home: #, Services: #services, Pricing: #pricing, Contact: #contact')], function (el, o) {
    if (document.querySelector('.oryne-slide-menu')) return;
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'oryne-slide-btn'; btn.textContent = '☰ Menu';
    var drawer = document.createElement('div'); drawer.className = 'oryne-slide-menu';
    drawer.innerHTML = '<button class="oryne-slide-close" type="button">✕</button><h3>Menu</h3>';
    String(o.links || '').split(',').forEach(function (part) { var bits = part.split(':'); if (bits.length < 2) return; var a = document.createElement('a'); a.href = bits.slice(1).join(':').trim(); a.textContent = bits[0].trim(); drawer.appendChild(a); });
    btn.addEventListener('click', function () { drawer.classList.add('oryne-open'); });
    drawer.querySelector('.oryne-slide-close').addEventListener('click', function () { drawer.classList.remove('oryne-open'); });
    document.body.appendChild(btn); document.body.appendChild(drawer);
  });
  jsEffect('search-bar', 'Search Bar', 'Marketing & Widgets', 'Header mein search, page par dhoonde', ['header', 'section'], [textOpt('placeholder', 'Placeholder', 'Search this site...')], function (el, o) {
    if (el.querySelector('.oryne-searchbar')) return;
    var wrap = document.createElement('div'); wrap.className = 'oryne-searchbar';
    wrap.innerHTML = '<input type="search" placeholder="' + esc(o.placeholder || 'Search...') + '" aria-label="Search"><span class="oryne-search-count"></span>';
    var input = wrap.querySelector('input'); var count = wrap.querySelector('.oryne-search-count');
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase(); if (!q) { count.textContent = ''; return; }
      var hits = $$('h1, h2, h3, p').filter(function (n) { return n.textContent.toLowerCase().indexOf(q) !== -1; });
      count.textContent = hits.length + ' found';
      if (hits[0]) hits[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    (el.querySelector('nav') || el).appendChild(wrap);
  });
  jsEffect('video-popup', 'Video Popup Button', 'Marketing & Widgets', 'Button dabate hi video popup mein khule', ['block', 'button'], [textOpt('url', 'Video URL (YouTube embed)', 'https://www.youtube.com/embed/dQw4w9WgXcQ'), textOpt('label', 'Button label', '▶ Watch Video')], function (el, o) {
    if (el.querySelector('.oryne-video-btn')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'oryne-video-btn'; b.textContent = o.label || '▶ Watch Video';
    b.addEventListener('click', function () {
      var m = document.createElement('div'); m.className = 'oryne-popup'; m.innerHTML = '<div class="oryne-popup-card" style="max-width:640px"><button class="oryne-popup-close" aria-label="Close">&times;</button><iframe width="100%" height="315" src="' + esc(o.url || '') + '" frameborder="0" allowfullscreen></iframe></div>';
      m.querySelector('.oryne-popup-close').addEventListener('click', function () { m.remove(); });
      m.addEventListener('click', function (e) { if (e.target === m) m.remove(); });
      document.body.appendChild(m);
    });
    el.appendChild(b);
  });
  jsEffect('custom-cursor', 'Custom Cursors', 'Marketing & Widgets', 'Cursor ko star / dot / emoji banaye', ['any'], [selectOpt('style', 'Cursor style', 'star', ['star', 'dot', 'emoji']), textOpt('emoji', 'Emoji (agar emoji ho)', '✨')], function (el, o) {
    if (document.querySelector('.oryne-cursor')) return;
    var c = document.createElement('div'); c.className = 'oryne-cursor';
    c.textContent = (o.style === 'emoji') ? (o.emoji || '✨') : ((o.style === 'dot') ? '•' : '✦');
    document.body.appendChild(c);
    document.addEventListener('mousemove', function (e) { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
  });
  jsEffect('cookie-banner', 'Cookie Banner Designer', 'Marketing & Widgets', 'Neeche cookie banner dikhaye', ['any'], [selectOpt('style', 'Banner style', 'dark', ['dark', 'light', 'pill']), textOpt('text', 'Banner text', 'We use cookies to improve your experience.')], function (el, o) {
    if (document.querySelector('.oryne-cookie')) return;
    var b = document.createElement('div'); b.className = 'oryne-cookie oryne-cookie-' + (o.style || 'dark');
    b.innerHTML = '<p>' + esc(o.text || '') + '</p><div><button type="button" class="oryne-cookie-accept">Accept</button><button type="button" class="oryne-cookie-decline">Decline</button></div>';
    b.querySelector('.oryne-cookie-accept').addEventListener('click', function () { b.remove(); });
    b.querySelector('.oryne-cookie-decline').addEventListener('click', function () { b.remove(); });
    document.body.appendChild(b);
  });
  jsEffect('live-chat', 'Live Chat Buttons', 'Marketing & Widgets', 'Floating WhatsApp / Messenger / Email buttons', ['any'], [textOpt('whatsapp', 'WhatsApp number', '923000000000'), textOpt('email', 'Email', 'hello@example.com')], function (el, o) {
    if (document.querySelector('.oryne-chat')) return;
    var w = document.createElement('div'); w.className = 'oryne-chat';
    w.innerHTML = '<a href="https://wa.me/' + esc(o.whatsapp || '') + '" target="_blank" rel="noopener" title="WhatsApp">💬</a><a href="mailto:' + esc(o.email || '') + '" title="Email">✉️</a>';
    document.body.appendChild(w);
  });
  cssEffect('announce-slide', 'Announcement Slide', 'Navigation & Header', 'Announcement bar slide kare', ['header', 'block', 'text'], []);
  cssEffect('announce-marquee', 'Announcement Marquee', 'Navigation & Header', 'Announcement text chalti rahe', ['header', 'block', 'text'], [textOpt('text', 'Text', 'Free delivery on orders over $50')]);

  /* ---- Content widgets (12) ---- */
  jsEffect('vertical-tabs', 'Vertical Tabs', 'Content', 'Section ko vertical tabs banaye', ['section', 'block'], [], function (el, o) {
    if (el.dataset.oryneTabs) return; el.dataset.oryneTabs = '1';
    var kids = $$(':scope > *', el); if (kids.length < 2) return;
    el.classList.add('oryne-tabs');
    var bar = document.createElement('div'); bar.className = 'oryne-tab-bar';
    var body = document.createElement('div'); body.className = 'oryne-tab-body';
    kids.forEach(function (k, i) {
      var title = (k.querySelector('h3, h2, strong') || {}).textContent || ('Tab ' + (i + 1));
      var b = document.createElement('button'); b.type = 'button'; b.textContent = title.trim().slice(0, 24);
      b.addEventListener('click', function () { $$('.oryne-tab-bar button', el).forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); $$('.oryne-tab-pane', body).forEach(function (x, j) { x.style.display = (j === i) ? '' : 'none'; }); });
      bar.appendChild(b);
      var pane = document.createElement('div'); pane.className = 'oryne-tab-pane'; pane.style.display = i ? 'none' : ''; pane.appendChild(k); body.appendChild(pane);
      if (i === 0) b.classList.add('active');
    });
    el.appendChild(bar); el.appendChild(body);
  });
  jsEffect('flex-cards', 'Flex Cards', 'Content', 'Gallery ko flex cards banaye, hover par phailen', ['block', 'section'], [], function (el, o) {
    if (el.dataset.oryneFlex) return; el.dataset.oryneFlex = '1';
    el.classList.add('oryne-flex-cards');
    $$(':scope > *', el).forEach(function (c) { c.classList.add('oryne-flex-card'); });
  });
  jsEffect('event-calendar', 'Event Calendar', 'Content', 'Month calendar banaye, events ke saath', ['block', 'section'], [textOpt('events', 'Events (YYYY-MM-DD: Name, comma se)', '2026-11-25: Launch Day, 2026-12-01: Workshop')], function (el, o) {
    if (el.querySelector('.oryne-calendar')) return;
    var events = {}; String(o.events || '').split(',').forEach(function (part) { var bits = part.split(':'); if (bits.length < 2) return; var d = bits[0].trim(); events[d] = bits.slice(1).join(':').trim(); });
    var now = new Date(); var y = now.getFullYear(), m = now.getMonth();
    var first = new Date(y, m, 1).getDay(); var days = new Date(y, m + 1, 0).getDate();
    var html = '<div class="oryne-calendar"><h3>' + now.toLocaleString('en', { month: 'long', year: 'numeric' }) + '</h3><div class="oryne-cal-grid"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>';
    for (var i = 0; i < first; i++) html += '<span></span>';
    for (var d = 1; d <= days; d++) { var key = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); html += '<span class="oryne-cal-day' + (events[key] ? ' has-event' : '') + '" title="' + esc(events[key] || '') + '">' + d + '</span>'; }
    html += '</div><p class="oryne-cal-note">' + esc(Object.keys(events).map(function (k) { return k + ': ' + events[k]; }).join(' · ') || 'No events this month') + '</p></div>';
    var wrap = document.createElement('div'); wrap.innerHTML = html; el.appendChild(wrap.firstChild);
  });
  cssEffect('pricing-plan', 'Pricing Plan Designer', 'Content', 'Pricing cards ko styled plan banaye', ['block', 'section'], [colorOpt('color1', 'Accent color', '#7b2fff')]);
  jsEffect('smart-filter', 'Smart Filter', 'Content', 'List par filter buttons lagaye', ['section', 'block'], [textOpt('filters', 'Filters (comma se)', 'All, Design, Branding, Shop')], function (el, o) {
    if (el.querySelector('.oryne-filter-bar')) return;
    var bar = document.createElement('div'); bar.className = 'oryne-filter-bar';
    var items = $$(':scope > *', el).filter(function (c) { return !c.classList.contains('oryne-filter-bar'); });
    String(o.filters || 'All').split(',').forEach(function (f) {
      var name = f.trim(); if (!name) return;
      var b = document.createElement('button'); b.type = 'button'; b.textContent = name;
      b.addEventListener('click', function () { $$('.oryne-filter-bar button', el).forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); items.forEach(function (it) { it.style.display = (name === 'All' || it.textContent.toLowerCase().indexOf(name.toLowerCase()) !== -1) ? '' : 'none'; }); });
      bar.appendChild(b);
    });
    el.insertBefore(bar, el.firstChild);
  });
  cssEffect('list-grid', 'List Grid Designer', 'Content', 'List ko grid banaye', ['block', 'section'], []);
  cssEffect('list-cards', 'List Cards Designer', 'Content', 'List items ko cards banaye', ['block', 'section'], []);
  cssEffect('blog-banner', 'Blog Post Banner', 'Content', 'Blog post par bada banner', ['section', 'block'], [colorOpt('color1', 'Banner color', '#ff6a00')]);
  jsEffect('video-block-designer', 'Video Block Designer', 'Content', 'Video block ko framed player banaye', ['block', 'section'], [], function (el, o) {
    if (el.dataset.oryneVideo) return; el.dataset.oryneVideo = '1';
    el.classList.add('oryne-video-block');
    var imgs = $$('img', el); if (imgs.length) { var badge = document.createElement('span'); badge.className = 'oryne-play-badge'; badge.textContent = '▶'; el.appendChild(badge); }
  });
  jsEffect('sale-label', 'Sale Label', 'Content', 'Product par SALE badge lagaye', ['block', 'image'], [textOpt('label', 'Label', 'SALE -20%')], function (el, o) {
    if (el.querySelector('.oryne-badge-sale')) return;
    var s = document.createElement('span'); s.className = 'oryne-badge oryne-badge-sale'; s.textContent = o.label || 'SALE'; el.appendChild(s);
  });
  jsEffect('soldout-label', 'Sold Out Label', 'Content', 'Product par SOLD OUT badge lagaye', ['block', 'image'], [textOpt('label', 'Label', 'SOLD OUT')], function (el, o) {
    if (el.querySelector('.oryne-badge-sold')) return;
    var s = document.createElement('span'); s.className = 'oryne-badge oryne-badge-sold'; s.textContent = o.label || 'SOLD OUT'; el.appendChild(s);
  });
  cssEffect('carousel-dots', 'Carousel Dots', 'Content', 'Carousel ko dots style de', ['block', 'section'], []);
  cssEffect('testimonial-card', 'Testimonial Card', 'Content', 'Testimonial ko card style de', ['block', 'section'], []);

  var CATEGORIES = ['Typography', 'Images & Blocks', 'Buttons', 'Animations & Motion', 'Backgrounds', 'Navigation & Header', 'Content', 'Marketing & Widgets'];

  /* ---------- Oryne logo (original mark, inline SVG) ---------- */
  var LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><defs><linearGradient id="oryne-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6a00"/><stop offset="1" stop-color="#7b2fff"/></linearGradient></defs><circle cx="32" cy="34" r="22" fill="none" stroke="url(#oryne-g)" stroke-width="7" stroke-linecap="round" stroke-dasharray="118 22" transform="rotate(-38 32 34)"/><path d="M46 6 L48.4 12.6 L55 15 L48.4 17.4 L46 24 L43.6 17.4 L37 15 L43.6 12.6 Z" fill="url(#oryne-g)"/><circle cx="32" cy="34" r="7" fill="url(#oryne-g)" opacity="0.9"/></svg>';

  /* ---------- Runtime: apply saved config ---------- */
  var SCROLL_FX = ['fade-up', 'fade-in', 'slide-left', 'slide-right', 'zoom-in', 'reveal-scroll', 'stagger-children', 'flip-in', 'bounce-in', 'rotate-in', 'blur-in', 'fade-down', 'slide-up', 'scale-in', 'skew-in', 'momentum-scroll', 'reveal-left', 'reveal-right', 'reveal-zoom'];
  var observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('oryne-visible'); observer.unobserve(en.target); } });
    }, { threshold: 0.12 });
  }

  var VAR_UNITS = { duration: 's', delay: 's', angle: 'deg', spacing: 'em', radius: 'px', rotate: 'deg', borderWidth: 'px', top: 'px', stagger: 'ms' };
  var VAR_NAMES = { duration: '--oryne-duration', delay: '--oryne-delay', angle: '--oryne-angle', spacing: '--oryne-spacing', radius: '--oryne-radius', rotate: '--oryne-rotate', borderWidth: '--oryne-border-width', top: '--oryne-top', stagger: '--oryne-stagger', color1: '--oryne-color1', color2: '--oryne-color2', highlight: '--oryne-highlight', glow: '--oryne-glow', headerBg: '--oryne-header-bg' };

  function applyOptions(el, options) {
    if (!options) return;
    Object.keys(options).forEach(function (k) {
      var varName = VAR_NAMES[k]; if (!varName) return;
      var v = options[k]; if (v === '' || v == null) return;
      el.style.setProperty(varName, v + (VAR_UNITS[k] || ''));
    });
  }

  function applyEffect(el, item) {
    var fx = EFFECTS[item.effect]; if (!fx || !el) return;
    el.classList.add(fx.cssClass);
    applyOptions(el, item.options || {});
    if (SCROLL_FX.indexOf(item.effect) !== -1) {
      if (observer) observer.observe(el);
      else el.classList.add('oryne-visible');
    }
    if (fx.js) { try { fx.js(el, item.options || {}); } catch (e) { /* effect failed, page must keep working */ } }
  }

  function applyConfig(cfg) {
    cfg = cfg || loadConfig();
    (cfg.items || []).forEach(function (item) {
      if (!item.target || !item.effect) return;
      var els = [];
      try { els = $$(item.target); } catch (e) { return; }
      els.forEach(function (el) { applyEffect(el, item); });
    });
  }

  /* ---------- Target helpers (Squarespace 7.1 DOM) ---------- */
  var SELECTABLE = 'section[data-section-id], [data-block-id], .sqs-block, header, .header, h1, h2, h3, p, img, a.sqs-block-button, .sqs-block-button, button';
  function detectType(el) {
    if (!el) return 'any';
    if (el.closest('header') || el.tagName === 'HEADER') return 'header';
    if (el.matches('a.sqs-block-button, .sqs-block-button, button, .sqs-button-element')) return 'button';
    if (el.tagName === 'IMG' || el.classList.contains('sqs-block-image')) return 'image';
    if (/^H[123]$/.test(el.tagName) || el.tagName === 'P') return 'text';
    if (el.tagName === 'SECTION' || el.dataset.sectionId) return 'section';
    if (el.dataset.blockId) return 'block';
    return 'any';
  }
  function selectorFor(el) {
    if (!el) return 'body';
    if (el.dataset && el.dataset.blockId) return '[data-block-id="' + el.dataset.blockId + '"]';
    if (el.dataset && el.dataset.sectionId) return '[data-section-id="' + el.dataset.sectionId + '"]';
    if (el.id) return '#' + el.id;
    var path = [], node = el;
    while (node && node !== document.body && path.length < 4) {
      var tag = node.tagName.toLowerCase();
      var sibs = node.parentNode ? Array.prototype.filter.call(node.parentNode.children, function (c) { return c.tagName === node.tagName; }) : [node];
      path.unshift(tag + (sibs.length > 1 ? ':nth-of-type(' + (sibs.indexOf(node) + 1) + ')' : ''));
      node = node.parentNode;
    }
    return path.join(' > ');
  }
  function allSelectorFor(el) {
    var t = detectType(el);
    if (t === 'button') return '.sqs-block-button, a.sqs-button, .sqs-button-element, button';
    if (t === 'text') return el.tagName && /^H[123]$/.test(el.tagName) ? 'h1, h2, h3' : 'p';
    if (t === 'image') return 'img';
    if (t === 'section') return 'section[data-section-id], .page-section';
    if (t === 'header') return 'header, .header';
    if (t === 'block') return '[data-block-id], .sqs-block';
    return '[data-block-id], .sqs-block';
  }
  function labelFor(el) {
    if (!el) return 'Nothing selected';
    var id = el.dataset && (el.dataset.blockId || el.dataset.sectionId);
    return detectType(el) + ' · ' + el.tagName.toLowerCase() + (id ? ' · ' + id.slice(0, 18) : '') + ' · ' + (el.textContent || '').trim().slice(0, 40);
  }

  /* ---------- Public API ---------- */
  window.Oryne = {
    version: '2.2.0', EFFECTS: EFFECTS,
    refresh: function () { applyConfig(loadConfig()); },
    getConfig: loadConfig,
    applyConfig: applyConfig
  };

  function boot() {
    applyConfig(loadConfig());
    // Footer config snippet runs after the header loader, so re-check shortly after load.
    window.addEventListener('load', function () { setTimeout(function () { applyConfig(loadConfig()); }, 400); });
    buildEditor();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ---------- Editor: floating button + right-side panel ---------- */
  var editorState = { selectedEl: null, selectedEffect: null, scope: 'single', options: {}, openCat: 'Typography', pickMode: false, blockList: [] };

  function buildEditor() {
    if (window.__ORYNE_NO_EDITOR__) return;
    if (new URLSearchParams(window.location.search).get('oryne') === 'hide') return;
    if ($('.oryne-fab')) return;

    var fab = document.createElement('button');
    fab.className = 'oryne-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Open Oryne editor'); fab.title = 'Oryne';
    fab.innerHTML = LOGO_SVG;
    document.body.appendChild(fab);

    var panel = document.createElement('div');
    panel.className = 'oryne-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Oryne editor');
    panel.innerHTML =
      '<div class="oryne-panel-head"><div style="display:flex;gap:10px;align-items:center">' + LOGO_SVG +
      '<div><h2>Oryne</h2><p>No-code editor for Squarespace 7.1</p></div></div>' +
      '<button class="oryne-btn" data-act="close" type="button">✕</button></div>' +
      '<div class="oryne-panel-body">' +
      '<div class="oryne-selected-info" data-role="selected">Select a block: click any text, image, button or section on the page while this panel is open.</div>' +
      '<button class="oryne-btn oryne-btn-primary oryne-pick-btn" data-act="pick" type="button">\u{1F446} Block choose karo</button>' +
      '<div class="oryne-field"><label>Block list se choose karo</label><select class="oryne-blocklist" data-role="blocklist"><option value="">\u2014 List se block choose karo \u2014</option></select></div>' +
      '<div class="oryne-scope"><button type="button" data-scope="single" class="active">Single element</button><button type="button" data-scope="all">All of this type</button></div>' +
      '<div data-role="options"></div><input class="oryne-search" data-role="search" type="search" placeholder="Search effects... (e.g. tabs, calendar, cursor)"><div class="oryne-cat-tools"><button type="button" class="oryne-btn" data-act="expand-all">Expand all \u25BE</button><button type="button" class="oryne-btn" data-act="collapse-all">Collapse all \u25B8</button></div><div data-role="effects"></div><div data-role="applied"></div>' +
      '<div class="oryne-field"><label>Generated footer code (paste in Code Injection &gt; Footer)</label>' +
      '<textarea class="oryne-code" data-role="code" readonly placeholder="Click Generate Code after saving…"></textarea></div>' +
      '</div>' +
      '<div class="oryne-panel-foot">' +
      '<button class="oryne-btn oryne-btn-primary" data-act="save" type="button">Save</button>' +
      '<button class="oryne-btn" data-act="generate" type="button">Generate Code</button>' +
      '<button class="oryne-btn" data-act="copy" type="button">Copy Code</button>' +
      '<button class="oryne-btn" data-act="export" type="button">Export JSON</button>' +
      '<button class="oryne-btn" data-act="import" type="button">Import</button>' +
      '<button class="oryne-btn" data-act="reset" type="button">Reset</button>' +
      '<button class="oryne-btn" data-act="reset-pos" type="button" title="Button wapas bottom-right, panel wapas right side">Reset positions</button>' +
      '<input type="file" accept=".json,application/json" data-role="file" style="display:none">' +
      '</div>';
    document.body.appendChild(panel);

    /* v2.2: floating button draggable (mouse + touch). Tap = open panel, drag = move. */
    var fabPos = loadPos(FAB_POS_KEY);
    if (fabPos) { fab.style.left = fabPos.left + 'px'; fab.style.top = fabPos.top + 'px'; fab.style.right = 'auto'; fab.style.bottom = 'auto'; }
    var fabDragged = false, fabDrag = null;
    fab.addEventListener('pointerdown', function (e) {
      var r = fab.getBoundingClientRect();
      fabDrag = { x: e.clientX, y: e.clientY, left: r.left, top: r.top, moved: false };
      try { fab.setPointerCapture(e.pointerId); } catch (err) {}
    });
    fab.addEventListener('pointermove', function (e) {
      if (!fabDrag) return;
      var dx = e.clientX - fabDrag.x, dy = e.clientY - fabDrag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) fabDrag.moved = true;
      if (!fabDrag.moved) return;
      fabDragged = true; fab.classList.add('oryne-dragging');
      var r = fab.getBoundingClientRect();
      fab.style.left = Math.max(0, Math.min(window.innerWidth - r.width, fabDrag.left + dx)) + 'px';
      fab.style.top = Math.max(0, Math.min(window.innerHeight - r.height, fabDrag.top + dy)) + 'px';
      fab.style.right = 'auto'; fab.style.bottom = 'auto';
    });
    function fabDragEnd() {
      if (!fabDrag) return;
      if (fabDrag.moved) savePos(FAB_POS_KEY, parseFloat(fab.style.left) || 0, parseFloat(fab.style.top) || 0);
      fab.classList.remove('oryne-dragging'); fabDrag = null;
      setTimeout(function () { fabDragged = false; }, 350);
    }
    fab.addEventListener('pointerup', fabDragEnd);
    fab.addEventListener('pointercancel', fabDragEnd);
    fab.addEventListener('click', function () { if (fabDragged) { fabDragged = false; return; } panel.classList.toggle('oryne-open'); refreshBlockList(); renderEffects(); renderApplied(); });
    panel.querySelector('[data-act="pick"]').addEventListener('click', function () {
      editorState.pickMode = true; panel.classList.remove('oryne-open'); showPickBanner();
    });
    panel.querySelector('[data-act="expand-all"]').addEventListener('click', function () { editorState.openCat = '__all__'; renderEffects(); });
    panel.querySelector('[data-act="collapse-all"]').addEventListener('click', function () { editorState.openCat = null; renderEffects(); });
    panel.querySelector('[data-role="blocklist"]').addEventListener('change', function (e) {
      var idx = parseInt(e.target.value, 10); var el = editorState.blockList[idx];
      if (!el) return; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); selectElement(el);
    });
    panel.querySelector('[data-role="search"]').addEventListener('input', function (e) { editorState.query = e.target.value; renderEffects(); });
    panel.querySelector('[data-act="close"]').addEventListener('click', function () { panel.classList.remove('oryne-open'); });
    /* v2.2: editor panel draggable by its header (mouse + touch). Close button still closes. */
    var panelHead = panel.querySelector('.oryne-panel-head');
    panelHead.classList.add('oryne-drag-handle');
    panelHead.setAttribute('title', 'Header se pakad kar panel ko kahin bhi le jao');
    function applyPanelPos(pos) {
      var top = Math.max(0, Math.min(pos.top, Math.max(0, window.innerHeight - 60)));
      var left = Math.max(0, Math.min(pos.left, Math.max(0, window.innerWidth - 80)));
      panel.style.left = left + 'px'; panel.style.top = top + 'px';
      panel.style.right = 'auto'; panel.style.bottom = 'auto';
      panel.style.height = Math.min(window.innerHeight - top, window.innerHeight) + 'px';
    }
    var savedPanelPos = loadPos(PANEL_POS_KEY);
    if (savedPanelPos) applyPanelPos(savedPanelPos);
    var panelDrag = null;
    panelHead.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('[data-act="close"]')) return;
      var r = panel.getBoundingClientRect();
      panelDrag = { x: e.clientX, y: e.clientY, left: r.left, top: r.top, w: r.width, h: r.height, moved: false };
      try { panelHead.setPointerCapture(e.pointerId); } catch (err) {}
    });
    panelHead.addEventListener('pointermove', function (e) {
      if (!panelDrag) return;
      var dx = e.clientX - panelDrag.x, dy = e.clientY - panelDrag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) panelDrag.moved = true;
      if (!panelDrag.moved) return;
      panel.classList.add('oryne-dragging');
      if (!panel.style.left) {
        panel.style.left = panelDrag.left + 'px'; panel.style.top = panelDrag.top + 'px';
        panel.style.right = 'auto'; panel.style.bottom = 'auto'; panel.style.height = panelDrag.h + 'px';
      }
      var nl = Math.max(0, Math.min(window.innerWidth - 80, panelDrag.left + dx));
      var nt = Math.max(0, Math.min(window.innerHeight - 48, panelDrag.top + dy));
      panel.style.left = nl + 'px'; panel.style.top = nt + 'px';
      panel.style.height = Math.min(panelDrag.h, window.innerHeight - nt) + 'px';
    });
    function panelDragEnd() {
      if (!panelDrag) return;
      if (panelDrag.moved) savePos(PANEL_POS_KEY, parseFloat(panel.style.left) || 0, parseFloat(panel.style.top) || 0);
      panel.classList.remove('oryne-dragging'); panelDrag = null;
    }
    panelHead.addEventListener('pointerup', panelDragEnd);
    panelHead.addEventListener('pointercancel', panelDragEnd);
    window.addEventListener('resize', function () {
      var p = loadPos(PANEL_POS_KEY); if (p) applyPanelPos(p);
      var f = loadPos(FAB_POS_KEY);
      if (f) {
        fab.style.left = Math.max(0, Math.min(f.left, Math.max(0, window.innerWidth - 56))) + 'px';
        fab.style.top = Math.max(0, Math.min(f.top, Math.max(0, window.innerHeight - 56))) + 'px';
      }
    });
    panel.querySelectorAll('[data-scope]').forEach(function (b) {
      b.addEventListener('click', function () {
        editorState.scope = b.dataset.scope;
        panel.querySelectorAll('[data-scope]').forEach(function (x) { x.classList.toggle('active', x === b); });
      });
    });
    panel.querySelector('[data-act="save"]').addEventListener('click', saveCurrent);
    panel.querySelector('[data-act="generate"]').addEventListener('click', generateCode);
    panel.querySelector('[data-act="copy"]').addEventListener('click', function () { var ta = panel.querySelector('[data-role="code"]'); if (ta.value) { ta.select(); document.execCommand('copy'); } });
    panel.querySelector('[data-act="export"]').addEventListener('click', exportJSON);
    panel.querySelector('[data-act="import"]').addEventListener('click', function () { panel.querySelector('[data-role="file"]').click(); });
    panel.querySelector('[data-role="file"]').addEventListener('change', importJSON);
    panel.querySelector('[data-act="reset"]').addEventListener('click', function () {
      if (!confirm('Reset all Oryne effects?')) return;
      saveConfig(defaultConfig()); location.reload();
    });
    panel.querySelector('[data-act="reset-pos"]').addEventListener('click', function () {
      try { LS.removeItem(FAB_POS_KEY); LS.removeItem(PANEL_POS_KEY); } catch (e) {}
      fab.style.left = ''; fab.style.top = ''; fab.style.right = ''; fab.style.bottom = '';
      panel.style.left = ''; panel.style.top = ''; panel.style.right = ''; panel.style.bottom = ''; panel.style.height = '';
    });

    // Click-to-select: capture clicks while the panel is open.
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.oryne-pick-banner')) return;
      if (!panel.classList.contains('oryne-open') && !editorState.pickMode) return;
      if (e.target.closest('.oryne-panel') || e.target.closest('.oryne-fab')) return;
      var hit = e.target.closest ? e.target.closest(SELECTABLE) : null;
      if (!hit) return;
      e.preventDefault(); e.stopPropagation();
      if (editorState.pickMode) { editorState.pickMode = false; hidePickBanner(); panel.classList.add('oryne-open'); refreshBlockList(); renderEffects(); }
      selectElement(hit);
    }, true);
    document.addEventListener('mouseover', function (e) {
      if (!panel.classList.contains('oryne-open')) return;
      if (e.target.closest && e.target.closest('.oryne-panel, .oryne-fab')) return;
      var hit = e.target.closest ? e.target.closest(SELECTABLE) : null;
      $$('.oryne-selecting').forEach(function (x) { x.classList.remove('oryne-selecting'); });
      if (hit) hit.classList.add('oryne-selecting');
    });

    function showPickBanner() {
      hidePickBanner();
      var b = document.createElement('div'); b.className = 'oryne-pick-banner';
      b.innerHTML = '<span>Kisi bhi block par tap karo \u2014 select hote hi panel wapas khul jayega.</span><button type="button">Cancel</button>';
      b.querySelector('button').addEventListener('click', function () { editorState.pickMode = false; hidePickBanner(); panel.classList.add('oryne-open'); });
      document.body.appendChild(b);
    }
    function hidePickBanner() { var b = document.querySelector('.oryne-pick-banner'); if (b) b.remove(); }
    function refreshBlockList() {
      var sel = panel.querySelector('[data-role="blocklist"]'); if (!sel) return;
      editorState.blockList = $$(SELECTABLE).filter(function (el, i, arr) { return arr.indexOf(el) === i; }).slice(0, 80);
      sel.innerHTML = '<option value="">\u2014 List se block choose karo \u2014</option>';
      editorState.blockList.forEach(function (el, i) {
        var o = document.createElement('option'); o.value = String(i); o.textContent = (i + 1) + '. ' + labelFor(el); sel.appendChild(o);
      });
    }
    function selectElement(el) {
      if (editorState.selectedEl) editorState.selectedEl.classList.remove('oryne-selected');
      editorState.selectedEl = el; el.classList.add('oryne-selected');
      panel.querySelector('[data-role="selected"]').textContent = 'Selected: ' + labelFor(el) + '  ·  Scope: ' + editorState.scope;
      renderApplied();
    }
    function renderEffects() {
      var host = panel.querySelector('[data-role="effects"]'); host.innerHTML = '';
      var q = editorState.query ? editorState.query.toLowerCase() : '';
      CATEGORIES.forEach(function (cat) {
        var ids = Object.keys(EFFECTS).filter(function (id) {
          var fx = EFFECTS[id]; if (fx.category !== cat) return false;
          if (q && (fx.name + ' ' + fx.desc + ' ' + id).toLowerCase().indexOf(q) === -1) return false;
          return true;
        });
        if (!ids.length) return; // empty category heading never shown
        var open = q ? true : (editorState.openCat === '__all__' || editorState.openCat === cat);
        var wrap = document.createElement('div'); wrap.className = 'oryne-cat-wrap';
        var head = document.createElement('button'); head.type = 'button'; head.className = 'oryne-cat-btn';
        head.innerHTML = '<span>' + esc(cat) + '</span><span><span class="oryne-cat-count">' + ids.length + '</span><span class="oryne-cat-arrow">' + (open ? '\u25BE' : '\u25B8') + '</span></span>';
        head.addEventListener('click', function () { editorState.openCat = (editorState.openCat === cat) ? null : cat; renderEffects(); });
        wrap.appendChild(head);
        var body = document.createElement('div'); body.className = 'oryne-cat-body' + (open ? ' oryne-open' : '');
        ids.forEach(function (id) {
          var fx = EFFECTS[id];
          var row = document.createElement('div'); row.className = 'oryne-effect' + (editorState.selectedEffect === id ? ' active' : '');
          row.innerHTML = '<div><b>' + esc(fx.name) + '</b><small>' + esc(fx.desc) + '</small></div><button class="oryne-btn" type="button">Apply</button>';
          row.querySelector('button').addEventListener('click', function () {
            editorState.selectedEffect = id; editorState.options = {};
            (fx.options || []).forEach(function (o) { editorState.options[o.key] = o.default; });
            renderOptions(); renderEffects(); previewCurrent();
          });
          body.appendChild(row);
        });
        wrap.appendChild(body); host.appendChild(wrap);
      });
    }
    function renderOptions() {
      var host = panel.querySelector('[data-role="options"]'); host.innerHTML = '';
      var fx = EFFECTS[editorState.selectedEffect]; if (!fx) return;
      var title = document.createElement('div'); title.className = 'oryne-cat'; title.textContent = 'Options: ' + fx.name; host.appendChild(title);
      (fx.options || []).forEach(function (o) {
        var wrap = document.createElement('div'); wrap.className = 'oryne-field';
        var lab = document.createElement('label'); lab.textContent = o.label + (o.type === 'range' ? ' (' + editorState.options[o.key] + (o.unit || '') + ')' : '');
        wrap.appendChild(lab);
        var input;
        if (o.type === 'select') { input = document.createElement('select'); (o.choices || []).forEach(function (c) { var opt = document.createElement('option'); opt.value = c; opt.textContent = c; if (c === editorState.options[o.key]) opt.selected = true; input.appendChild(opt); }); }
        else if (o.type === 'color') { input = document.createElement('input'); input.type = 'color'; input.value = editorState.options[o.key]; }
        else if (o.type === 'range') { input = document.createElement('input'); input.type = 'range'; input.min = o.min; input.max = o.max; input.step = o.step || 1; input.value = editorState.options[o.key]; }
        else { input = document.createElement('input'); input.type = 'text'; input.value = editorState.options[o.key]; }
        input.addEventListener('input', function () { editorState.options[o.key] = o.type === 'range' ? parseFloat(input.value) : input.value; if (o.type === 'range') lab.textContent = o.label + ' (' + input.value + (o.unit || '') + ')'; previewCurrent(); });
        input.addEventListener('change', function () { if (o.type === 'select') { editorState.options[o.key] = input.value; previewCurrent(); } });
        wrap.appendChild(input); host.appendChild(wrap);
      });
      if (!(fx.options || []).length) { var p = document.createElement('p'); p.textContent = 'No options — just click Save.'; host.appendChild(p); }
    }
    function currentItem() {
      if (!editorState.selectedEl || !editorState.selectedEffect) return null;
      return { target: editorState.scope === 'all' ? allSelectorFor(editorState.selectedEl) : selectorFor(editorState.selectedEl), effect: editorState.selectedEffect, options: clone(editorState.options), scope: editorState.scope };
    }
    function previewCurrent() {
      var item = currentItem(); if (!item) return;
      $$(item.target).forEach(function (el) { applyEffect(el, item); });
    }
    function saveCurrent() {
      var item = currentItem();
      if (!item) { alert('Pehle koi element select karo, phir koi effect choose karo.'); return; }
      var cfg = loadConfig();
      cfg.items = cfg.items.filter(function (x) { return !(x.target === item.target && x.effect === item.effect); });
      cfg.items.push(item); saveConfig(cfg); renderApplied();
      panel.querySelector('[data-role="selected"]').textContent = 'Saved: ' + item.effect + ' on ' + item.target;
    }
    function renderApplied() {
      var host = panel.querySelector('[data-role="applied"]'); host.innerHTML = '';
      var cfg = loadConfig(); if (!cfg.items.length) return;
      var h = document.createElement('div'); h.className = 'oryne-cat'; h.textContent = 'Saved effects (' + cfg.items.length + ')'; host.appendChild(h);
      cfg.items.forEach(function (item, i) {
        var row = document.createElement('div'); row.className = 'oryne-effect';
        row.innerHTML = '<div><b>' + esc(item.effect) + '</b><small>' + esc(item.target) + ' · ' + esc(item.scope || 'single') + '</small></div><button class="oryne-btn" type="button">Remove</button>';
        row.querySelector('button').addEventListener('click', function () { var c = loadConfig(); c.items.splice(i, 1); saveConfig(c); location.reload(); });
        host.appendChild(row);
      });
    }
    function generateCode() {
      var cfg = loadConfig();
      var code = '<!-- Oryne config: paste in Squarespace > Website Tools > Code Injection > Footer -->\n' +
        '<script>\nwindow.__ORYNE_CONFIG__ = ' + JSON.stringify(cfg, null, 2) + ';\n' +
        'if (window.Oryne) window.Oryne.refresh();\n</script>';
      panel.querySelector('[data-role="code"]').value = code;
    }
    function exportJSON() {
      var blob = new Blob([JSON.stringify(loadConfig(), null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'oryne-config.json'; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }
    function importJSON(e) {
      var file = e.target.files && e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { try { var c = JSON.parse(reader.result); if (c && c.items) { saveConfig(c); location.reload(); } } catch (err) { alert('Invalid JSON file.'); } };
      reader.readAsText(file);
    }
    refreshBlockList(); renderEffects();
  }
})();
