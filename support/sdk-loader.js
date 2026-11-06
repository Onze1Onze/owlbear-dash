export async function resolve(specifier,context,nextResolve) {
  if(specifier==='@owlbear-rodeo/sdk') return {url:new URL('./sdk-mock.js',import.meta.url).href,shortCircuit:true};
  return nextResolve(specifier,context);
}
