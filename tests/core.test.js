import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destination,duration,ease,lerp,normalize } from '../src/core.js';
test('arraste mantém o deslocamento do ponto de pega até o centro do token',()=>{
  assert.deepEqual(destination({x:100,y:200},{x:125,y:190},{x:425,y:90}),{x:400,y:100});
});
test('trajetória chega exatamente ao destino, inclusive em coordenadas negativas',()=>{
  const a={x:314.25,y:-400},b={x:-920.125,y:87.75};
  assert.deepEqual(lerp(a,b,ease(0)),a);
  assert.deepEqual(lerp(a,b,ease(1)),b);
  let last=0;
  for(let i=0;i<=100;i++){const t=ease(i/100);assert.ok(t>=last&&t<=1);last=t;}
});
test('tempos limitados, modo lento maior e entrada inválida recuperada',()=>{
  for(const d of [1,100,1000,1e9]){
    assert.ok(duration(d,'fast')>=260&&duration(d,'fast')<=650);
    assert.ok(duration(d,'slow')>duration(d,'fast'));
  }
  assert.deepEqual(normalize(null),{enabled:true,speed:'fast',effects:true});
  assert.deepEqual(normalize({enabled:false,effects:false,speed:'slow'}),{enabled:false,effects:false,speed:'slow'});
});
