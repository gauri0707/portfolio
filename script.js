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

  // Scroll reveal: everything with .reveal stays hidden until it scrolls into view, then rises in.
  // Items in a grid get a small stagger so rows arrive one card after another.
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  revealEls.forEach(function (el) {
    var grid = el.closest('.deck-grid, .pc-wall, .edu-grid');
    if (grid && grid !== el) {
      var i = Array.prototype.indexOf.call(grid.children, el);
      el.style.setProperty('--d', ((i % 3) * 0.09).toFixed(2) + 's');
    }
  });
  function revealNow(el) { el.classList.add('visible'); }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        revealNow(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(function (el) { observer.observe(el); });
  // at the very bottom of the page nothing more can scroll into view, so show whatever is left
  window.addEventListener('scroll', function () {
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4) {
      revealEls.forEach(function (el) { if (!el.classList.contains('visible') && el.getBoundingClientRect().top < window.innerHeight) revealNow(el); });
    }
  }, { passive: true });

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

    var CURSOR_HTML =
        '<svg class="fc-arrow" viewBox="0 0 64 64" width="46" height="46">' +
        '<path d="M9 5.5 L53 33.5 L35.5 38.2 L45.5 58 L36 62.2 L26 42.5 L12.5 55 Z" fill="none" stroke="#2b2622" stroke-width="1.2" stroke-linejoin="round" transform="translate(2.2 2.4)" opacity=".35"/>' +
        '<path d="M8 5 L52 33 L34.5 37.6 L44.5 57.5 L35 61.5 L25 42 L11.5 54.5 Z" fill="#3b3631" stroke="#1f1b18" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<path d="M17.5 17 L30 24.8" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>' +
        '<circle cx="37" cy="29.2" r="2.1" fill="#fff"/><circle cx="43" cy="33.2" r="1.7" fill="#fff"/>' +
        '<path d="M16.5 31 L16.5 40" stroke="#fff" stroke-width="3.2" stroke-linecap="round" transform="rotate(-20 16.5 35)"/>' +
        '<path d="M33 46 L37 54 M36.5 44.5 L40.8 52.5 M29.5 47.5 L33 55" stroke="#8a8076" stroke-width="1.3" stroke-linecap="round"/>' +
        '</svg>' +
        '<span class="fake-cursor-tag">Gauri</span><i class="fake-cursor-ring"></i>';

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
      cursor.innerHTML = CURSOR_HTML;
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
  // slide groups inside the About proof panels open in the same viewer
  var PROOF_DECKS = { cfashion: 'User Research \u00b7 CFashion', sql: 'SQL \u00b7 Instagram and Operation Analytics', nvversions: 'Nivara \u00b7 Prototype versions' };
  var PROOF_SEL = '.proof-slides[data-deck], .nv-vers[data-deck]';
  Object.keys(PROOF_DECKS).forEach(function (key) {
    var links = document.querySelectorAll('[data-deck="' + key + '"] a');
    DECKS[key] = { title: PROOF_DECKS[key], count: links.length, srcs: [], alts: [] };
    Array.prototype.forEach.call(links, function (a) {
      var im = a.querySelector('img');
      DECKS[key].srcs.push(a.getAttribute('href'));
      DECKS[key].alts.push(im ? im.getAttribute('alt') : '');
    });
  });
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

    function dvSrc(key, i) { if (DECKS[key].srcs) return DECKS[key].srcs[i]; return 'assets/decks/' + key + '/' + (i < 9 ? '0' : '') + (i + 1) + '.jpg'; }
    function dvShow(i) {
      var d = DECKS[dvKey];
      dvIndex = Math.max(0, Math.min(d.count - 1, i));
      dvImg.src = dvSrc(dvKey, dvIndex);
      dvImg.alt = (d.alts && d.alts[dvIndex]) || d.title + ', ' + (d.count > 1 ? 'slide ' + (dvIndex + 1) + ' of ' + d.count : 'page 1');
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
    function dvOpen(key, opener, start) {
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
      dvShow(start || 0);
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
    document.querySelectorAll(PROOF_SEL).forEach(function (grid) {
      Array.prototype.forEach.call(grid.querySelectorAll('a'), function (a, n) {
        a.addEventListener('click', function (e) { e.preventDefault(); dvOpen(grid.getAttribute('data-deck'), a, n); });
      });
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

  // Contact: intro video loads and autoplays when it scrolls into view. Sound is on by default; browsers only allow
  // that once the visitor has clicked, tapped or pressed a key on the page (which is true for anyone who got here by
  // clicking the menu). Otherwise it starts muted and turns the sound on at the visitor's first click or key press.
  // The player's own controls are hidden so the black side bars can be cropped out; a small button toggles sound.
  var iv = document.getElementById('introVideo');
  if (iv) {
    var ivHolder = iv.querySelector('.iv-holder');
    var ivFrame = iv.querySelector('.iv-frame');
    var ivLoaded = false, ivSoundOn = false, ivInView = false, ivBtn = null, ivInput = false;
    var ivReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function ivSend(func) {
      var f = ivHolder.querySelector('iframe');
      if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: [] }), '*');
    }
    function ivSetSound(on) {
      ivSoundOn = on;
      ivSend(on ? 'unMute' : 'mute');
      if (on) ivSend('playVideo');
      if (ivBtn) {
        ivBtn.textContent = on ? 'Turn sound off' : 'Turn sound on';
        ivBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }
    function ivLoad() {
      if (ivLoaded) return;
      ivLoaded = true;
      var id = iv.getAttribute('data-id');
      var active = !!(navigator.userActivation && navigator.userActivation.hasBeenActive);
      ivSoundOn = active && !ivReduced;
      var f = document.createElement('iframe');
      var q = 'autoplay=' + (ivReduced ? 0 : 1) + '&mute=' + (ivSoundOn ? 0 : 1) + '&playsinline=1&loop=1&playlist=' + id + '&rel=0&modestbranding=1&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
      if (ivReduced) { ivFrame.classList.add('iv-full'); } else { q += '&controls=0&disablekb=1&fs=0&iv_load_policy=3'; }
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?' + q;
      f.title = 'Hi, I am Gauri. An introduction video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.addEventListener('load', function () { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*'); });
      ivHolder.appendChild(f);
      if (ivReduced) return;
      ivBtn = document.createElement('button');
      ivBtn.type = 'button'; ivBtn.className = 'iv-sound';
      ivBtn.addEventListener('click', function (e) { e.stopPropagation(); ivSetSound(!ivSoundOn); });
      ivFrame.appendChild(ivBtn);
      ivSetSound(ivSoundOn);
      if (!ivSoundOn) {
        var once = function (e) {
          if (ivBtn && ivBtn.contains(e.target)) return;
          document.removeEventListener('pointerdown', once, true);
          document.removeEventListener('keydown', once, true);
          if (ivInView && !ivSoundOn) ivSetSound(true);
        };
        document.addEventListener('pointerdown', once, true);
        document.addEventListener('keydown', once, true);
      }
    }
    // The video never starts on its own at page load (a refresh can leave the page already scrolled down to
    // it). It starts only after the visitor has scrolled, clicked or pressed a key, and the picture is on screen.
    function ivWake() {
      if (!(ivInView && ivInput)) return;
      if (!ivLoaded) { ivLoad(); return; }
      if (ivReduced) return;
      ivSend(ivSoundOn ? 'unMute' : 'mute');
      ivSend('playVideo');
    }
    // leaving the section (or the tab) silences it: paused and muted until the visitor is back on it
    function ivSilence() { if (ivLoaded) { ivSend('pauseVideo'); ivSend('mute'); } }
    ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'keydown'].forEach(function (t) {
      document.addEventListener(t, function () { ivInput = true; ivWake(); }, { capture: true, passive: true });
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { ivSilence(); } else { ivWake(); } });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var e = entries[entries.length - 1];
        ivInView = e.isIntersecting && e.intersectionRatio >= 0.35;
        if (ivInView) { ivWake(); } else { ivSilence(); }
      }, { threshold: [0, 0.35] }).observe(iv);
    } else { ivInView = true; }
  }

  // "GKT" and "Back to top" go to the very top. The #top anchor is the sticky header, which is already at the
  // top of the screen wherever you are, so the browser's own anchor jump has nowhere to go. The glide is done by
  // hand so it works the same in every browser, and is skipped for visitors who prefer reduced motion.
  document.querySelectorAll('a[href="#top"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var from = window.pageYOffset, reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
      if (reduce || from < 2) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
      var dur = Math.min(900, 350 + from / 20), t0 = null;
      (function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - p, 3);
        window.scrollTo({ top: from * (1 - ease), behavior: 'instant' });
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    });
  });

  // toolkit tabs (click, or arrow keys once a tab is focused)
  var tabBtns = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
  function tkSelect(btn, focus) {
    var target = btn.getAttribute('data-tab');
    tabBtns.forEach(function (b) {
      var on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === target); });
    if (focus) btn.focus();
  }
  tabBtns.forEach(function (btn, i) {
    btn.tabIndex = btn.classList.contains('active') ? 0 : -1;
    btn.addEventListener('click', function () { tkSelect(btn, false); });
    btn.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (e.key === 'Home') { e.preventDefault(); tkSelect(tabBtns[0], true); }
      else if (e.key === 'End') { e.preventDefault(); tkSelect(tabBtns[tabBtns.length - 1], true); }
      else if (d) { e.preventDefault(); tkSelect(tabBtns[(i + d + tabBtns.length) % tabBtns.length], true); }
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

    // the same dummy cursor visits each role once when the section first scrolls into view (no replay)
    var xpSec = document.getElementById('experience');
    var xpReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (xpSec && 'IntersectionObserver' in window && !xpReduce) {
      var xpDemo = { run: 0, playing: false, visible: false, done: false };
      var xc = document.createElement('div');
      xc.className = 'fake-cursor';
      xc.setAttribute('aria-hidden', 'true');
      xc.innerHTML = CURSOR_HTML;
      xpSec.appendChild(xc);

      var xpPoint = function (el, fx, fy) {
        var r = el.getBoundingClientRect(), box = xpSec.getBoundingClientRect();
        return { x: r.left - box.left + r.width * fx, y: r.top - box.top + r.height * fy };
      };
      var xpPlace = function (p, ms) {
        xc.style.transitionDuration = ms + 'ms';
        xc.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px)';
      };
      var xpWait = function (ms, id) {
        return new Promise(function (resolve) { setTimeout(function () { resolve(id === xpDemo.run); }, ms); });
      };
      var xpStop = function () {
        if (!xpDemo.playing) return;
        xpDemo.run++;
        xpDemo.playing = false;
        xc.classList.remove('on');
      };
      var xpVisit = function (id, key) {
        return xpWait(0, id).then(function (ok) {
          if (!ok) return false;
          if (!xpDemo.visible) return xpWait(300, id).then(function (ok2) { return ok2 ? xpVisit(id, key) : false; });
          var tab = xp.querySelector('.xp-tab[data-k="' + key + '"]');
          var tile = tab && (tab.querySelector('.xp-tile') || tab);
          if (!tile) return true;
          xpPlace(xpPoint(tile, 0.55, 0.5), 900);
          return xpWait(1000, id).then(function (ok2) {
            if (!ok2) return false;
            xc.classList.remove('click'); void xc.offsetWidth; xc.classList.add('click');
            clearTimeout(xpTimer);
            xpShow(key);
            return xpWait(2300, id);
          });
        });
      };
      var xpPlay = function () {
        var id = ++xpDemo.run;
        xpDemo.playing = true;
        xpDemo.done = true;
        var row = xp.querySelector('.xp-dock') || xp;
        var start = xpPoint(row, 0.97, -0.4);
        xpPlace(start, 0);
        xc.classList.add('on');
        var chain = xpWait(500, id);
        ['arm', 'sut', 'jio', 'pa'].forEach(function (k) {
          chain = chain.then(function (ok) { return ok ? xpVisit(id, k) : false; });
        });
        chain.then(function (ok) {
          if (!ok) return;
          xpPlace(start, 900);
          return xpWait(700, id).then(function (ok2) {
            if (!ok2) return;
            xc.classList.remove('on');
            xpDemo.playing = false;
            xpWait(500, id).then(function (ok3) { if (ok3) xpShow(XP_DEFAULT); });
          });
        });
      };

      ['mouseenter', 'pointerdown', 'touchstart', 'focusin'].forEach(function (ev) {
        xp.addEventListener(ev, function () { xpDemo.done = true; xpStop(); });
      });
      window.addEventListener('resize', xpStop);
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          xpDemo.visible = en.intersectionRatio >= 0.2;
          if (en.intersectionRatio >= 0.35 && !xpDemo.done) {
            xpDemo.done = true;
            setTimeout(function () { if (!xpDemo.playing) xpPlay(); }, 700);
          }
        });
      }, { threshold: [0, 0.2, 0.35] }).observe(xp);
    }
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
  var GLOW = 170;     // radius of the visible dot cloud around the cursor, in px
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
    { id: 'cases', p: 'data' },
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

  // true when the point sits over text, so the dot cloud never gets in the way of reading
  var TEXT_TAGS = /^(P|H1|H2|H3|H4|LI|A|BUTTON|FIGCAPTION|LABEL|SMALL|B|STRONG|EM|I|SPAN|TD|TH|SUMMARY|BLOCKQUOTE)$/;
  function overText(x, y) {
    var e = document.elementFromPoint(x, y);
    for (var hops = 0; e && e !== document.body && hops < 4; hops++, e = e.parentElement) {
      if (TEXT_TAGS.test(e.tagName)) return true;
      for (var n = e.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    }
    return false;
  }

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
      // dots only exist near the cursor: fully hidden outside GLOW, fading in as the pointer gets close
      var glow = Math.max(0, 1 - Math.hypot(d.hx - mouseX, d.hy - mouseY) / GLOW);
      if (glow <= 0.01 || overText(d.hx, d.hy)) continue;
      var size = 1.5 + glow * 0.9 + energy * 1.7;
      var alpha = Math.min(0.9, glow * (d.colorKey === activePillar ? 0.5 : 0.38) + energy * 0.15);

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
