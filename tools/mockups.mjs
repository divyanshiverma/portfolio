// Bake every phone screenshot into a real iPhone 14 Pro frame (devices.css, MIT).
import { chromium } from 'playwright';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const ROOT = new URL('..', import.meta.url).pathname;
const SITE = ROOT;
const css = fs.readFileSync(`${ROOT}tools/vendor/devices.min.css`, 'utf8');
const slugs = fs.readdirSync(`${SITE}/assets/shots`).filter((d) => fs.existsSync(`${SITE}/assets/shots/${d}/mobile-light.webp`));
fs.mkdirSync(`${SITE}/assets/mockups`, { recursive: true });
const ICONS = `<span style="display:flex;gap:6px;align-items:center">
<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.2-1.2C13.3 1.7 10.8.6 8 .6S2.7 1.7.8 3.6L2 4.8c1.6-1.5 3.7-2.4 6-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.2C11.4 5 9.8 4.3 8 4.3S4.6 5 3.4 6.1l1.2 1.2C5.5 6.5 6.7 6 8 6zm0 3.6c-.4 0-.8.1-1.1.4L8 11.2 9.1 10c-.3-.3-.7-.4-1.1-.4z"/></svg>
<svg width="28" height="13" viewBox="0 0 28 13"><rect x=".5" y=".5" width="24" height="12" rx="3.6" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="21" height="9" rx="2.3" fill="currentColor"/><path d="M26 4.3v4.4c.9-.3 1.5-1.2 1.5-2.2s-.6-1.9-1.5-2.2z" fill="currentColor" opacity=".45"/></svg></span>`;
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 600, height: 1000 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
for (const slug of slugs) {
  const img = 'data:image/webp;base64,' + fs.readFileSync(`${SITE}/assets/shots/${slug}/mobile-light.webp`).toString('base64');
  // Sample the page's top-left pixel so the status bar matches the site, and
  // pick dark or light status icons from its luminance, as iOS does.
  const [top, fg] = await p.evaluate(async (src) => {
    const im = new Image(); im.src = src; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const [r, gg, bb] = g.getImageData(6, 3, 1, 1).data;
    const lum = (0.2126 * r + 0.7152 * gg + 0.0722 * bb) / 255;
    return [`rgb(${r},${gg},${bb})`, lum > 0.55 ? '#000' : '#fff'];
  }, img);
  await p.setContent(`<!doctype html><html><head><style>${css}
    html,body{margin:0;background:transparent}
    #wrap{display:inline-block;padding:8px}
    /* screen matches the 390x844 screenshots exactly */
    /* a real iPhone screen: status bar in the page's own top colour, page below it */
    .device-iphone-14-pro .device-screen{height:830px;position:relative;overflow:hidden;background:var(--top)}
    .scr img{position:absolute;top:54px;left:0;width:390px;height:844px;display:block}
    .sb{position:absolute;top:0;left:0;right:0;height:54px;display:flex;justify-content:space-between;align-items:center;padding:4px 30px 0 52px;color:var(--fg);font:600 17px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;letter-spacing:-.2px;z-index:1}
    .sb svg{display:block}
  </style></head><body><div id="wrap"><div class="device device-iphone-14-pro">
    <div class="device-frame"><div class="device-screen scr" style="--top:${top};--fg:${fg}"><div class="sb"><span>9:41</span>${ICONS}</div><img src="${img}"></div></div>
    <div class="device-stripe"></div><div class="device-header"></div><div class="device-sensors"></div>
    <div class="device-btns"></div><div class="device-power"></div>
  </div></div></body></html>`);
  await p.waitForTimeout(150);
  const el = await p.$('#wrap');
  const png = `/tmp/${slug}-phone.png`;
  await el.screenshot({ path: png, omitBackground: true });
  execFileSync('cwebp', ['-quiet', '-q', '86', '-alpha_q', '100', png, '-o', `${SITE}/assets/mockups/${slug}-phone.webp`]);
  console.log('ok', slug);
}
await b.close();
