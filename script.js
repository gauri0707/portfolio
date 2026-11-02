(function () {
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  var revealEls = document.querySelectorAll('.reveal');
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(function (el) { observer.observe(el); });

  document.getElementById('year').textContent = new Date().getFullYear();

  // proof triggers (About section hover-reveal)
  var proofStage = document.getElementById('proofStage');
  if (proofStage) {
    var proofTriggers = document.querySelectorAll('.proof-trigger');
    var proofPanels = proofStage.querySelectorAll('.proof-content');
    var activeProof = null;

    function showProof(key) {
      proofStage.classList.add('active');
      proofPanels.forEach(function (p) {
        p.classList.toggle('visible', p.getAttribute('data-panel') === key);
      });
      proofTriggers.forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-proof') === key);
      });
      activeProof = key;
    }
    function hideProof() {
      proofStage.classList.remove('active');
      proofTriggers.forEach(function (t) { t.classList.remove('active'); });
      activeProof = null;
    }

    // Guided demo: a dummy cursor visits each highlighted phrase once, clicks it, and shows the slide.
    // Real hover, click or touch takes over at any time.
    var tour = { run: 0, playing: false, visible: false, touched: false };
    var aboutSec = document.getElementById('about');
    var intro = document.querySelector('.about-intro');
    var tourBtn = document.getElementById('tourBtn');
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // the slide area is never empty: the first slide is open from the start
    showProof('interview');

    proofTriggers.forEach(function (trigger) {
      var key = trigger.getAttribute('data-proof');
      trigger.addEventListener('mouseenter', function () { if (!tour.playing) showProof(key); });
      trigger.addEventListener('focus', function () { if (!tour.playing) showProof(key); });
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        stopTour();
        showProof(key);
      });
    });
    proofStage.addEventListener('pointerdown', function () { tour.touched = true; stopTour(); });

    var cursor = null;
    if (aboutSec && intro) {
      cursor = document.createElement('div');
      cursor.className = 'fake-cursor';
      cursor.setAttribute('aria-hidden', 'true');
      cursor.innerHTML =
        '<svg class="fc-arrow" viewBox="0 0 64 64" width="46" height="46">' +
        '<path d="M9 5.5 L53 33.5 L35.5 38.2 L45.5 58 L36 62.2 L26 42.5 L12.5 55 Z" fill="none" stroke="#2b2622" stroke-width="1.2" stroke-linejoin="round" transform="translate(2.2 2.4)" opacity=".35"/>' +
        '<path d="M8 5 L52 33 L34.5 37.6 L44.5 57.5 L35 61.5 L25 42 L11.5 54.5 Z" fill="#3b3631" stroke="#1f1b18" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<path d="M17.5 17 L30 24.8" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>' +
        '<circle cx="37" cy="29.2" r="2.1" fill="#fff"/><circle cx="43" cy="33.2" r="1.7" fill="#fff"/>' +
        '<path d="M16.5 31 L16.5 40" stroke="#fff" stroke-width="3.2" stroke-linecap="round" transform="rotate(-20 16.5 35)"/>' +
        '<path d="M33 46 L37 54 M36.5 44.5 L40.8 52.5 M29.5 47.5 L33 55" stroke="#8a8076" stroke-width="1.3" stroke-linecap="round"/>' +
        '</svg>' +
        '<span class="fake-cursor-tag">Gauri</span><i class="fake-cursor-ring"></i>';
      aboutSec.appendChild(cursor);
    }

    function pointIn(el, fx, fy) {
      var rects = el.getClientRects();
      var r = rects[0] || el.getBoundingClientRect();
      var box = aboutSec.getBoundingClientRect();
      return { x: r.left - box.left + r.width * fx, y: r.top - box.top + r.height * fy };
    }
    function parkPoint() {
      var box = aboutSec.getBoundingClientRect(), r = intro.getBoundingClientRect();
      return { x: Math.min(box.width - 60, r.right - box.left + 70), y: r.top - box.top + r.height * 0.55 };
    }
    function placeCursor(p, ms) {
      cursor.style.transitionDuration = ms + 'ms';
      cursor.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px)';
    }
    function setTourBtn() {
      if (!tourBtn) return;
      tourBtn.textContent = tour.playing ? 'Skip demo' : 'Replay demo';
      tourBtn.setAttribute('aria-pressed', tour.playing ? 'true' : 'false');
    }
    function stopTour() {
      if (!tour.playing) return;
      tour.run++;
      tour.playing = false;
      if (cursor) cursor.classList.remove('on');
      setTourBtn();
    }
    function wait(ms, id) {
      return new Promise(function (resolve) { setTimeout(function () { resolve(id === tour.run); }, ms); });
    }
    function clickFx() {
      cursor.classList.remove('click');
      void cursor.offsetWidth;
      cursor.classList.add('click');
    }
    // one step = glide to the element, click it, hold for 2 seconds
    function visit(id, find, act, fx, fy, hold) {
      return wait(0, id).then(function (ok) {
        if (!ok) return false;
        while (!tour.visible) { return wait(300, id).then(function () { return visit(id, find, act, fx, fy, hold); }); }
        var target = find();
        if (!target) return true;
        placeCursor(pointIn(target, fx, fy), 900);
        return wait(1000, id).then(function (ok2) {
          if (!ok2) return false;
          clickFx();
          act(target);
          return wait(hold, id);
        });
      });
    }
    function trig(key) { return function () { return intro.querySelector('.proof-trigger[data-proof="' + key + '"]'); }; }
    function tab(key) { return function () { return proofStage.querySelector('.prd-tab[data-prd="' + key + '"]'); }; }
    function showKey(key) { return function () { showProof(key); }; }
    function clickIt(el) { el.click(); }

    function playTour() {
      if (!cursor) return;
      var id = ++tour.run;
      tour.playing = true;
      setTourBtn();
      showProof('interview');
      var firstTab = proofStage.querySelector('.prd-tab[data-prd="cfashion"]');
      if (firstTab) firstTab.click();
      cursor.classList.add('on');
      placeCursor(parkPoint(), 0);
      var steps = [
        [trig('interview'), showKey('interview'), 0.6, 0.55, 2000],
        [trig('prd'), showKey('prd'), 0.5, 0.55, 2000],
        [tab('agentassist'), clickIt, 0.5, 0.55, 2000],
        [tab('pantrypal'), clickIt, 0.5, 0.55, 2000],
        [trig('sql'), showKey('sql'), 0.5, 0.55, 2000],
        [trig('figma'), showKey('figma'), 0.5, 0.55, 2000],
        [trig('tableau'), showKey('tableau'), 0.5, 0.55, 2000],
        [trig('slack'), showKey('slack'), 0.5, 0.55, 2000]
      ];
      var chain = wait(600, id);
      steps.forEach(function (s) {
        chain = chain.then(function (ok) { return ok ? visit(id, s[0], s[1], s[2], s[3], s[4]) : false; });
      });
      chain.then(function (ok) {
        if (!ok) return;
        placeCursor(parkPoint(), 1000);
        return wait(1100, id).then(function (ok2) {
          if (!ok2) return;
          tour.playing = false;
          setTourBtn();
        });
      });
    }

    if (tourBtn) {
      tourBtn.addEventListener('click', function () {
        if (tour.playing) { stopTour(); } else { tour.touched = true; playTour(); }
      });
    }
    if (intro && 'IntersectionObserver' in window) {
      var started = false;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          tour.visible = en.isIntersecting;
          if (en.isIntersecting && !started && !tour.touched && !reducedMotion) {
            started = true;
            setTimeout(function () { if (!tour.touched && !tour.playing) playTour(); }, 900);
          }
        });
      }, { threshold: 0.6 }).observe(intro);
    } else {
      tour.visible = true;
    }
    window.addEventListener('resize', function () { if (tour.playing) { stopTour(); } });
    setTourBtn();
  }

  // sample PRDs (About section): switch between documents
  var prdTabs = document.querySelectorAll('.prd-tab');
  prdTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var key = tab.getAttribute('data-prd');
      prdTabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      document.querySelectorAll('.proof-doc[data-prd]').forEach(function (d) { d.hidden = d.getAttribute('data-prd') !== key; });
    });
  });

  // case study decks: open a full-screen, keyboard-friendly slide viewer
  var DECKS = {
    ecommerce: { title: 'e-Commerce Marketing Automation', count: 9 },
    spotify: { title: 'Spotify: Massive Growth, Persistent Losses', count: 16 },
    mmbc: { title: 'Mountain Man Brewing Company', count: 4 },
    drinkworks: { title: 'Drinkworks: Home Cocktails at the Push of a Button', count: 13 },
    seeds21: { title: '21Seeds: Scale the Brand, Protect the Soul', count: 11 }
  };
  var dv = document.getElementById('deckViewer');
  if (dv) {
    var dvImg = document.getElementById('dvImg');
    var dvTitle = document.getElementById('dvTitle');
    var dvCount = document.getElementById('dvCount');
    var dvPrev = document.getElementById('dvPrev');
    var dvNext = document.getElementById('dvNext');
    var dvClose = document.getElementById('dvClose');
    var dvThumbs = document.getElementById('dvThumbs');
    var dvKey = null, dvIndex = 0, dvOpener = null;

    function dvSrc(key, i) { return 'assets/decks/' + key + '/' + (i < 9 ? '0' : '') + (i + 1) + '.jpg'; }
    function dvShow(i) {
      var d = DECKS[dvKey];
      dvIndex = Math.max(0, Math.min(d.count - 1, i));
      dvImg.src = dvSrc(dvKey, dvIndex);
      dvImg.alt = d.title + ', ' + (d.count > 1 ? 'slide ' + (dvIndex + 1) + ' of ' + d.count : 'page 1');
      dvCount.textContent = d.count > 1 ? (dvIndex + 1) + ' / ' + d.count : '';
      dvPrev.disabled = dvIndex === 0;
      dvNext.disabled = dvIndex === d.count - 1;
      dvPrev.hidden = dvNext.hidden = d.count === 1;
      Array.prototype.forEach.call(dvThumbs.children, function (t, n) {
        if (n === dvIndex) { t.setAttribute('aria-current', 'true'); t.scrollIntoView({ block: 'nearest', inline: 'center' }); }
        else { t.removeAttribute('aria-current'); }
      });
      [dvIndex - 1, dvIndex + 1].forEach(function (n) { if (n >= 0 && n < d.count) { new Image().src = dvSrc(dvKey, n); } });
    }
    function dvOpen(key, opener) {
      dvKey = key; dvOpener = opener;
      var d = DECKS[key];
      dvTitle.textContent = d.title;
      dvThumbs.textContent = '';
      if (d.count > 1) {
        for (var n = 0; n < d.count; n++) {
          (function (n) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'dv-thumb';
            b.setAttribute('aria-label', 'Go to slide ' + (n + 1));
            var im = document.createElement('img');
            im.src = dvSrc(key, n); im.alt = ''; im.loading = 'lazy';
            b.appendChild(im);
            b.addEventListener('click', function () { dvShow(n); });
            dvThumbs.appendChild(b);
          })(n);
        }
      }
      dv.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      dvShow(0);
      dvClose.focus();
    }
    function dvHide() {
      dv.hidden = true;
      document.documentElement.style.overflow = '';
      dvImg.removeAttribute('src');
      if (dvOpener) dvOpener.focus();
    }
    document.querySelectorAll('.deck-card').forEach(function (card) {
      card.addEventListener('click', function (e) { e.preventDefault(); dvOpen(card.getAttribute('data-deck'), card); });
    });
    dvPrev.addEventListener('click', function () { dvShow(dvIndex - 1); });
    dvNext.addEventListener('click', function () { dvShow(dvIndex + 1); });
    dvClose.addEventListener('click', dvHide);
    dv.addEventListener('click', function (e) { if (e.target === dv || e.target.classList.contains('dv-stage')) dvHide(); });
    document.addEventListener('keydown', function (e) {
      if (dv.hidden) return;
      if (e.key === 'Escape') { dvHide(); }
      else if (e.key === 'ArrowRight') { dvShow(dvIndex + 1); }
      else if (e.key === 'ArrowLeft') { dvShow(dvIndex - 1); }
      else if (e.key === 'Home') { dvShow(0); }
      else if (e.key === 'End') { dvShow(DECKS[dvKey].count - 1); }
      else if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(dv.querySelectorAll('button'), function (b) { return !b.disabled && !b.hidden; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  // Nivara: the CAD animations play (muted, looping) only while on screen, and can be paused
  var nvReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.nv-video').forEach(function (fig) {
    var vid = fig.querySelector('video'), btn = fig.querySelector('.nv-vbtn');
    if (!vid || !btn) return;
    var name = fig.getAttribute('data-name') || 'video';
    var userPaused = nvReduced, inView = false;
    function label() {
      var paused = vid.paused;
      btn.textContent = paused ? 'Play' : 'Pause';
      btn.setAttribute('aria-label', (paused ? 'Play the ' : 'Pause the ') + name);
    }
    function sync() {
      if (inView && !userPaused) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); } else { vid.pause(); }
    }
    vid.addEventListener('play', label); vid.addEventListener('pause', label);
    btn.addEventListener('click', function () { userPaused = !vid.paused; if (userPaused) { vid.pause(); } else { vid.play(); } label(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; sync(); }, { threshold: 0.4 }).observe(fig);
    } else { inView = true; sync(); }
    label();
  });

  // Poetry: filterable postcard wall and a reading view
  var pw = document.querySelector('.pc-wall');
  var pv = document.getElementById('poemViewer');
  if (pw && pv) {
    var pcs = Array.prototype.slice.call(pw.querySelectorAll('.pc'));
    var pvCard = document.getElementById('pvCard');
    var pvText = document.getElementById('pvText');
    var pvFade = document.getElementById('pvFade');
    var pvPrev = document.getElementById('pvPrev');
    var pvNext = document.getElementById('pvNext');
    var pvOpener = null, pvCur = null;

    function pvList() { return pcs.filter(function (c) { return !c.hidden; }); }
    function pvTpl(card) { return document.getElementById('pt-' + card.getAttribute('data-poem')); }

    function pvFill(card) {
      var t = pvTpl(card), list = pvList(), i = list.indexOf(card);
      pvCur = card;
      document.getElementById('pvTitle').textContent = t.getAttribute('data-title');
      document.getElementById('pvMeta').textContent = 'Poem ' + (i + 1) + ' of ' + list.length;
      document.getElementById('pvStamp').textContent = t.getAttribute('data-n');
      document.getElementById('pvArt').innerHTML = t.getAttribute('data-art');
      pvText.innerHTML = t.innerHTML;
      pvText.scrollTop = 0;
      var prev = list[i - 1], next = list[i + 1];
      pvPrev.disabled = !prev; pvNext.disabled = !next;
      pvPrev.textContent = prev ? '\u2039 Previous: ' + pvTpl(prev).getAttribute('data-title') : '\u2039 Previous';
      pvNext.textContent = next ? 'Next: ' + pvTpl(next).getAttribute('data-title') + ' \u203a' : 'Next \u203a';
      pvFadeUpdate();
    }
    function pvFadeUpdate() {
      var atEnd = pvText.scrollHeight - pvText.scrollTop - pvText.clientHeight < 24;
      pvFade.classList.toggle('off', atEnd);
    }
    function pvOpen(card) {
      pvOpener = card;
      var r = card.getBoundingClientRect();
      pvCard.style.setProperty('--ox', Math.round((r.left + r.width / 2) / window.innerWidth * 100) + '%');
      pvCard.style.setProperty('--oy', Math.round((r.top + r.height / 2) / window.innerHeight * 100) + '%');
      pv.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      pvFill(card);
      pvCard.style.animation = 'none'; void pvCard.offsetWidth; pvCard.style.animation = '';
      document.getElementById('pvClose').focus();
    }
    function pvClose() {
      pv.hidden = true;
      document.documentElement.style.overflow = '';
      if (pvOpener) pvOpener.focus();
    }
    function pvGo(step) {
      var list = pvList(), i = list.indexOf(pvCur) + step;
      if (i >= 0 && i < list.length) { pvFill(list[i]); pvOpener = list[i]; }
    }
    pcs.forEach(function (c) { c.addEventListener('click', function () { pvOpen(c); }); });
    pvPrev.addEventListener('click', function () { pvGo(-1); });
    pvNext.addEventListener('click', function () { pvGo(1); });
    document.getElementById('pvClose').addEventListener('click', pvClose);
    document.getElementById('pvAll').addEventListener('click', pvClose);
    pv.addEventListener('click', function (e) { if (e.target === pv) pvClose(); });
    pvText.addEventListener('scroll', pvFadeUpdate, { passive: true });
    document.addEventListener('keydown', function (e) {
      if (pv.hidden) return;
      if (e.key === 'Escape') { pvClose(); }
      else if (e.key === 'ArrowRight') { pvGo(1); }
      else if (e.key === 'ArrowLeft') { pvGo(-1); }
      else if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(pv.querySelectorAll('button, [tabindex="0"]'), function (b) { return !b.disabled; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var pvX = null;
    pvCard.addEventListener('touchstart', function (e) { pvX = e.touches[0].clientX; }, { passive: true });
    pvCard.addEventListener('touchend', function (e) {
      if (pvX === null) return;
      var dx = e.changedTouches[0].clientX - pvX; pvX = null;
      if (Math.abs(dx) > 70) pvGo(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  // Contact: intro video loads and autoplays (muted, as browsers require) when it scrolls into view
  var iv = document.getElementById('introVideo');
  if (iv) {
    var ivHolder = iv.querySelector('.iv-holder');
    var ivLoaded = false;
    var ivReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function ivLoad() {
      if (ivLoaded) return;
      ivLoaded = true;
      var id = iv.getAttribute('data-id');
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=' + (ivReduced ? 0 : 1) + '&mute=1&playsinline=1&loop=1&playlist=' + id + '&rel=0&modestbranding=1';
      f.title = 'Hi, I am Gauri. An introduction video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      ivHolder.appendChild(f);
    }
    if ('IntersectionObserver' in window) {
      var ivObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { ivLoad(); ivObs.disconnect(); }
      }, { threshold: 0.35 });
      ivObs.observe(iv);
    } else { ivLoad(); }
  }

  // toolkit tabs
  var tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelector('.tab-panel[data-panel="' + target + '"]').classList.add('active');
    });
  });

  // experience: UFO spotlight. Hover, focus or tap a logo to open its role. Jio is the default.
  var xp = document.getElementById('xp');
  if (xp) {
    var xpTabs = Array.prototype.slice.call(xp.querySelectorAll('.xp-tab'));
    var xpPanels = Array.prototype.slice.call(xp.querySelectorAll('.xp-panel'));
    var XP_X = { arm: '12.5%', sut: '37.5%', jio: '62.5%', pa: '87.5%' };
    var XP_DEFAULT = 'jio';
    var xpTimer = null;

    function xpShow(k) {
      xp.style.setProperty('--x', XP_X[k]);
      xpTabs.forEach(function (t) {
        t.setAttribute('aria-selected', t.getAttribute('data-k') === k ? 'true' : 'false');
      });
      xpPanels.forEach(function (p) {
        p.classList.toggle('on', p.getAttribute('data-k') === k);
      });
    }

    function xpReset() {
      clearTimeout(xpTimer);
      xpTimer = setTimeout(function () { xpShow(XP_DEFAULT); }, 250);
    }

    xpTabs.forEach(function (t) {
      var k = t.getAttribute('data-k');
      ['mouseenter', 'focus', 'click'].forEach(function (ev) {
        t.addEventListener(ev, function () { clearTimeout(xpTimer); xpShow(k); });
      });
    });
    xp.addEventListener('mouseenter', function () { clearTimeout(xpTimer); });
    xp.addEventListener('mouseleave', xpReset);
    xp.addEventListener('focusout', function (e) { if (!xp.contains(e.relatedTarget)) xpReset(); });
    xpShow(XP_DEFAULT);
  }

  // interactive dot-mesh background
  var canvas = document.getElementById('blobCanvas');
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W, H, dpr;

  var PILLAR_COLORS = {
    comm: [226, 139, 118],   // coral
    write: [227, 185, 78],   // honey
    ai: [158, 147, 214],     // lavender
    data: [143, 182, 131],   // sage
    design: [74, 66, 56],    // warm charcoal
    default: [158, 147, 214]
  };
  var PALETTE_KEYS = ['comm', 'write', 'ai', 'data'];

  var SPACING = 42;
  var RADIUS = 130;   // how far the cursor's influence reaches, in px
  var MAX_PUSH = 24;  // max displacement for a dot right under the cursor, in px
  var dots = [];

  function buildGrid() {
    dots = [];
    var cols = Math.ceil(W / SPACING) + 1;
    var rows = Math.ceil(H / SPACING) + 1;
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        var hx = i * SPACING;
        var hy = j * SPACING;
        var colorKey = PALETTE_KEYS[(i * 7 + j * 13) % PALETTE_KEYS.length];
        dots.push({ hx: hx, hy: hy, x: hx, y: hy, colorKey: colorKey });
      }
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGrid();
  }
  window.addEventListener('resize', resize);

  var mouseX = -9999, mouseY = -9999;
  window.addEventListener('mousemove', function (e) {
    mouseX = e.clientX; mouseY = e.clientY;
  });
  window.addEventListener('mouseleave', function () { mouseX = -9999; mouseY = -9999; });

  var activePillar = 'default';
  var pillarBySection = [
    { id: 'hero', p: 'ai' },
    { id: 'about', p: 'comm' },
    { id: 'experience', p: 'ai' },
    { id: 'work', p: 'data' },
    { id: 'toolkit', p: 'ai' },
    { id: 'education', p: 'comm' },
    { id: 'contact', p: 'data' }
  ];
  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var match = pillarBySection.find(function (s) { return s.id === entry.target.id; });
        if (match) activePillar = match.p;
      }
    });
  }, { threshold: 0.5 });
  pillarBySection.forEach(function (s) {
    var el = document.getElementById(s.id);
    if (el) sectionObserver.observe(el);
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (var k = 0; k < dots.length; k++) {
      var d = dots[k];
      var dx = d.hx - mouseX;
      var dy = d.hy - mouseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var targetX = d.hx, targetY = d.hy, pushMag = 0;

      if (dist < RADIUS && dist > 0.01) {
        pushMag = (1 - dist / RADIUS) * MAX_PUSH; // closer dots get pushed further — the "unequal dispersion"
        targetX = d.hx + (dx / dist) * pushMag;
        targetY = d.hy + (dy / dist) * pushMag;
      }
      d.x += (targetX - d.x) * 0.15;
      d.y += (targetY - d.y) * 0.15;

      var energy = pushMag / MAX_PUSH;
      var size = 1.3 + energy * 1.9;
      var baseAlpha = d.colorKey === activePillar ? 0.22 : 0.13;
      var alpha = baseAlpha + energy * 0.4;

      var color = PILLAR_COLORS[d.colorKey];
      ctx.beginPath();
      ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + alpha.toFixed(3) + ')';
      ctx.fill();
    }

    if (!reduceMotion) requestAnimationFrame(draw);
  }

  resize();
  draw();
})();
