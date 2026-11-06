import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';
import { state } from '../support/sdk-mock.js';
import { ID } from '../src/core.js';
register('../support/sdk-loader.js',import.meta.url);
globalThis.window={location:{href:'https://example.test/repo/background.html'},addEventListener(){}};
await import('../src/background.js');
await state.ready;
const token=()=>({id:'hero',type:'IMAGE',layer:'CHARACTER',locked:false,position:{x:100,y:200},scale:{x:2,y:3},rotation:37,visible:true,zIndex:8,createdUserId:'player',lastModified:'initial',metadata:{other:'preserve'},image:{url:'hero.png'}});
async function until(predicate){for(let i=0;i<300;i++){if(predicate())return;await delay(10);}throw Error('Timeout');}
function launch(){
  const target=structuredClone(state.items[0]);
  state.mode.onToolDown({}, {target,pointerPosition:{x:110,y:210}});
  state.mode.onToolDragStart({}, {target,pointerPosition:{x:112,y:212}});
  state.mode.onToolDragEnd({}, {target,pointerPosition:{x:210,y:310}});
}
test('ciclo de interação: posição exata, preservação, efeitos temporários e cancelamento',async t=>{
  await t.test('Dash completo preserva todos os campos exceto position',async()=>{
    state.items=[token()];const before=structuredClone(state.items[0]);launch();
    await until(()=>state.interactions[0]?.stopped);
    assert.equal(state.writes.length,1);
    assert.deepEqual(state.items[0],{...before,position:{x:200,y:300}});
    assert.equal(state.items.length,1);
    assert.equal(state.interactions[0].items.length,23);
    assert.deepEqual(state.interactions[0].frames.at(-1)[0].position,{x:200,y:300});
  });
  await t.test('efeitos desligados usam somente o token na interação',async()=>{
    for(const fn of state.playerListeners)fn({metadata:{[ID]:{enabled:true,effects:false,speed:'fast'}}});
    state.items=[token()];launch();await until(()=>state.interactions[1]?.stopped);
    assert.equal(state.interactions[1].items.length,1);
    assert.deepEqual(state.items[0].position,{x:200,y:300});
  });
  await t.test('edição externa cancela e não é sobrescrita',async()=>{
    state.items=[token()];const count=state.writes.length;launch();
    await until(()=>state.interactions.length===3);
    state.items[0].position={x:-600,y:88};state.items[0].lastModified='remote-edit';
    for(const fn of [...state.sceneListeners])fn(structuredClone(state.items));
    await until(()=>state.interactions[2].stopped);await delay(20);
    assert.equal(state.writes.length,count);
    assert.deepEqual(state.items[0].position,{x:-600,y:88});
  });
  await t.test('desabilitar devolve o arraste convencional por metadados e não inicia Dash',async()=>{
    for(const fn of state.playerListeners)fn({metadata:{[ID]:{enabled:false}}});
    await delay(0);assert.equal(state.toolMetadata.enabled,false);
    state.items=[token()];launch();await delay(20);assert.equal(state.interactions.length,3);
    assert.deepEqual(state.mode.preventDrag,{metadata:[{key:'enabled',value:false}]});
  });
});
