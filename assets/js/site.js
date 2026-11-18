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

// Hero stage: hover or focus a site in the index to show it; otherwise it
// cycles on its own while visible. No auto-advance under reduced motion.
(function () {
  var hx = document.querySelector('.hx');
  if (!hx) return;
  var links = hx.querySelectorAll('.hx-list a');
  var shots = hx.querySelectorAll('.hx-laptop .lt-screen img');
  var phones = hx.querySelectorAll('.hx-phone .mock-stack img');
  var url = hx.querySelector('.hx-url');
  var cur = 0, timer = null, held = false, seen = true;
  function show(i) {
    if (i === cur) return;
    [links, shots, phones].forEach(function (set) {
      if (set[cur]) set[cur].classList.remove('on');
      if (set[i]) set[i].classList.add('on');
    });
    if (url && links[i]) url.textContent = links[i].getAttribute('data-url');
    cur = i;
  }
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick() { if (!held && seen) show((cur + 1) % links.length); }
  if (!still) timer = setInterval(tick, 2600);
  links.forEach(function (a, i) {
    a.addEventListener('mouseenter', function () { held = true; show(i); });
    a.addEventListener('focus', function () { held = true; show(i); });
    a.addEventListener('mouseleave', function () { held = false; });
    a.addEventListener('blur', function () { held = false; });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { seen = e[0].isIntersecting; }).observe(hx);
  }
})();
