// Original, locally synthesized sea ambience and a small four-note theme.
// No audio is created until the visitor enables sound or starts a trip with it enabled.
export class VoyageScore {
  constructor(){this.enabled=false;this.context=null;this.timer=null;this.fadeTimer=null;this.step=0;this.destroyed=false;}
  activate(){
    if(!this.enabled||this.destroyed)return;
    try {
      if(!this.context){
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)return;
        this.context=new Audio();
        this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);
        const buffer=this.context.createBuffer(1,this.context.sampleRate*4,this.context.sampleRate),data=buffer.getChannelData(0);
        let value=0;for(let i=0;i<data.length;i++){value=(value+.028*(Math.random()*2-1))/1.028;data[i]=value*4;}
        this.sea=this.context.createBufferSource();this.sea.buffer=buffer;this.sea.loop=true;
        const filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=640;
        const seaGain=this.context.createGain();seaGain.gain.value=.15;
        this.sea.connect(filter);filter.connect(seaGain);seaGain.connect(this.master);this.sea.start();
      }
      clearTimeout(this.fadeTimer);
      this.context.resume().catch(()=>{});
      this.master.gain.setTargetAtTime(.28,this.context.currentTime,.25);
      if(!this.timer)this.timer=setInterval(()=>this.note([220,293.66,329.63,440][this.step++%4],2.2,.075),2600);
    }catch{}
  }
  note(frequency,duration=.8,volume=.12){
    if(!this.enabled||!this.context||this.context.state!=='running'||this.destroyed)return;
    const now=this.context.currentTime,osc=this.context.createOscillator(),gain=this.context.createGain();
    osc.type='sine';osc.frequency.value=frequency;osc.connect(gain);gain.connect(this.master);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.045);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.start(now);osc.stop(now+duration+.05);
  }
  arrival(index){this.activate();this.note([220,293.66,392,440][index],1.5,.14);}
  setEnabled(enabled){
    this.enabled=enabled;
    if(enabled){this.activate();return;}
    clearInterval(this.timer);this.timer=null;
    if(this.context){this.master.gain.setTargetAtTime(0,this.context.currentTime,.08);this.fadeTimer=setTimeout(()=>this.context?.suspend().catch(()=>{}),300);}
  }
  suspend(){
    clearInterval(this.timer);this.timer=null;
    this.context?.suspend().catch(()=>{});
  }
  destroy(){
    this.destroyed=true;clearInterval(this.timer);clearTimeout(this.fadeTimer);this.timer=null;
    this.context?.close().catch(()=>{});this.context=null;
  }
}
