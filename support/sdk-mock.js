export const state={items:[],mode:null,playerListeners:[],sceneListeners:[],interactions:[],writes:[],ready:null,metadata:{},toolMetadata:{}};
const clone=x=>structuredClone(x);
const api={
  onReady(fn){state.ready=fn();},
  player:{id:'player',getMetadata:async()=>state.metadata,onChange:fn=>{state.playerListeners.push(fn);return()=>{};},getRole:async()=>'GM',hasPermission:async()=>true},
  scene:{isReady:async()=>true,onReadyChange:()=>()=>{},items:{
    getItems:async ids=>clone(state.items.filter(i=>ids.includes(i.id))),
    onChange:fn=>{state.sceneListeners.push(fn);return()=>{state.sceneListeners=state.sceneListeners.filter(f=>f!==fn);};},
    async updateItems(ids,fn){const items=state.items.filter(i=>ids.includes(i.id));fn(items);state.writes.push(clone(items));for(const listener of state.sceneListeners)listener(clone(state.items));}
  }},
  tool:{create:async()=>{},createMode:async mode=>{state.mode=mode;},setMetadata:async(_,data)=>{state.toolMetadata=data;}},
  interaction:{async startItemInteraction(items){
    const record={items:clone(items),frames:[],stopped:false};state.interactions.push(record);
    return [fn=>{fn(record.items);record.frames.push(clone(record.items));return record.items;},()=>{record.stopped=true;}];
  }},
  notification:{show:async()=>{throw Error('Unexpected notification');}}
};
export default api;
export function buildCurve(){
  const item={id:`fx-${Math.random()}`,type:'CURVE',position:{x:0,y:0},scale:{x:1,y:1}};
  const builder=new Proxy({}, {get:(_,key)=>key==='build'?()=>clone(item):value=>{item[key]=value;return builder;}});
  return builder;
}
