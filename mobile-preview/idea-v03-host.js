// Mount the approved V03 document in the same isolated host pattern as LAB.
export function productionPage(){
  return `<section class="idea-host" aria-label="DANNY 想法到实物">
    <div class="idea-host-bar"><span>DANNY / 想法到实物</span><a href="#/projects">← 返回项目目录</a></div>
    <iframe id="idea-v03-frame" src="./idea-v03/index.html?v=20261030-phone3" title="DANNY 想法到实物 · V03"></iframe>
  </section>`;
}

export function initProduction({signal}){
  const frame=document.getElementById('idea-v03-frame');
  signal.addEventListener('abort',()=>frame?.remove(),{once:true});
}
