import OBR, { buildCurve } from '@owlbear-rodeo/sdk';
import { ID, TOOL, MODE, normalize, destination, same, duration, ease, lerp } from './core.js';
/** @typedef {import('@owlbear-rodeo/sdk').Item} Item */
/** @typedef {import('@owlbear-rodeo/sdk').Vector2} Point */
/** @typedef {import('@owlbear-rodeo/sdk').ToolEvent} ToolEvent */
let settings=normalize(null);
/** @type {{item:Item, down:Point}|null} */
let drag=null;
let busy=false;
let generation=0;
/** @type {null | (()=>void)} */
let cancelAnimation=null;
const icon=new URL('./icon.svg',window.location.href).href;
/** @param {unknown} error */
function report(error) {
  console.error('[Dash]',error);
  void OBR.notification.show('Dash não concluído. Confira a cena e as permissões.','ERROR').catch(console.error);
}
/** @param {Item | undefined} item */
async function permitted(item) {
  if (!item || item.type!=='IMAGE' || item.layer!=='CHARACTER' || item.locked || item.attachedTo) return false;
  if (await OBR.player.getRole()==='GM') return true;
  if (!await OBR.player.hasPermission('CHARACTER_UPDATE')) return false;
  return !await OBR.player.hasPermission('CHARACTER_OWNER_ONLY') || item.createdUserId===OBR.player.id;
}
/** @param {Item} item @param {Point} end */
function makeEffects(item,end) {
  const angle=Math.atan2(end.y-item.position.y,end.x-item.position.x)*180/Math.PI;
  return Array.from({length:22},(_,i) => buildCurve()
    .name('Dash temporário').layer('DRAWING').zIndex(item.zIndex-0.01)
    .visible(item.visible).locked(true).disableHit(true)
    .position(item.position).rotation(angle)
    .points(i<8 ? [{x:-45,y:0},{x:-20,y:-4},{x:0,y:0}] : [{x:-4,y:0},{x:0,y:0}])
    .strokeColor(i<8?'#cff8ff':'#eee6ff').strokeWidth(i<8?2.5:3.5)
    .strokeOpacity(i<8?0.55:0.8).fillOpacity(0).tension(0.6).build());
}
/** @param {Item} original @param {Point} end */
async function animate(original,end) {
  const epoch=generation;
  const [current]=await OBR.scene.items.getItems([original.id]);
  if (epoch!==generation || !await permitted(current) || !current || current.lastModified!==original.lastModified || !same(current.position,original.position)) return;
  const start={...current.position};
  const distance=Math.hypot(end.x-start.x,end.y-start.y);
  if (distance<0.01) return;
  const ms=duration(distance,settings.speed);
  const fx=settings.effects?makeEffects(current,end):[];
  const base=[current,...fx];
  const interaction=await OBR.interaction.startItemInteraction(base);
  const [update,stop]=interaction;
  if (epoch!==generation) {stop();return;}
  let cancelled=false;
  let committing=false;
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let timer;
  /** @type {()=>void} */
  let wake=()=>{};
  const cancel=()=>{cancelled=true;clearTimeout(timer);stop();wake();};
  cancelAnimation=cancel;
  const unsubscribe=OBR.scene.items.onChange(items => {
    if (committing) return;
    const next=items.find(i=>i.id===current.id);
    // Interactions do not persist scene items; any persisted edit here is external.
    if (!next || next.lastModified!==current.lastModified || !same(next.position,start)) cancel();
  });
  try {
    const begun=performance.now();
    const ux=(end.x-start.x)/distance, uy=(end.y-start.y)/distance;
    await new Promise((resolve,reject)=>{
      wake=()=>resolve(undefined);
      function tick() {
        if (cancelled) {resolve(undefined);return;}
        try {
          const elapsed=performance.now()-begun;
          const t=Math.min(1,elapsed/ms);
          update(items=>{
            items[0].position=lerp(start,end,ease(t));
            for (let i=1;i<items.length;i++) {
              const k=i-1;
              // Staggered, deterministic bursts; all positions use map coordinates.
              const phase=((elapsed/270+k*0.137)%1);
              const age=Math.min(1,phase+Math.max(0,elapsed-ms)/280);
              const emissionT=Math.max(0,Math.min(1,(elapsed-phase*270)/ms));
              const anchor=lerp(start,end,ease(emissionT));
              const side=Math.sin(k*12.7)*35;
              const trail=age*(k<8?95:65);
              items[i].position={x:anchor.x-ux*trail-uy*side,y:anchor.y-uy*trail+ux*side};
              const size=Math.max(0.001,(1-age)*Math.min(1,elapsed/80));
              items[i].scale={x:size,y:size};
            }
          });
          if (elapsed>=ms+(fx.length?300:0)) resolve(undefined);
          else timer=setTimeout(tick,16);
        } catch (error) {reject(error);}
      }
      tick();
    });
    if (cancelled || epoch!==generation || !await OBR.scene.isReady()) return;
    if (!await permitted(current)) return;
    committing=true;
    // Persist only the exact position, and only if no other editor changed the token.
    // Persist before stopping the overlay, avoiding a snap back to its origin.
    await OBR.scene.items.updateItems([current.id],items=>{
      const item=items[0];
      if (item && item.lastModified===current.lastModified && same(item.position,start) && !item.locked && !item.attachedTo) item.position={...end};
    });
  } finally {
    clearTimeout(timer);
    unsubscribe();
    stop();
    if (cancelAnimation===cancel) cancelAnimation=null;
  }
}
/** @param {ToolEvent} event */
function startDrag(event) {
  drag=null;
  if (!settings.enabled || busy || !event.target || event.transformer || event.target.locked || event.target.layer!=='CHARACTER' || event.target.type!=='IMAGE' || event.target.attachedTo) return;
  drag={item:structuredClone(event.target),down:{...event.pointerPosition}};
}
/** @param {ToolEvent} event */
async function endDrag(event) {
  const pending=drag; drag=null;
  if (!pending || busy || !settings.enabled) return;
  const end=destination(pending.item.position,pending.down,event.pointerPosition);
  if (!Number.isFinite(end.x) || !Number.isFinite(end.y)) return;
  busy=true;
  try {await animate(pending.item,end);} catch(error) {report(error);} finally {busy=false;}
}
OBR.onReady(async()=>{
  try {
    settings=normalize((await OBR.player.getMetadata())[ID]);
    OBR.player.onChange(player=>{
      settings=normalize(player.metadata[ID]);
      if (!settings.enabled) {generation++;drag=null;cancelAnimation?.();}
    });
    OBR.scene.onReadyChange(()=>{generation++;drag=null;cancelAnimation?.();});
    await OBR.tool.create({id:TOOL,icons:[{icon,label:'Dash — arraste um personagem'}],defaultMode:MODE});
    await OBR.tool.createMode({
      id:MODE,icons:[{icon,label:'Dash',filter:{activeTools:[TOOL]}}],
      cursors:[{cursor:'crosshair'}],
      // If Dash is off, hand dragging back to Owlbear's conventional Move operation.
      preventDrag:{metadata:[{key:'enabled',value:false}]},
      onToolDown:(_,event)=>startDrag(event),
      onToolDragStart:(_,event)=>{if (!drag) startDrag(event);},
      onToolDragEnd:(_,event)=>{void endDrag(event);},
      onToolDragCancel:()=>{drag=null;},
      onDeactivate:()=>{drag=null;},
      onToolClick:()=>true
    });
    await OBR.tool.setMetadata(TOOL,{enabled:settings.enabled});
    OBR.player.onChange(player=>{
      void OBR.tool.setMetadata(TOOL,{enabled:normalize(player.metadata[ID]).enabled}).catch(report);
    });
  } catch(error) {report(error);}
});
window.addEventListener('pagehide',()=>{generation++;drag=null;cancelAnimation?.();});
