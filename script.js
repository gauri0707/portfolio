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

    var tableauLoaded = false;
    function loadTableauViz() {
      if (tableauLoaded) return;
      tableauLoaded = true;
      var container = document.getElementById('tableauViz');
      if (!container) return;

      container.innerHTML =
        '<div class="tableauPlaceholder" id="viz1788934787901" style="position:relative">' +
        '<noscript><a href="#"><img alt=" " src="https://public.tableau.com/static/images/Ha/HansRosling200countries200years/Gauri-HansRoslingChart/1_rss.png" style="border:none" /></a></noscript>' +
        '<object class="tableauViz" style="display:none;">' +
        '<param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />' +
        '<param name="embed_code_version" value="3" />' +
        '<param name="site_root" value="" />' +
        '<param name="name" value="HansRosling200countries200years/Gauri-HansRoslingChart" />' +
        '<param name="tabs" value="no" />' +
        '<param name="toolbar" value="yes" />' +
        '<param name="static_image" value="https://public.tableau.com/static/images/Ha/HansRosling200countries200years/Gauri-HansRoslingChart/1.png" />' +
        '<param name="animate_transition" value="yes" />' +
        '<param name="display_static_image" value="yes" />' +
        '<param name="display_spinner" value="yes" />' +
        '<param name="display_overlay" value="yes" />' +
        '<param name="display_count" value="yes" />' +
        '<param name="language" value="en-US" />' +
        '</object></div>';

      // Runs only after the panel is already visible, so offsetWidth is a real
      // measurement here (not 0) — lets the embed size itself to its natural
      // aspect ratio instead of being capped at a fixed height.
      var divElement = document.getElementById('viz1788934787901');
      var vizElement = divElement.getElementsByTagName('object')[0];
      vizElement.style.width = '100%';
      vizElement.style.height = (divElement.offsetWidth * 0.75) + 'px';
      var scriptElement = document.createElement('script');
      scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
      vizElement.parentNode.insertBefore(scriptElement, vizElement);
    }

    function showProof(key) {
      proofStage.classList.add('active');
      proofPanels.forEach(function (p) {
        p.classList.toggle('visible', p.getAttribute('data-panel') === key);
      });
      proofTriggers.forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-proof') === key);
      });
      activeProof = key;
      if (key === 'tableau') loadTableauViz();
    }
    function hideProof() {
      proofStage.classList.remove('active');
      proofTriggers.forEach(function (t) { t.classList.remove('active'); });
      activeProof = null;
    }

    proofTriggers.forEach(function (trigger) {
      var key = trigger.getAttribute('data-proof');
      trigger.addEventListener('mouseenter', function () { showProof(key); });
      trigger.addEventListener('focus', function () { showProof(key); });
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        if (activeProof === key) { hideProof(); } else { showProof(key); }
      });
    });
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
    { id: 'awake', p: 'write' },
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
