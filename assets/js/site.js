// Wipe images in as they scroll into view. Skipped entirely when reduced motion is requested.
(function () {
  var els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(function (e) { e.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (e) { io.observe(e); });
})();

// Hero stage: cycles through every site while the hero is on screen. Under
// the buttons: arrows round five tapering dots and the x / n position, and a
// pause button whose ring fills until the next site. Under reduced motion
// nothing moves on its own; the arrows still work and the pause is hidden.
(function () {
  var hx = document.querySelector('.hx');
  if (!hx) return;
  var shots = hx.querySelectorAll('.hx-laptop .lt-screen img');
  var phones = hx.querySelectorAll('.hx-phone .mock-stack img');
  var url = hx.querySelector('.hx-url');
  var row = hx.querySelector('.pc-row');
  if (!row || shots.length < 2) return;
  var dots = row.querySelector('.pc-dots');
  var count = row.querySelector('.pc-count b');
  var btn = row.querySelector('.pc-pause');
  var n = shots.length;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MS = 4000, cur = 0, seen = true, paused = still, left = MS, started = 0, timer = null;
  row.hidden = false;
  row.style.setProperty('--hx-ms', MS + 'ms');
  if (still) row.classList.add('still');

  function show(i, dir) {
    i = (i + n) % n;
    if (i === cur) return;
    [shots, phones].forEach(function (set) {
      set.forEach(function (el) { el.classList.remove('was'); });
      if (set[cur]) { set[cur].classList.remove('on'); set[cur].classList.add('was'); }
      if (set[i]) set[i].classList.add('on');
    });
    if (url) url.textContent = shots[i].getAttribute('data-url');
    count.textContent = String(i + 1).padStart(2, '0');
    dots.classList.remove('fwd', 'back'); void dots.offsetWidth; dots.classList.add(dir < 0 ? 'back' : 'fwd');
    cur = i;
  }
  function ring() { btn.classList.remove('tick'); void btn.offsetWidth; if (!still) btn.classList.add('tick'); }
  function schedule(ms) {
    clearTimeout(timer); started = Date.now(); left = ms;
    timer = setTimeout(function () { show(cur + 1, 1); ring(); schedule(MS); }, ms);
  }
  function hold() { clearTimeout(timer); left = Math.max(0, left - (Date.now() - started)); }
  function run() { if (!paused && seen) schedule(left); }
  function go(d) { show(cur + d, d); ring(); left = MS; if (!paused && seen) schedule(MS); }

  row.querySelector('.pc-prev').addEventListener('click', function () { go(-1); });
  row.querySelector('.pc-next').addEventListener('click', function () { go(1); });
  btn.addEventListener('click', function () {
    paused = !paused;
    btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? 'Play the slideshow' : 'Pause the slideshow');
    if (paused) hold(); else run();
  });

  ring();
  if (!still) schedule(MS);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      var was = seen; seen = e[0].isIntersecting;
      if (was && !seen) { hold(); row.classList.add('held'); }
      if (!was && seen) { row.classList.remove('held'); run(); }
    }).observe(hx);
  }
})();
