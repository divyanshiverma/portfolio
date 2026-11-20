// Generates the static pages from assets/shots/*/notes.json and assets/behance/behance.json.
// Run: node tools/build.mjs   (output is plain HTML, nothing is needed at serve time)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rd = (p) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')); } catch { return null; } };
const has = (p) => fs.existsSync(path.join(ROOT, p));
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  .replace(/—|–/g, ',').replace(/--/g, ',');

// JPEG/PNG/WebP size, so every img gets width and height and the layout does not jump.
function dims(rel) {
  try {
    const b = fs.readFileSync(path.join(ROOT, rel));
    if (b[0] === 0x89) return [b.readUInt32BE(16), b.readUInt32BE(20)];
    if (b.toString('ascii', 8, 12) === 'WEBP') {
      const t = b.toString('ascii', 12, 16);
      if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
      if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
      if (t === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
    }
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  } catch {}
  return null;
}
const img = (rel, alt, prefix = '', cls = '', eager = false) => {
  const d = dims(rel);
  return `<img src="${prefix}${rel}" alt="${esc(alt)}"${d ? ` width="${d[0]}" height="${d[1]}"` : ''}${eager ? '' : ' loading="lazy"'} decoding="async"${cls ? ` class="${cls}"` : ''}>`;
};

// Device frames. The screen box has the screenshot's own aspect ratio, so the
// image is never cropped. `inner` replaces the single image (the hero stacks several).
const laptop = (src, alt, pre = '', cls = '', eager = false, inner = null) => (src || inner) ? `<div class="laptop${cls ? ` ${cls}` : ''}"><div class="lt-lid"><div class="lt-screen">${inner ?? img(src, alt, pre, '', eager)}</div></div><div class="lt-base"></div></div>` : '';
// Phones are pre-rendered mockups (real iPhone 14 Pro frame from devices.css,
// MIT) made by tools/mockups.mjs from each mobile-light screenshot.
const mockOf = (src) => {
  const m = /assets\/shots\/([^/]+)\/mobile-light\.webp$/.exec(src || '');
  return m && has(`assets/mockups/${m[1]}-phone.webp`) ? `assets/mockups/${m[1]}-phone.webp` : null;
};
const phone = (src, alt, pre = '', cls = '', eager = false, inner = null) => {
  if (inner) return `<div class="mock-phone${cls ? ` ${cls}` : ''}"><div class="mock-stack">${inner}</div></div>`;
  const m = mockOf(src);
  return m ? `<div class="mock-phone${cls ? ` ${cls}` : ''}">${img(m, alt, pre, '', eager)}</div>` : '';
};

const ORDER = [
  ['fadedtofresh', 'Faded to Fresh', 'https://fadedtofresh.shalu.ai/app/', 'Restore and colourise old photos in the browser.'],
  ['kyakhaya', 'Kya Khaya', 'https://kyakhaya.com', 'Indian food calorie app: snap your plate, get calories and macros.'],
  ['ricezero', 'Ricezero', 'https://ricezero.com', 'Shirataki rice brand at 9 kcal per 100 g.'],
  ['casualkurta', 'Casual Kurta', 'https://casualkurta.com', 'Linen and hemp kurtas made in India, sold in Europe.'],
  ['forgetthetools', 'Forget the Tools', 'https://forgetthetools.com', 'Marketing research for Shopify and DTC brands.'],
  ['passiontodream', 'Passion to Dream', 'https://passiontodream.com', 'Lisbon visa, residency and work placement consultancy.'],
  ['fluentmint', 'FluentMint', 'https://fluentmint.com', 'Software income for course creators.'],
  ['callyourcode', 'CallYourCode', 'https://callyourcode.com', 'Talk to your coding agents from your phone.'],
  ['reelgenai', 'ReelgenAI', 'https://reelgenai.com', 'Turns a business URL into reels.'],
  ['robotbonsai', 'Robot Bonsai', 'https://robotbonsai.com', 'Small robots for your desk.'],
  ['shalu', 'ShaluAI', 'https://shalu.ai', 'Friendly AI for everyday life.'],
  ['shikherverma', 'Shikher Verma', 'https://shikherverma.com', 'Personal site with an interactive project shelf.'],
  ['lktechnology', 'LK Technology', 'https://lktechnology.in', 'Software, bots and AI, with ASCII pigeons.'],
  ['benzeneai', 'Benzene', 'https://benzeneai.com', 'Independent AI lab in the style of a scientific figure.'],
  ['commuterglasses', 'Commuter Glasses', 'https://commuterglasses.com', 'Sunglasses that show your ebook.'],
  ['typescriptnotebook', 'TypeScript Notebook', 'https://typescriptnotebook.com', 'Run TypeScript in the browser.'],
  ['divyanshiverma', 'Personal Site', 'https://divyanshiverma.com', 'My own site: marketing, design and a blog.'],
];

const projects = ORDER.map(([slug, name, url, tagline]) => {
  const n = rd(`assets/shots/${slug}/notes.json`) || {};
  const f = (x) => (has(`assets/shots/${slug}/${x}`) ? `assets/shots/${slug}/${x}` : null);
  const pick = (base) => f(`${base}.webp`) || f(`${base}.jpg`) || f(`${base}.png`);
  const flow = (n.flow || []).map((s) => ({ ...s, src: pick(String(s.file).replace(/\.(jpg|png|webp)$/, '')) })).filter((s) => s.src);
  return {
    slug, url: n.url || url, name,
    tagline: n.tagline || tagline, what: n.what || '', points: n.points || [],
    dl: pick('desktop-light'), dd: n.dark === false ? null : pick('desktop-dark'), long: pick('desktop-long'),
    ml: pick('mobile-light'), md: n.dark === false ? null : pick('mobile-dark'), flow, dark: n.dark,
  };
});
const behance = rd('assets/behance/behance.json') || [];

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600&family=Young+Serif&display=swap" rel="stylesheet">';
const head = (title, desc, pre) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${pre}assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${pre}assets/apple-touch-icon.png">
${FONTS}
<link rel="stylesheet" href="${pre}assets/css/site.css">
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
<header class="top">
  <a class="name" href="${pre}index.html">Divyanshi Verma</a>
  <nav aria-label="Main">
    <a href="${pre}index.html#work">Work</a>
    <a href="${pre}index.html#all">All sites</a>
    <a href="${pre}behance.html">Case studies</a>
    <a href="${pre}index.html#about">About</a>
  </nav>
</header>
<main id="main">`;
const foot = (pre) => `</main>
<footer>
  <span>Divyanshi Verma, product and brand designer, Bangalore</span>
  <a href="mailto:divyanshi.verma18@gmail.com">divyanshi.verma18@gmail.com</a>
</footer>
</div>
<script src="${pre}assets/js/site.js" defer></script>
</body>
</html>
`;

// ---------- home ----------
const lead = projects.slice(0, 5);
// Hero: every site, cycling through a laptop frame and a phone frame.
const reel = projects.filter((p) => p.dl);
const host = (u) => u.replace(/^https?:\/\//, '').replace(/\/$/, '');
const hero = `<section class="hx" aria-labelledby="h-hx">
  <div class="hx-head">
    <p class="hx-eyebrow">Product and brand designer, Bangalore</p>
    <h1 id="h-hx" class="hx-name">Divyanshi <span>Verma</span></h1>
  </div>
  <div class="hx-copy">
    <p class="hx-lede">I design websites people use and remember. ${reel.length} of them are live right now, from a photo restoration app to linen kurtas for European summers.</p>
    <div class="hx-cta"><a class="btn" href="#work">See the work</a><a class="btn ghost" href="mailto:divyanshi.verma18@gmail.com">Email me</a></div>
  </div>
  <div class="hx-stage">
    ${laptop(null, '', '', 'hx-laptop', false, `
${reel.map((p, i) => `        ${img(p.dl, `${p.name} home page on desktop`, '', i ? '' : 'on', i < 2).replace('<img ', `<img data-url="${esc(host(p.url))}" `)}`).join('\n')}
      `)}
    ${phone(null, '', '', 'hx-phone', false, `
${reel.filter((p) => mockOf(p.ml)).map((p, i) => `        ${img(mockOf(p.ml), '', '', i ? '' : 'on', i < 2)}`).join('\n')}
      `)}
    <p class="hx-url" aria-live="polite">${esc(host(reel[0].url))}</p>
  </div>
</section>`;

const home = `${head('Divyanshi Verma, product and brand designer', 'Portfolio of Divyanshi Verma, a product and brand designer in Bangalore. Seventeen live websites and her Behance case studies.', '')}
${hero}

<section class="sec" id="work" aria-labelledby="h-work">
  <div class="sec-head"><h2 id="h-work">Selected work</h2><p>The five I would show first. Each opens into screenshots on desktop and phone, the flows I designed, and notes on the decisions.</p></div>
  <div class="lead">
${lead.map((p, i) => `    <a class="lead-item" href="work/${p.slug}.html">
      <div class="lead-media">
        ${laptop(p.dl, `${p.name} home page on desktop`, '', 'rv')}
        ${phone(p.ml, `${p.name} on a phone`, '', 'lead-phone')}
      </div>
      <div class="lead-text">
        <span class="rank">${new URL(p.url).hostname.replace(/^www\./, '')}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.tagline)}</p>
        <span class="go">Read the case study</span>
      </div>
    </a>`).join('\n')}
  </div>
</section>

<section class="sec" id="all" aria-labelledby="h-more">
  <div class="sec-head"><h2 id="h-more">All sites</h2><p>All ${projects.length}, from brands and AI tools to personal sites. Every one has its own page.</p></div>
  <div class="grid">
${projects.map((p) => `    <a class="card" href="work/${p.slug}.html">
      <div class="thumb-device">${p.dl ? laptop(p.dl, `${p.name} home page`) : phone(p.ml, `${p.name} home page`)}</div>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.tagline)}</p>
    </a>`).join('\n')}
  </div>
</section>

<section class="sec" aria-labelledby="h-be">
  <div class="sec-head"><h2 id="h-be">Case studies from Behance</h2><p>${behance.length ? `${behance.length} published case studies. <a href="behance.html">See them all</a>.` : '<a href="https://www.behance.net/divyanshi-verma" rel="noopener">On Behance</a>.'}</p></div>
  <div class="be-grid">
${behance.slice(0, 6).map((b) => `    <a class="card" href="behance.html#${b.slug}">
      <div class="thumb">${has(b.cover) ? img(b.cover, `${b.title} cover`) : ''}</div>
      <h3>${esc(b.title)}</h3>
      <p>${esc((b.fields || []).slice(0, 2).join(', '))}</p>
    </a>`).join('\n')}
  </div>
</section>

<section class="sec about" id="about" aria-labelledby="h-about">
  <h2 id="h-about">About</h2>
  <div>
    <p>I work across product and brand, which on a small team means I do both at once: the logo and the checkout, the illustration and the empty state. I care about the parts that make a site feel made by a person, like a plate you can build, a lamp cord you can pull or a colour swatch that redraws the garment.</p>
    <p>My own site, <a href="https://divyanshiverma.com" rel="noopener">divyanshiverma.com</a>, has my marketing work and my blog. <a href="https://www.behance.net/divyanshi-verma" rel="noopener">Behance</a> has longer case studies.</p>
    <p>Write to me:</p>
    <a class="mail" href="mailto:divyanshi.verma18@gmail.com">divyanshi.verma18@gmail.com</a>
  </div>
</section>
${foot('')}`;
fs.writeFileSync(path.join(ROOT, 'index.html'), home);

// ---------- project pages ----------
const workList = projects;
workList.forEach((p, i) => {
  const pre = '../';
  const prev = workList[(i - 1 + workList.length) % workList.length];
  const next = workList[(i + 1) % workList.length];
  const host = new URL(p.url).hostname;
  const blocks = [];
  if (p.dd && p.dl) {
    blocks.push(`<section class="block" aria-labelledby="h-th"><h2 id="h-th">Light and dark, desktop</h2><div class="pair">
<figure>${laptop(p.dl, `${p.name} desktop, light theme`, pre)}<figcaption>Light</figcaption></figure>
<figure>${laptop(p.dd, `${p.name} desktop, dark theme`, pre)}<figcaption>Dark</figcaption></figure></div></section>`);
  }
  const phones = [p.ml && [p.ml, 'Phone, light'], p.md && [p.md, 'Phone, dark']].filter(Boolean);
  if (phones.length) {
    blocks.push(`<section class="block" aria-labelledby="h-ph"><h2 id="h-ph">On a phone</h2><div class="phones">
${phones.map(([s, c]) => `<figure>${phone(s, `${p.name}, ${c.toLowerCase()} theme at 390 px`, pre)}<figcaption>${c}</figcaption></figure>`).join('\n')}
</div>${p.dark === false ? `<p class="note">${esc(p.name)} has a single theme, so there is one set of captures.</p>` : ''}</section>`);
  }
  if (p.flow.length) {
    blocks.push(`<section class="block" aria-labelledby="h-fl"><h2 id="h-fl">The flow, step by step</h2><div class="flow" tabindex="0" aria-label="Flow steps, scroll sideways">
${p.flow.map((s, k) => `<figure><span class="step">${k + 1}</span>${img(s.src, `${p.name} step ${k + 1}: ${s.caption || ''}`, pre)}<figcaption>${esc(s.caption || '')}</figcaption></figure>`).join('\n')}
</div></section>`);
  }
  if (p.long) {
    blocks.push(`<section class="block" aria-labelledby="h-lg"><h2 id="h-lg">Further down the page</h2><figure class="long">${img(p.long, `${p.name}, a section further down the home page`, pre)}</figure></section>`);
  }
  if (p.points.length) {
    blocks.unshift(`<section class="block" aria-labelledby="h-pt"><h2 id="h-pt">Design decisions</h2><ul class="points">
${p.points.map((t) => `<li>${esc(t)}</li>`).join('\n')}
</ul></section>`);
  }
  const page = `${head(`${p.name}, a case study by Divyanshi Verma`, `${p.name}: ${p.tagline}`, pre)}
<article>
<header class="p-head">
  <div><h1>${esc(p.name)}</h1><p class="tag">${esc(p.tagline)}</p></div>
  <div>${p.what ? `<p class="what">${esc(p.what)}</p>` : ''}<a class="live" href="${esc(p.url)}" rel="noopener">Visit ${esc(host)}</a></div>
</header>
${p.dl ? `<div class="p-hero">${laptop(p.dl, `${p.name} home page on desktop`, pre, '', true)}${phone(p.ml, `${p.name} on a phone`, pre, 'p-hero-phone', true)}</div>` : ''}
${blocks.join('\n')}
</article>
<nav class="pager" aria-label="More projects">
  <a href="${prev.slug}.html"><small>Previous</small>${esc(prev.name)}</a>
  <a href="${next.slug}.html" style="text-align:right"><small>Next</small>${esc(next.name)}</a>
</nav>
${foot(pre)}`;
  fs.writeFileSync(path.join(ROOT, 'work', `${p.slug}.html`), page);
});

// ---------- behance page ----------
const be = `${head('Case studies, Divyanshi Verma', 'Case studies Divyanshi Verma published on Behance.', '')}
<header class="p-head">
  <div><h1>Case studies</h1><p class="tag">Longer write-ups first published on Behance.</p></div>
  <div><a class="live" href="https://www.behance.net/divyanshi-verma" rel="noopener">See the Behance profile</a></div>
</header>
${behance.length ? behance.map((b) => `<article class="sec" id="${esc(b.slug)}" aria-labelledby="b-${esc(b.slug)}">
  <div class="sec-head"><h2 id="b-${esc(b.slug)}">${esc(b.title)}</h2><p>${esc(b.summary || '')}${(b.fields || []).length ? `<br><span class="note">${esc(b.fields.join(', '))}</span>` : ''}<br><a href="${esc(b.url)}" rel="noopener">Open on Behance</a></p></div>
  <div class="flow" tabindex="0" aria-label="${esc(b.title)} images, scroll sideways">
${[b.cover, ...(b.images || [])].filter((s) => s && has(s)).map((s, k) => `<figure>${img(s, `${b.title}, ${k ? `image ${k}` : 'cover'}`)}</figure>`).join('\n')}
  </div>
</article>`).join('\n') : '<p>Case studies are on <a href="https://www.behance.net/divyanshi-verma">Behance</a>.</p>'}
${foot('')}`;
fs.writeFileSync(path.join(ROOT, 'behance.html'), be);
console.log('built', projects.length, 'projects,', behance.length, 'behance;', projects.filter((p) => !p.dl).map((p) => p.slug).join(' ') || 'all have shots');
