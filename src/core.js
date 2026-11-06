/** @typedef {{x:number,y:number}} Point */
export const ID = 'io.github.owlbear-dash.v1';
export const TOOL = `${ID}/tool`;
export const MODE = `${ID}/mode`;
export const DEFAULTS = Object.freeze({ enabled: true, speed: 'fast', effects: true });
/** @param {unknown} raw */
export function normalize(raw) {
  const s = /** @type {{enabled?:boolean,speed?:string,effects?:boolean} | null} */ (raw);
  return { enabled: typeof s?.enabled === 'boolean' ? s.enabled : true,
    speed: s?.speed === 'slow' ? 'slow' : 'fast',
    effects: typeof s?.effects === 'boolean' ? s.effects : true };
}
/** @param {Point} a @param {Point} b */
export const same = (a,b) => a.x === b.x && a.y === b.y;
/** @param {Point} a @param {Point} b @param {number} t */
export function lerp(a,b,t) { return { x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t }; }
/** @param {number} t */
export const ease = t => 1 - (1-Math.max(0,Math.min(1,t)))**3;
/** @param {Point} origin @param {Point} down @param {Point} release */
export const destination = (origin, down, release) => ({x:origin.x+release.x-down.x,y:origin.y+release.y-down.y});
/** @param {number} distance @param {string} speed */
export const duration = (distance,speed) => Math.min(speed==='slow'?1400:650, Math.max(speed==='slow'?700:260, distance/(speed==='slow'?1.2:3)));
