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

// Hero stage: cycles through every site while the hero is on screen.
// No auto-advance under reduced motion.
(function () {
  var hx = document.querySelector('.hx');
  if (!hx) return;
  var shots = hx.querySelectorAll('.hx-laptop .lt-screen img');
  var phones = hx.querySelectorAll('.hx-phone .mock-stack img');
  var url = hx.querySelector('.hx-url');
  var cur = 0, seen = true;
  if (shots.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function show(i) {
    [shots, phones].forEach(function (set) {
      if (set[cur]) set[cur].classList.remove('on');
      if (set[i]) set[i].classList.add('on');
    });
    if (url) url.textContent = shots[i].getAttribute('data-url');
    cur = i;
  }
  setInterval(function () { if (seen) show((cur + 1) % shots.length); }, 2600);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { seen = e[0].isIntersecting; }).observe(hx);
  }
})();
