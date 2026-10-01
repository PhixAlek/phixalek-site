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
