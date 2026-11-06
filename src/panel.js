import OBR from '@owlbear-rodeo/sdk';
import { ID, TOOL, MODE, normalize } from './core.js';
const enabled = /** @type {HTMLInputElement} */ (document.querySelector('#enabled'));
const effects = /** @type {HTMLInputElement} */ (document.querySelector('#effects'));
const speed = /** @type {HTMLSelectElement} */ (document.querySelector('#speed'));
const button = /** @type {HTMLButtonElement} */ (document.querySelector('#activate'));
const status = /** @type {HTMLElement} */ (document.querySelector('#status'));
/** @param {unknown} raw */
function render(raw) { const s=normalize(raw); enabled.checked=s.enabled; effects.checked=s.effects; speed.value=s.speed; button.disabled=!s.enabled; }
OBR.onReady(async () => {
  try {
    render((await OBR.player.getMetadata())[ID]);
    status.textContent='Pronto. Abra uma cena para usar o Dash.';
    OBR.player.onChange(p => render(p.metadata[ID]));
    for (const control of [enabled,effects,speed]) control.addEventListener('change',async () => {
      try { await OBR.player.setMetadata({[ID]:{enabled:enabled.checked,effects:effects.checked,speed:speed.value}}); status.textContent='Preferências salvas.'; }
      catch { status.textContent='Falha ao salvar. Tente novamente.'; }
    });
    button.addEventListener('click',async () => {
      try {
        if (!await OBR.scene.isReady()) {status.textContent='Abra uma cena primeiro.'; return;}
        await OBR.tool.activateMode(TOOL,MODE);
        status.textContent='Ferramenta selecionada. Arraste um personagem no mapa.';
      } catch {status.textContent='A ferramenta ainda não está pronta. Reabra o painel.';}
    });
  } catch {status.textContent='Não foi possível conectar. Recarregue a sala.';}
});
