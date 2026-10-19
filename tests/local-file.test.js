import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const bundle = readFileSync(new URL('../sniper-elite/browser.js', import.meta.url), 'utf8');
for (const protocol of ['file:///C:/git/Github/boardgames/', 'https://example.com/boardgames/']) {
  for (const game of [false, true]) {
    test(`classic script boots ${game ? 'game' : 'index'} at ${protocol}`, () => {
      const page = new URL(game ? 'sniper-elite/index.html' : 'index.html', protocol);
      const events = {};
      const app = {innerHTML:'', addEventListener(){}};
      const document = {currentScript:{src:new URL('sniper-elite/browser.js', protocol).href}, documentElement:{}, querySelector:()=>app};
      const context = {URL, document, location:{pathname:page.pathname, hash:'#mission'}, localStorage:{getItem:()=>null,setItem(){}}, window:{addEventListener:(name,fn)=>events[name]=fn,scrollTo(){}}, requestAnimationFrame:fn=>fn()};
      vm.runInNewContext(bundle, context);
      // currentScript is only available during initial classic-script execution.
      document.currentScript = null;
      assert(app.innerHTML.includes('Sniper Elite'));
      assert(!bundle.includes('import.meta'));
      assert(!/^import |^export /m.test(bundle));
      if (game) {
        context.location.hash='#manual/core/4'; events.hashchange();
        assert(app.innerHTML.includes(new URL('sniper-elite/manuals/core.pdf#page=4', protocol).href));
        assert(app.innerHTML.includes(new URL('sniper-elite/assets/core-4.webp', protocol).href));
      } else {
        assert(app.innerHTML.includes(new URL('sniper-elite/index.html#mission', protocol).href));
      }
    });
  }
}
test('both entry pages load the committed classic bundle',()=>{
  for(const path of ['index.html','sniper-elite/index.html']){
    const html=readFileSync(new URL('../'+path,import.meta.url),'utf8');
    assert(!html.includes('type="module"'));
    assert(html.includes('browser.js'));
  }
});
