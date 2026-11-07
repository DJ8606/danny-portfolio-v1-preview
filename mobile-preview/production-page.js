const base='./assets/shiya/';

export function productionPage(){
  return `<article class="page shiya-page">
    <div class="page-topline"><a class="back-link" href="#/projects">项目目录</a><span class="eyebrow">03 / IDEA INTO OBJECT</span></div>
    <section class="shiya-hero" aria-labelledby="shiya-title">
      <div class="shiya-intro"><span class="eyebrow">DANNY × AI · ORIGINAL CHARACTER</span><h1 id="shiya-title">拾芽<span>。</span></h1><p class="shiya-en">SHIYA / THE LITTLE IDEA KEEPER</p>
        <h2>小小的想法，<br>也值得被捧在手心。</h2><p class="shiya-story">戴着一片卷叶，提着一盏种子灯。<br>拾芽喜欢收集那些一闪而过的念头，<br>等它们慢慢长成新的东西。</p>
        <button class="primary-button" type="button" data-shiya-start>转一转，认识拾芽 <span aria-hidden="true">↗</span></button>
        <a class="shiya-process-link" href="#shiya-process" data-shiya-process>看看它是怎么做出来的 ↓</a>
        <p class="shiya-note">原创概念角色 / 可编辑三维 / 尚未实物打样</p>
      </div>
      <figure class="shiya-stage"><img class="shiya-poster" src="${base}hero.webp" alt="拾芽：奶油色陶瓷身体、鼠尾草绿卷叶帽，提着琥珀色种子灯的桌面精灵" width="1100" height="1100" fetchpriority="high">
        <div class="shiya-view" hidden><canvas aria-label="拾芽三维模型，可拖动旋转，也可使用左右方向键" tabindex="0"></canvas></div>
        <span class="shiya-figure-tag">01 / 拾起一个小想法</span>
        <figcaption class="shiya-caption"><span data-shiya-status role="status">三维作品实渲染 · 点击按钮可旋转查看</span><span>SHIYA — 001</span></figcaption>
      </figure>
    </section>
    <div class="shiya-controls" hidden aria-label="三维展示控制"><button type="button" data-shiya-view="front">看正面</button><button type="button" data-shiya-view="back">看背面</button><button type="button" data-shiya-view="hero">重置视角</button><button type="button" data-shiya-still>返回作品图</button><span>拖动旋转 · 滚轮缩放 · 方向键转动</span></div>
    <section class="shiya-detail" aria-labelledby="shiya-design-title"><div class="shiya-section-head"><span class="eyebrow">A SMALL CHARACTER, WITH A STORY</span><h2 id="shiya-design-title">让一个角色，<br>从哪一面看都有故事。</h2><p>卷叶是它的轮廓，种子灯是它的任务。<br>转到背后，还能找到装着小发现的挎包。</p></div>
      <div class="shiya-studies"><figure><img src="${base}front.webp" alt="拾芽正面，宽圆脸、卷叶帽与手提种子灯构成清晰轮廓" width="850" height="850" loading="lazy"><figcaption><span>01 / 记得住的轮廓</span><p>一片偏向一侧的卷叶，让简单的圆润形体有了自己的性格。</p></figcaption></figure><figure><img src="${base}back.webp" alt="拾芽背面，叶帽拼缝与独立挎包的三维细节" width="850" height="850" loading="lazy"><figcaption><span>02 / 不只是一张正面图</span><p>叶帽、身体、挎包与灯笼分别建模，背面也保留完整的设计。</p></figcaption></figure></div>
    </section>
    <section class="shiya-process" id="shiya-process" aria-labelledby="shiya-process-title"><div class="shiya-section-head"><span class="eyebrow">FROM A THOUGHT TO SOMETHING YOU CAN TURN</span><h2 id="shiya-process-title">从一个念头，<br>到可以转过来看的作品。</h2><p>这一轮，AI 完成角色设定、三维搭建、材质灯光与网页接入。<br>设计是否打动人，留给 DANNY 和看见它的人判断。</p></div>
      <ol class="shiya-steps"><li><span>01 / 设定</span><h3>先给角色一个理由</h3><p>“收集小想法”的精灵。用卷叶、种子灯和挎包建立一套相互呼应的造型。</p></li><li><span>02 / 成形</span><h3>变成可修改的三维</h3><p>在 Blender 中搭建独立部件。保留曲面、曲线和材质，后续可以局部调整。</p></li><li><span>03 / 看见</span><h3>把作品交到屏幕前</h3><p>同一模型用于作品图和网页旋转展示，可继续用于角色提案与文创外观讨论。</p></li></ol>
      <div class="shiya-materials"><span>形体与材质</span><b><i style="--swatch:#e5d7bd"></i>奶油陶瓷</b><b><i style="--swatch:#91b6a1"></i>青瓷叶帽</b><b><i style="--swatch:#dc9d56"></i>琥珀种子灯</b><b><i style="--swatch:#a86b43"></i>皮革与黄铜</b></div>
      <p class="shiya-boundary">目前完成的是数字角色与展示资产。实物生产仍需进一步检查尺寸、结构、材料和打样效果。</p>
    </section>
    <nav class="project-next" aria-label="继续探索"><div><span class="eyebrow">MORE SIDES OF DANNY</span><a href="#/projects">看看其他作品</a></div><a class="text-link" href="#/about">认识创作者 ↗</a></nav>
  </article>`;
}

export function initProduction({signal}){
  const root=document.querySelector('.shiya-page'),start=root.querySelector('[data-shiya-start]'),status=root.querySelector('[data-shiya-status]');
  const stage=root.querySelector('.shiya-stage'),container=root.querySelector('.shiya-view'),bar=root.querySelector('.shiya-controls');
  let viewer=null,loading=false;
  root.querySelector('[data-shiya-process]').addEventListener('click',event=>{event.preventDefault();root.querySelector('#shiya-process').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});},{signal});
  start.addEventListener('click',async()=>{
    if(loading)return;
    loading=true;start.disabled=true;status.textContent='正在准备三维角色…';
    try{
      container.hidden=false;
      if(!viewer){const {mountShiya}=await import('./assets/shiya/viewer.js?v=1');if(signal.aborted)return;viewer=await mountShiya(container,signal);}
      if(signal.aborted)return;
      viewer.show(true);stage.classList.add('is-interactive');bar.hidden=false;start.textContent='三维已打开 · 拖动角色试试';status.textContent='拖动转一转，看看它的小挎包';container.querySelector('canvas').focus({preventScroll:true});if(matchMedia('(max-width:650px)').matches)stage.scrollIntoView({behavior:'instant',block:'center'});
    }catch(error){
      if(signal.aborted)return;
      viewer?.dispose();viewer=null;container.hidden=true;status.textContent='当前设备暂时无法打开三维，仍可查看下方正面与背面作品图。';start.textContent='重新尝试打开三维';console.error('SHIYA viewer:',error);
    }finally{loading=false;if(!signal.aborted)start.disabled=false;}
  },{signal});
  root.querySelectorAll('[data-shiya-view]').forEach(button=>button.addEventListener('click',()=>viewer?.view(button.dataset.shiyaView),{signal}));
  root.querySelector('[data-shiya-still]').addEventListener('click',()=>{viewer?.show(false);container.hidden=true;stage.classList.remove('is-interactive');bar.hidden=true;start.textContent='转一转，认识拾芽 ↗';status.textContent='三维作品实渲染 · 点击按钮可旋转查看';start.focus({preventScroll:true});},{signal});
  signal.addEventListener('abort',()=>viewer?.dispose(),{once:true});
}
