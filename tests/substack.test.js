import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubstackHandler, SUBSTACK_FEED } from '../netlify/lib/substack.js';
import { selectLatestPost, applyPostImage, loadLatestPost, loadWritingState, WRITING_SESSION_KEY, openLatestArticle } from '../src/js/modules/writing/latest.js';

const post = (title, date, image) => ({ title, published:date, url:`https://phixalek.substack.com/p/${title}`, image });

test('newest valid post wins independently of RSS order; missing image stays optional', () => {
  const latest = selectLatestPost([post('older','2026-09-30'), post('newer','2026-10-01')]);
  assert.equal(latest.title,'newer');
  assert.equal(latest.image,null);
  assert.equal(latest.published,'2026-10-01T00:00:00.000Z');
});
test('unsafe destinations, credentials, missing titles and invalid dates are excluded', () => {
  assert.equal(selectLatestPost([
    {...post('bad','2026-10-01'),url:'javascript:alert(1)'},
    {...post('bad','2026-10-01'),url:'https://other.example/p/bad'},
    {...post('bad','2026-10-01'),url:'https://user:password@phixalek.substack.com/p/bad'},
    post('', '2026-10-01'), post('bad','not a date'),
  ]),null);
  assert.equal(selectLatestPost([post('safe','2026-10-01','javascript:alert(1)')]).image,null);
});
test('proxy uses only the fixed publication feed and bypasses stale upstream and downstream caches', async () => {
  const xml='<rss><channel></channel></rss>';
  const handler=createSubstackHandler({fetchFeed:async(url,options)=>{
    const fresh = new URL(url);
    assert.equal(fresh.origin + fresh.pathname,SUBSTACK_FEED);
    assert.ok(Number(fresh.searchParams.get('_refresh')) > 0);
    assert.equal(options.cache,'no-store');
    assert.equal(options.headers['Cache-Control'],'no-cache');
    assert.equal(options.redirect,'error');
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(xml);
  }});
  const result=await handler({httpMethod:'GET',queryStringParameters:{url:'https://other.example'}});
  assert.equal(result.statusCode,200);
  assert.equal(result.body,xml);
  assert.equal(result.headers['Cache-Control'],'no-store');
});
test('unsupported methods do not fetch; upstream errors and invalid XML do not leak details', async () => {
  let calls=0;
  const handler=createSubstackHandler({fetchFeed:async()=>{calls++;throw new Error('private upstream detail');}});
  assert.equal((await handler({httpMethod:'POST'})).statusCode,405);
  assert.equal(calls,0);
  const result=await handler({httpMethod:'GET'});
  assert.equal(result.statusCode,503);
  assert.equal(result.body,'{"error":"writing_unavailable"}');
  for (const content of ['<html>error</html>','<!DOCTYPE rss><rss/>','<!ENTITY x "test"><rss/>']) {
    const invalid=createSubstackHandler({fetchFeed:async()=>new Response(content)});
    assert.equal((await invalid({httpMethod:'GET'})).statusCode,503);
  }
});
test('oversized feeds and non-success HTTP status are rejected', async () => {
  for (const response of [new Response('<rss/>',{status:503}),new Response('<rss/>',{headers:{'Content-Length':'3000000'}}),new Response('<rss>'+ 'x'.repeat(2*1024*1024)+'</rss>')]) {
    const handler=createSubstackHandler({fetchFeed:async()=>response});
    assert.equal((await handler({httpMethod:'GET'})).statusCode,503);
  }
});
test('failed feed request rejects for the component to preserve its current preview', async () => {
  await assert.rejects(loadLatestPost(async (url, options) => {
    assert.equal(options.cache,'no-store');
    return new Response('',{status:503});
  }),/Writing unavailable/);
});
test('cover stays visible on remote image failure and is restored on a later image error', async t => {
  const original=Object.getOwnPropertyDescriptor(globalThis,'Image');
  let fail=true;
  Object.defineProperty(globalThis,'Image',{configurable:true,value:class {async decode(){if(fail)throw new Error('Download failed');}}});
  t.after(()=>{if(original)Object.defineProperty(globalThis,'Image',original);else delete globalThis.Image;});
  const img={src:'local.svg'};
  await applyPostImage(img,'https://images.example/cover.jpg','local.svg');
  assert.equal(img.src,'local.svg');
  fail=false;
  await applyPostImage(img,'https://images.example/cover.jpg','local.svg');
  assert.equal(img.src,'https://images.example/cover.jpg');
  img.onerror();
  assert.equal(img.src,'local.svg');
  assert.equal(img.onerror,null);
  img.src='previous-post.jpg';
  await applyPostImage(img,null,'local.svg');
  assert.equal(img.src,'local.svg');
  img.src='previous-post.jpg';
  fail=true;
  await applyPostImage(img,'https://images.example/missing.jpg','local.svg');
  assert.equal(img.src,'local.svg');
});


test('page-load fetch runs once and distinguishes ready, empty and external failure', async () => {
  for (const expected of ['ready', 'empty', 'unavailable']) {
    let calls=0;
    const post={title:'New post'};
    const result=await loadWritingState(async()=>{
      calls++;
      if(expected==='unavailable')throw new Error('Substack offline');
      return expected==='ready' ? post : null;
    });
    assert.equal(calls,1);
    assert.equal(result.status,expected);
    assert.equal(result.post,expected==='ready' ? post : null);
  }
});


function session() {
  const values=new Map();
  return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
}
test('reload reuses the post and access date; a new tab session queries again', async () => {
  const storage=session();
  let calls=0;
  const load=async()=>{calls++;return post(`post-${calls}`,'2026-10-02');};
  const first=await loadWritingState(load,{storage});
  const reload=await loadWritingState(load,{storage});
  assert.equal(calls,1);
  assert.equal(reload.post.title,first.post.title);
  assert.equal(reload.accessedAt,first.accessedAt);
  const newTab=await loadWritingState(load,{storage:session()});
  assert.equal(calls,2);
  assert.equal(newTab.post.title,'post-2');
});
test('empty and external failure are also retained until a new session', async () => {
  for (const status of ['empty','unavailable']) {
    const storage=session();let calls=0;
    const load=async()=>{calls++;if(status==='unavailable')throw new Error('Offline');return null;};
    assert.equal((await loadWritingState(load,{storage})).status,status);
    assert.equal((await loadWritingState(load,{storage})).status,status);
    assert.equal(calls,1);
  }
});
test('concurrent requests share one fetch within the tab session', async () => {
  const storage=session();let calls=0,finish;
  const load=()=>{calls++;return new Promise(resolve=>finish=resolve);};
  const one=loadWritingState(load,{storage});
  const two=loadWritingState(load,{storage});
  finish(null);
  await Promise.all([one,two]);
  assert.equal(calls,1);
});
test('invalid cached data or blocked storage cannot break loading', async () => {
  for (const storage of [
    {getItem:()=>'{broken',setItem(){}},
    {getItem:()=>JSON.stringify({status:'ready',post:{url:'javascript:alert(1)'},accessedAt:'2026-10-02'}),setItem(){}},
    {getItem(){throw new Error('Blocked');},setItem(){throw new Error('Blocked');}},
  ]) {
    let calls=0;
    const result=await loadWritingState(async()=>{calls++;return null;},{storage});
    assert.equal(result.status,'empty');assert.equal(calls,1);
  }
  assert.ok(WRITING_SESSION_KEY);
});


test('explicit refresh replaces session data while reload still reuses it', async () => {
  const storage=session();let calls=0;
  const load=async()=>{calls++;return post(`article-${calls}`,'2026-10-02');};
  const first=await loadWritingState(load,{storage});
  const updated=await loadWritingState(load,{storage,force:true});
  const reload=await loadWritingState(load,{storage});
  assert.equal(calls,2);
  assert.equal(updated.post.title,'article-2');
  assert.equal(reload.post.title,'article-2');
  assert.equal(updated.accessedAt,first.accessedAt);
});
test('click opens the refreshed destination with opener detached', async () => {
  let prevented=false, destination;
  const popup={document:{body:{}},location:{replace:url=>destination=url},opener:{}};
  openLatestArticle({button:0,preventDefault:()=>prevented=true}, async()=> 'https://phixalek.substack.com/p/new-post','Loading…', {
    open:(url,target)=>{assert.equal(url,'about:blank');assert.equal(target,'_blank');return popup;},
  });
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(prevented,true);
  assert.equal(popup.opener,null);
  assert.equal(destination,'https://phixalek.substack.com/p/new-post');
});
test('modified click preserves native navigation and refreshes the card', () => {
  let calls=0;
  openLatestArticle({button:0,ctrlKey:true,preventDefault(){throw new Error('Must remain native');}},()=>{calls++;},'Loading…',{
    open(){throw new Error('Must remain native');},
  });
  assert.equal(calls,1);
});
