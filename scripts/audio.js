/* ============================================================
   Trivia Quest — procedural sound (WebAudio, no asset files)
   Lazily starts on first user gesture to satisfy autoplay rules.
   ============================================================ */
window.Sfx = (function(){
  let ctx = null, master = null, musicGain = null, musicTimer = null;
  let enabled = true, musicOn = false;

  function ensure(){
    if(ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
  }
  function now(){ return ctx.currentTime; }

  function tone(freq, t0, dur, type, peak){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak || 0.3, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(t0, dur, peak, hp){
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0;i<n;i++) data[i] = (Math.random()*2-1) * (1 - i/n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = peak || 0.2;
    const f = ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value = hp || 600;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }

  const api = {
    unlock(){ ensure(); if(ctx && ctx.state === 'suspended') ctx.resume(); },
    setEnabled(v){ enabled = v; },
    click(){ if(!enabled) return; ensure(); if(!ctx) return; tone(420,now(),0.09,'triangle',0.25); },
    hover(){ if(!enabled) return; ensure(); if(!ctx) return; tone(640,now(),0.05,'sine',0.10); },
    select(){ if(!enabled) return; ensure(); if(!ctx) return; const t=now(); tone(523,t,0.08,'triangle',0.22); tone(784,t+0.06,0.10,'triangle',0.20); },
    correct(){ if(!enabled) return; ensure(); if(!ctx) return; const t=now();
      [659,784,988,1319].forEach((f,i)=>tone(f,t+i*0.085,0.18,'triangle',0.24)); },
    wrong(){ if(!enabled) return; ensure(); if(!ctx) return; const t=now();
      tone(196,t,0.22,'sawtooth',0.18); tone(146,t+0.10,0.28,'sawtooth',0.16); },
    tick(){ if(!enabled) return; ensure(); if(!ctx) return; tone(880,now(),0.03,'square',0.06); },
    timeout(){ if(!enabled) return; ensure(); if(!ctx) return; const t=now();
      tone(330,t,0.18,'sawtooth',0.16); tone(247,t+0.12,0.26,'sawtooth',0.16); },
    whoosh(){ if(!enabled) return; ensure(); if(!ctx) return; noise(now(),0.28,0.10,400); },
    start(){ if(!enabled) return; ensure(); if(!ctx) return; const t=now();
      [392,523,659,784].forEach((f,i)=>tone(f,t+i*0.07,0.16,'triangle',0.22)); },
    fanfare(){ if(!enabled) return; ensure(); if(!ctx) return; const t=now();
      [523,659,784,1047,1319].forEach((f,i)=>tone(f,t+i*0.11,0.32,'triangle',0.26));
      [262,330,392].forEach((f,i)=>tone(f,t+i*0.11,0.5,'sine',0.14)); },

    // gentle ambient arpeggio loop
    setMusic(on){
      musicOn = on; ensure(); if(!ctx) return;
      if(on){
        musicGain.gain.cancelScheduledValues(now());
        musicGain.gain.linearRampToValueAtTime(0.10, now()+1.2);
        if(!musicTimer) scheduleMusic();
      } else {
        musicGain.gain.linearRampToValueAtTime(0.0, now()+0.6);
        if(musicTimer){ clearInterval(musicTimer); musicTimer = null; }
      }
    }
  };

  function scheduleMusic(){
    const scale = [261.63,293.66,329.63,392.00,440.00,523.25,587.33,659.25];
    let step = 0;
    const play = ()=>{
      if(!musicOn || !ctx) return;
      const t = now();
      const f = scale[(step*3) % scale.length];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type='triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(0.5,t+0.05);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.6);
      o.connect(g); g.connect(musicGain); o.start(t); o.stop(t+0.7);
      if(step % 4 === 0){ // soft bass
        const b = ctx.createOscillator(), bg = ctx.createGain();
        b.type='sine'; b.frequency.value = scale[0]/2;
        bg.gain.setValueAtTime(0.0001,t); bg.gain.exponentialRampToValueAtTime(0.4,t+0.08);
        bg.gain.exponentialRampToValueAtTime(0.0001,t+1.0);
        b.connect(bg); bg.connect(musicGain); b.start(t); b.stop(t+1.1);
      }
      step++;
    };
    play();
    musicTimer = setInterval(play, 420);
  }

  return api;
})();
