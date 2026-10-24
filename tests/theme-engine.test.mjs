import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={window:{}};vm.createContext(context);
vm.runInContext(readFileSync(new URL('../themes.js',import.meta.url),'utf8'),context);
const engine=context.window.__nuxradThemeCatalog;
assert.equal(engine.themes.length,6);
assert.equal(new Set(engine.themes.map(theme=>theme.profile.rail+':'+theme.profile.header+':'+theme.profile.radius)).size,6);
const css=engine.compile({'.a, .b':{'&:hover, & .child':{opacity:.5,fontWeight:600}},'& :is(.x,.y)':{padding:4},'@media (max-width: 700px)':{'& button':{minHeight:32}}});
for(const fragment of ['html[data-nuxrad-pro="on"] .a:hover','html[data-nuxrad-pro="on"] .b:hover','html[data-nuxrad-pro="on"] .a .child','html[data-nuxrad-pro="on"] .b .child','html[data-nuxrad-pro="on"] :is(.x,.y)','padding:4px!important','opacity:0.5!important','font-weight:600!important','@media (max-width: 700px)'])assert.ok(css.includes(fragment),fragment);
const settings=engine.normalize({scale:999,density:'unknown',navigation:'icons'});
assert.equal(settings.scale,100);assert.equal(settings.density,'theme');assert.equal(settings.navigation,'icons');
for(const theme of engine.themes){const compiled=engine.stylesheet(theme,{});assert.ok(compiled.includes('font-family:'));assert.ok(compiled.includes('border-radius:'));assert.ok(compiled.includes('--ui-header-height:'));assert.ok(theme.palettes.BR&&theme.palettes.BV);}
console.log('PASS: six distinct theme profiles, scoped nested selectors, selector lists, CSS units, responsive rules, and setting validation');
