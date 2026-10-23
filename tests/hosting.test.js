import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production HTML policy blocks third-party requests and code', () => {
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/Content-Security-Policy/);
 for(const directive of ["default-src 'self'","script-src 'self'","font-src 'self'","connect-src 'self'","object-src 'none'"]) assert.ok(html.includes(directive));
 assert.doesNotMatch(html,/<(?:script|img)[^>]+src=["']https?:\/\//);
 assert.doesNotMatch(html,/<link[^>]+href=["']https?:\/\//);
});

test('static hosting includes SPA refresh rewrites and no health API requirement', () => {
 const netlify=fs.readFileSync(new URL('../public/_redirects',import.meta.url),'utf8');
 assert.match(netlify,/\/\*\s+\/index\.html\s+200/);
 const vercel=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(vercel.outputDirectory,'dist');
 assert.equal(vercel.rewrites[0].destination,'/index.html');
});
