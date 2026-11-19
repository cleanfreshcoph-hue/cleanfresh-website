/* Christmas music: starts on the visitor's first tap or click (browsers block sound before that),
   loops quietly, and a small round button pauses or plays it. Remembers pause and position between pages.
   Runs only in the Christmas season (late October to Dec 25, Manila time). */
(function () {
  var m = new Date(Date.now() + 8 * 3600 * 1000);
  var y = m.getUTCFullYear(), today = Date.UTC(y, m.getUTCMonth(), m.getUTCDate());
  var days = Math.round((Date.UTC(y, 11, 25) - today) / 86400000);
  if (days < 0 || days > 60) return;

  var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
                set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  var VOL = 0.35;
  var audio = new Audio('assets/audio/christmas.mp3');
  audio.loop = true; audio.preload = 'none'; audio.volume = 0;

  var css = document.createElement('style');
  css.textContent =
    '.cfc-music{position:fixed;left:max(16px,env(safe-area-inset-left,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:70;' +
    'width:52px;height:52px;border-radius:50%;border:2px solid #FFD639;background:#0A1236;color:#FFD639;display:flex;align-items:center;justify-content:center;' +
    'cursor:pointer;box-shadow:0 6px 18px rgba(10,18,54,0.35);transition:bottom .25s ease,transform .15s ease;padding:0;}' +
    '.cfc-music:hover{transform:scale(1.06);}' +
    '.cfc-music:focus-visible{outline:3px solid #FFD639;outline-offset:3px;}' +
    '.cfc-music svg{width:22px;height:22px;fill:currentColor;}' +
    '.cfc-music .bars{display:flex;align-items:flex-end;gap:3px;height:18px;}' +
    '.cfc-music .bars i{display:block;width:4px;background:#FFD639;border-radius:2px;animation:cfc-eq 0.9s ease-in-out infinite alternate;}' +
    '.cfc-music .bars i:nth-child(2){animation-delay:-0.3s;} .cfc-music .bars i:nth-child(3){animation-delay:-0.6s;}' +
    '@keyframes cfc-eq{from{height:5px;}to{height:18px;}}' +
    '.cfc-music.playing{animation:cfc-ring 2.4s ease-out infinite;}' +
    '@keyframes cfc-ring{0%{box-shadow:0 0 0 0 rgba(255,214,57,0.45),0 6px 18px rgba(10,18,54,0.35);}100%{box-shadow:0 0 0 14px rgba(255,214,57,0),0 6px 18px rgba(10,18,54,0.35);}}' +
    '.cfc-music.lifted{bottom:calc(84px + env(safe-area-inset-bottom,0px));}' +
    '@media (prefers-reduced-motion:reduce){.cfc-music,.cfc-music .bars i{animation:none!important;transition:none;}}';
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'cfc-music';
  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3v10.6A4 4 0 1 0 11 17V8h6V3H9z"/></svg>';
  var ICON_PLAYING = '<span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>';
  function render(on) {
    btn.innerHTML = on ? ICON_PLAYING : ICON_PLAY;
    btn.classList.toggle('playing', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Pause Christmas music' : 'Play Christmas music');
    btn.title = on ? 'Pause music' : 'Play music';
  }

  var fadeT = null;
  function fadeTo(v, done) {
    clearInterval(fadeT);
    fadeT = setInterval(function () {
      var d = v - audio.volume, step = 0.03;
      if (Math.abs(d) <= step) { audio.volume = v; clearInterval(fadeT); if (done) done(); }
      else audio.volume = Math.max(0, Math.min(1, audio.volume + (d > 0 ? step : -step)));
    }, 50);
  }
  var resumed = false;
  function play() {
    if (!resumed) { resumed = true; var t = parseFloat(store.get('cfcMusicT')); if (t > 0) { try { audio.currentTime = t; } catch (e) {} } }
    var p = audio.play();
    render(true); store.set('cfcMusic', 'on'); fadeTo(VOL);
    if (p && p.catch) p.catch(function () { render(false); });
  }
  function pause() { render(false); store.set('cfcMusic', 'paused'); fadeTo(0, function () { audio.pause(); }); }

  btn.addEventListener('click', function (e) { e.stopPropagation(); if (audio.paused || btn.getAttribute('aria-pressed') !== 'true') play(); else pause(); });

  /* First tap or click anywhere starts the music, unless the visitor paused it earlier */
  function firstTouch(e) {
    if (e.target && e.target.closest && e.target.closest('.cfc-music')) return;
    off();
    if (store.get('cfcMusic') !== 'paused') play();
  }
  function off() { ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.removeEventListener(ev, firstTouch, true); }); }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, firstTouch, true); });

  /* Keep the place in the song when moving to another page */
  window.addEventListener('pagehide', function () { if (!audio.paused) store.set('cfcMusicT', String(audio.currentTime)); });

  /* Stay above the phone booking bar when it slides up */
  var bar = document.getElementById('mbar');
  function lift() { btn.classList.toggle('lifted', !!bar && bar.classList.contains('show') && getComputedStyle(bar).display !== 'none'); }
  if (bar && 'MutationObserver' in window) new MutationObserver(lift).observe(bar, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', lift);

  render(false);
  document.body.appendChild(btn);
  lift();
})();
