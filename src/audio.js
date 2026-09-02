export class Sound {
  constructor(enabled=true){this.enabled=enabled;this.context=null;}
  async start(){
    if(!this.enabled)return;
    try{
      if(!this.context){
        this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=.16;this.master.connect(this.context.destination);
        const buffer=this.context.createBuffer(1,this.context.sampleRate*3,this.context.sampleRate),data=buffer.getChannelData(0);
        for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.13;
        const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;
        const filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=420;
        source.connect(filter).connect(this.master);source.start();
      }
      if(this.context.state==='suspended')await this.context.resume();
    }catch{/* A browser without audio can still play the entire game. */}
  }
  setEnabled(enabled){this.enabled=enabled;if(this.master)this.master.gain.setTargetAtTime(enabled?.16:0,this.context.currentTime,.12);if(enabled)this.start();}
  play(kind='mine',crystal=false){
    if(!this.enabled||this.context?.state!=='running')return;
    const t=this.context.currentTime,osc=this.context.createOscillator(),gain=this.context.createGain();
    osc.type=crystal?'sine':kind==='build'?'triangle':'sine';
    const freq=crystal?660:kind==='build'?260:kind==='teleport'?440:120;
    osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(freq*(crystal?1.5:.5),t+.14);
    gain.gain.setValueAtTime(.3,t);gain.gain.exponentialRampToValueAtTime(.001,t+(crystal?.45:.15));
    osc.connect(gain).connect(this.master);osc.start(t);osc.stop(t+.5);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
}
