/* ==================================================================
   PianoHands — wiederverwendbares Hände-Bauteil (Swiss / Linien)
   Zwei Hände (links/rechts), je 5 ansprechbare Finger (data-finger="1..5").
   Der aktive Finger leuchtet rot. Modul-unabhängig nutzbar.

   API:
     PianoHands.buildHand('right' | 'left')   -> <svg> (Inline-SVG)
     PianoHands.setActive(svgEl, fingerNumber|null)
     PianoHands.buildPair({active:{right:n, left:n}}) -> <div> mit beiden Händen
   Finger-Nummern: 1=Daumen … 5=kleiner Finger (Standard-Klaviersatz).
   ================================================================== */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var W = 150, H = 188;

  // Geometrie der rechten Hand (Handfläche unten, Finger oben, Daumen links).
  // Jeder Finger: abgerundeter Balken {x,y,w,h,rot}; Nummer am Fingerkuppen-Punkt.
  var RIGHT = {
    palm: { x: 30, y: 104, w: 90, h: 64, rx: 20 },
    fingers: [
      { n: 1, x: 4,  y: 96,  w: 19, h: 50, rot: -36, num: [20, 116] }, // Daumen
      { n: 2, x: 36, y: 40,  w: 19, h: 70, rot: 0,   num: [45, 58] },  // Zeige
      { n: 3, x: 59, y: 28,  w: 19, h: 82, rot: 0,   num: [68, 46] },  // Mittel
      { n: 4, x: 82, y: 38,  w: 19, h: 72, rot: 0,   num: [91, 56] },  // Ring
      { n: 5, x: 105, y: 56, w: 19, h: 54, rot: 0,   num: [114, 74] }  // klein
    ]
  };

  function svg(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    return e;
  }

  function buildHand(side) {
    var mirror = side === 'left';
    var root = svg('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      class: 'ph-hand ph-hand-' + side,
      role: 'img',
      'aria-label': side === 'left' ? 'Linke Hand' : 'Rechte Hand'
    });

    var g = svg('g', mirror ? { transform: 'translate(' + W + ',0) scale(-1,1)' } : {});

    // Handfläche
    var p = RIGHT.palm;
    g.appendChild(svg('rect', {
      x: p.x, y: p.y, width: p.w, height: p.h, rx: p.rx, ry: p.rx,
      class: 'ph-palm'
    }));

    // Finger (Form gespiegelt über die Gruppe; Nummern separat, NICHT gespiegelt)
    RIGHT.fingers.forEach(function (f) {
      var fg = svg('g', { 'data-finger': f.n, class: 'ph-finger' });
      var cx = f.x + f.w / 2, cy = f.y + f.h / 2;
      var r = svg('rect', {
        x: f.x, y: f.y, width: f.w, height: f.h, rx: f.w / 2, ry: f.w / 2,
        class: 'ph-finger-shape'
      });
      if (f.rot) r.setAttribute('transform', 'rotate(' + f.rot + ' ' + cx + ' ' + cy + ')');
      fg.appendChild(r);
      g.appendChild(fg);
    });
    root.appendChild(g);

    // Nummern (immer lesbar, an gespiegelter X-Position wenn links)
    RIGHT.fingers.forEach(function (f) {
      var nx = mirror ? (W - f.num[0]) : f.num[0];
      var txt = svg('text', {
        x: nx, y: f.num[1] + 4, class: 'ph-num', 'data-finger-num': f.n,
        'text-anchor': 'middle'
      });
      txt.textContent = f.n;
      root.appendChild(txt);
    });

    return root;
  }

  function setActive(svgEl, fingerNumber) {
    if (!svgEl) return;
    svgEl.querySelectorAll('.ph-finger').forEach(function (g) {
      g.classList.toggle('is-active', String(g.getAttribute('data-finger')) === String(fingerNumber));
    });
    svgEl.querySelectorAll('.ph-num').forEach(function (n) {
      n.classList.toggle('is-active', String(n.getAttribute('data-finger-num')) === String(fingerNumber));
    });
  }

  function buildPair(opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'ph-pair';

    var leftCol = document.createElement('div');
    leftCol.className = 'ph-col';
    var leftHand = buildHand('left');
    leftCol.appendChild(leftHand);
    var ll = document.createElement('span');
    ll.className = 'ph-label mono';
    ll.textContent = opts.leftLabel || 'L';
    leftCol.appendChild(ll);

    var rightCol = document.createElement('div');
    rightCol.className = 'ph-col';
    var rightHand = buildHand('right');
    rightCol.appendChild(rightHand);
    var rl = document.createElement('span');
    rl.className = 'ph-label mono';
    rl.textContent = opts.rightLabel || 'R';
    rightCol.appendChild(rl);

    wrap.appendChild(leftCol);
    wrap.appendChild(rightCol);

    if (opts.active) {
      setActive(leftHand, opts.active.left);
      setActive(rightHand, opts.active.right);
    }
    wrap._hands = { left: leftHand, right: rightHand };
    return wrap;
  }

  window.PianoHands = { buildHand: buildHand, setActive: setActive, buildPair: buildPair };
})();
