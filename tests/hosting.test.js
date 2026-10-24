import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production HTML policy blocks third-party requests and code', () => {
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/Content-Security-Policy/);
 assert.match(html,/<link rel="canonical" href="https:\/\/bloom-period-companion\.vercel\.app\/"\s*\/>/);
 assert.match(html,/<meta property="og:url" content="https:\/\/bloom-period-companion\.vercel\.app\/"\s*\/>/);
 for(const directive of ["default-src 'self'","script-src 'self'","font-src 'self'","connect-src 'self'","object-src 'none'"]) assert.ok(html.includes(directive));
 assert.doesNotMatch(html,/<(?:script|img)[^>]+src=["']https?:\/\//);
 assert.equal((html.match(/<link[^>]+href=["']https?:\/\//g)||[]).length,1,'only the absolute canonical link may use an external origin');
});

test('static hosting includes SPA refresh rewrites and no health API requirement', () => {
 const netlify=fs.readFileSync(new URL('../public/_redirects',import.meta.url),'utf8');
 assert.match(netlify,/\/\*\s+\/index\.html\s+200/);
 const vercel=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(vercel.outputDirectory,'dist');
 assert.equal(vercel.rewrites[0].destination,'/index.html');
});

test('Bloom PWA declares square install icons and worker precaches only static app-shell resources', async () => {
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(manifest.name.startsWith('Bloom'),true);
 assert.equal(manifest.start_url,'/');
 assert.equal(manifest.scope,'/');
 for(const icon of manifest.icons) {
  const path=new URL(`../public${icon.src}`,import.meta.url);
  assert.equal(fs.existsSync(path),true,`${icon.src} must exist`);
  if(icon.purpose==='maskable') assert.equal(icon.sizes,'512x512');
 }
 const { createBloomServiceWorker }=await import('../scripts/pwa-plugin.js');
 const worker=createBloomServiceWorker(['/index.html','/assets/app.abc.js','/bloom-app-192.png'],'test-version');
 assert.match(worker,/bloom-app-shell-/);
 assert.match(worker,/request\.mode === 'navigate'/);
 assert.doesNotMatch(worker,/localStorage|sessionStorage|indexedDB|POST|backgroundSync|runtimeCache/i);
 assert.doesNotMatch(worker,/https?:\/\//);
 assert.match(worker,/PRECACHE_URLS/);
});

test('Vercel SPA rewrite excludes PWA files and the Bloom package identity is current', () => {
 const vercel=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 const source=vercel.rewrites[0].source;
 for(const path of ['manifest\\.webmanifest','sw\\.js','bloom-app-192\\.png','bloom-app-512\\.png','bloom-app-maskable-512\\.png']) assert.ok(source.includes(path),`${path} must bypass the SPA rewrite`);
 const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(pkg.name,'bloom-menstrual-companion');
 const headers=vercel.headers;
 assert.deepEqual(headers.find(rule=>rule.source==='/sw.js').headers.map(h=>h.value),['application/javascript; charset=utf-8','no-cache']);
 assert.deepEqual(headers.find(rule=>rule.source==='/manifest.webmanifest').headers.map(h=>h.value),['application/manifest+json; charset=utf-8','no-cache']);
 const staticHeaders=fs.readFileSync(new URL('../public/_headers',import.meta.url),'utf8');
 assert.match(staticHeaders,/\/sw\.js[\s\S]*Cache-Control: no-cache/);
 assert.match(staticHeaders,/\/manifest\.webmanifest[\s\S]*application\/manifest\+json/);
});
