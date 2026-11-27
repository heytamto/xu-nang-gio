import test from 'node:test';
import assert from 'node:assert/strict';
import { isChunkLoadError, tryChunkRecovery, registerChunkRecovery } from '../src/shared/utils/chunkRecovery.js';
function mock(search = '?page=story') {
  const storage = new Map();
  return { navigator: {onLine:true}, document:{querySelector:()=>null}, count:0,
    location: {pathname:'/', search, reload(){}},
    sessionStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)} };
}
// Explicit browser double with independently observable reloads.
function browser(search) {
  const b=mock(search); b.location.reload=()=>b.count++; return b;
}
const error = new TypeError('Failed to fetch dynamically imported module: /assets/StoryPage.js');
test('recognizes dynamic import failure, not ordinary errors',()=>{assert.ok(isChunkLoadError(error));assert.equal(isChunkLoadError(new Error('validation failed')),false)});
test('reloads once per cooldown',()=>{const b=browser();assert.ok(tryChunkRecovery(error,b,100000));assert.equal(tryChunkRecovery(error,b,100001),false);assert.equal(b.count,1);assert.ok(tryChunkRecovery(error,b,160000));});
test('never auto reloads sensitive routes',()=>{for(const s of ['?page=checkout','?page=admin','?page=packing','?page=lookup','?order=XNG123'])assert.equal(tryChunkRecovery(error,browser(s)),false)});
test('offline and blocked storage do not reload',()=>{const b=browser();b.navigator.onLine=false;assert.equal(tryChunkRecovery(error,b),false);b.navigator.onLine=true;b.sessionStorage.getItem=()=>{throw Error()};assert.equal(tryChunkRecovery(error,b),false)});
test('editable modal blocks reload',()=>{const b=browser();b.document.querySelector=()=>({});assert.equal(tryChunkRecovery(error,b),false)});
test('preload event suppressed only when reloading',()=>{const b=browser();let handler;let prevented=0;b.addEventListener=(name,fn)=>{assert.equal(name,'vite:preloadError');handler=fn};b.removeEventListener=()=>{};registerChunkRecovery(b);const event={payload:error,preventDefault:()=>prevented++};handler(event);handler(event);assert.equal(prevented,1);assert.equal(b.count,1)});
