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

      // Runs only after the panel is already visible, so measurement/init is correct.
      var divElement = document.getElementById('viz1788934787901');
      var vizElement = divElement.getElementsByTagName('object')[0];
      vizElement.style.width = '100%';
      vizElement.style.height = '360px';
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

  // interactive color-blob background
  var canvas = document.getElementById('blobCanvas');
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W, H, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  var PILLAR_COLORS = {
    comm: [226, 139, 118],   // coral
    write: [227, 185, 78],   // honey
    ai: [158, 147, 214],     // lavender
    data: [143, 182, 131],   // sage
    design: [74, 66, 56],    // warm charcoal
    default: [158, 147, 214]
  };

  var blobs = [
    { key: 'ai', x: 0.18, y: 0.22, r: 0.42, vx: 0.00012, vy: 0.00009, phase: 0 },
    { key: 'comm', x: 0.82, y: 0.18, r: 0.38, vx: -0.00010, vy: 0.00012, phase: 2 },
    { key: 'data', x: 0.75, y: 0.78, r: 0.40, vx: -0.00009, vy: -0.00011, phase: 4 },
    { key: 'write', x: 0.22, y: 0.80, r: 0.36, vx: 0.00011, vy: -0.00008, phase: 6 }
  ];

  var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  window.addEventListener('mousemove', function (e) {
    mouse.tx = e.clientX / window.innerWidth;
    mouse.ty = e.clientY / window.innerHeight;
  });

  var activePillar = 'default';
  var sections = document.querySelectorAll('[data-section-pillar], .section');
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

  var t = 0;
  function draw() {
    t += 1;
    mouse.x += (mouse.tx - mouse.x) * 0.02;
    mouse.y += (mouse.ty - mouse.y) * 0.02;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    blobs.forEach(function (b, i) {
      var driftX = Math.sin(t * b.vx * 60 + b.phase) * 0.05;
      var driftY = Math.cos(t * b.vy * 60 + b.phase) * 0.05;
      var parallax = 0.04 * (i % 2 === 0 ? 1 : -1);
      var cx = (b.x + driftX + (mouse.x - 0.5) * parallax) * W;
      var cy = (b.y + driftY + (mouse.y - 0.5) * parallax) * H;
      var r = b.r * Math.max(W, H);

      var isActive = b.key === activePillar;
      var targetOpacity = isActive ? 0.26 : 0.10;
      b.opacity = (b.opacity === undefined ? targetOpacity : b.opacity) + (targetOpacity - (b.opacity || 0)) * 0.03;

      var color = PILLAR_COLORS[b.key];
      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(' + color.join(',') + ',' + b.opacity + ')');
      grad.addColorStop(1, 'rgba(' + color.join(',') + ',0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!reduceMotion) requestAnimationFrame(draw);
  }
  draw();
  if (reduceMotion) {
    // draw a single static soft frame
    setTimeout(function(){ /* one frame already drawn above */ }, 0);
  }
})();
