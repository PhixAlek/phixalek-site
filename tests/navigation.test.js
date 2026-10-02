import test from 'node:test';
import assert from 'node:assert/strict';
import { activeSection, mountNavigation } from '../src/js/modules/common/navigation.js';
test('home is active before any following section crosses the header', () => {
  assert.equal(activeSection([{id:'home',top:0},{id:'about',top:500}],80),'home');
});
test('crossing the reading line changes the active section in either direction', () => {
  assert.equal(activeSection([{id:'home',top:-600},{id:'about',top:80},{id:'work',top:500}],80),'about');
  assert.equal(activeSection([{id:'home',top:-599},{id:'about',top:81},{id:'work',top:501}],80),'home');
});
test('a short final section is active at the bottom of the page', () => {
  assert.equal(activeSection([{id:'work',top:-300},{id:'contact',top:350}],80,true),'contact');
});
test('empty navigation is supported',()=>assert.equal(activeSection([],80),null));

test('active navigation follows page order when Projects precedes About in the header', t => {
  const attributes = () => ({ values:new Map(), setAttribute(key,value){this.values.set(key,value);}, removeAttribute(key){this.values.delete(key);} });
  const links = ['work','about','contact'].map(id => ({ ...attributes(), hash:`#${id}` }));
  const sections = [{id:'home',top:-800},{id:'about',top:-100},{id:'work',top:700},{id:'contact',top:1400}]
    .map(section => ({...section,getBoundingClientRect:()=>({top:section.top})}));
  const events = {addEventListener(){},removeEventListener(){}};
  const stub = (key, value) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis,key);
    Object.defineProperty(globalThis,key,{value,configurable:true});
    t.after(() => { if(previous) Object.defineProperty(globalThis,key,previous); else delete globalThis[key]; });
  };
  stub('window',{...events,scrollY:800,innerHeight:700});
  stub('document',{...events,documentElement:{scrollHeight:4000,style:{setProperty(){}}}});
  stub('ResizeObserver',class{observe(){}disconnect(){}});
  stub('cancelAnimationFrame',()=>{});
  const cleanup = mountNavigation({querySelectorAll:()=>links,getBoundingClientRect:()=>({height:80})},{querySelectorAll:()=>sections});
  assert.equal(links[1].values.get('aria-current'),'location');
  assert.equal(links[0].values.has('aria-current'),false);
  cleanup();
});
test('compact About and Contact keep the requested visible anchor active at the bottom', t => {
  const links = ['about','contact'].map(id => ({ hash:`#${id}`, values:new Map(), setAttribute(key,value){this.values.set(key,value);}, removeAttribute(key){this.values.delete(key);} }));
  const sections = ['about','contact'].map(id => ({ id, closest:()=>({}), getBoundingClientRect:()=>({top:200,bottom:500}) }));
  const events = {addEventListener(){},removeEventListener(){}};
  const stub = (key, value) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis,key);
    Object.defineProperty(globalThis,key,{value,configurable:true});
    t.after(() => { if(previous) Object.defineProperty(globalThis,key,previous); else delete globalThis[key]; });
  };
  const view = {...events,scrollY:1000,innerHeight:700,location:{hash:'#about'}};
  stub('window',view);
  stub('document',{...events,documentElement:{scrollHeight:1700,style:{setProperty(){}}}});
  stub('ResizeObserver',class{observe(){}disconnect(){}});
  stub('cancelAnimationFrame',()=>{});
  const header = {querySelectorAll:()=>links,getBoundingClientRect:()=>({height:80})};
  for (const id of ['about','contact']) {
    view.location.hash = `#${id}`;
    const cleanup = mountNavigation(header,{querySelectorAll:()=>sections});
    assert.equal(links.find(link=>link.hash===`#${id}`).values.get('aria-current'),'location');
    assert.equal(links.find(link=>link.hash!==`#${id}`).values.has('aria-current'),false);
    cleanup();
  }
});

test('both menus follow anchors, disclosure actions and section hover without scroll overriding desktop selection', t => {
  const callbacks = new Map();
  const events = {addEventListener(name, fn){callbacks.set(name,fn);},removeEventListener(){}};
  const links = ['work','writing','about','contact'].map(id => ({
    hash:`#${id}`, values:new Map(),
    setAttribute(key,value){this.values.set(key,value);},
    removeAttribute(key){this.values.delete(key);},
  }));
  const drawerLinks = links.map(link => ({...link, values:new Map()}));
  const sections = links.map(link => ({
    id:link.hash.slice(1), closest:()=>({}), contains:()=>false,
    getBoundingClientRect:()=>({top:200,bottom:500}),
    getAttribute:()=>null, setAttribute(){}, focus(){}, addEventListener(){},
  }));
  const stub = (key, value) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis,key);
    Object.defineProperty(globalThis,key,{value,configurable:true});
    t.after(() => { if(previous) Object.defineProperty(globalThis,key,previous); else delete globalThis[key]; });
  };
  let desktop = true;
  let pending;
  stub('window',{...events,scrollY:1000,innerHeight:700,location:{hash:''},matchMedia:()=>({matches:desktop})});
  stub('document',{...events,getElementById:id=>id==='mobile-menu' ? {querySelectorAll:()=>drawerLinks} : sections.find(section=>section.id===id),documentElement:{scrollHeight:1700,style:{setProperty(){}}}});
  stub('ResizeObserver',class{observe(){}disconnect(){}});
  stub('requestAnimationFrame',fn=>{pending=fn;return 1;});
  stub('cancelAnimationFrame',()=>{});
  const cleanup = mountNavigation({querySelectorAll:()=>links,getBoundingClientRect:()=>({height:80})},{...events,querySelectorAll:()=>sections});
  const active = () => links.filter(link=>link.values.has('aria-current')).map(link=>link.hash);
  assert.deepEqual(active(),[]);
  for (const id of ['writing','about','contact']) {
    const link = links.find(link=>link.hash===`#${id}`);
    callbacks.get('click')({target:{closest:selector=>selector.startsWith('a[') ? link : null},button:0});
    pending();
    assert.deepEqual(active(),[`#${id}`]);
    callbacks.get('scroll')(); pending();
    assert.deepEqual(active(),[`#${id}`]);
  }
  for (const hash of ['#about','#contact']) {
    const control = {matches:()=>hash==='#contact'};
    callbacks.get('click')({target:{closest:()=>control},button:0,defaultPrevented:true});
    pending();
    assert.deepEqual(active(),[hash]);
    assert.deepEqual(drawerLinks.filter(link=>link.values.has('aria-current')).map(link=>link.hash),[hash]);
  }
  const hovered = sections.find(section=>section.id==='writing');
  callbacks.get('pointerover')({pointerType:'mouse',target:{closest:()=>hovered},relatedTarget:null});
  pending();
  assert.deepEqual(active(),['#writing']);
  assert.deepEqual(drawerLinks.filter(link=>link.values.has('aria-current')).map(link=>link.hash),['#writing']);
  desktop = false;
  callbacks.get('resize')(); pending();
  assert.deepEqual(active(),['#writing']);
  // Touch does not select a section merely by scrolling over it.
  callbacks.get('pointerover')({pointerType:'touch',target:{closest:()=>sections[0]},relatedTarget:null});
  assert.deepEqual(active(),['#writing']);
  cleanup();
});
