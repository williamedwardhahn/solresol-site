import { voiceParams } from './voice.model.js';

// The toy's voice — warm, sustained, alive.
//
// Two slightly-detuned oscillators through a soft envelope and a lowpass,
// into a shared reverb so it feels like a room, not a test tone. A note
// starts when touched and rings on until released, breathing gently. This
// is browser-only (Web Audio); the tunable "weight" lives in voice.model.

let ctx, master;

/* phones: sound only starts from a touch, and iPhones mute web audio on the
   silent switch unless the page plays as media. Unlock on every touch. */
const SILENT_WAV="data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";
let silentTag=null, primed=false;
function unlockAudio(){
  try{ if(navigator.audioSession) navigator.audioSession.type="playback"; }catch(e){}
  if(!navigator.audioSession && !silentTag && /iPhone|iPad|iPod/.test(navigator.userAgent)){
    silentTag=new Audio(SILENT_WAV); silentTag.loop=true; silentTag.volume=0.01; silentTag.setAttribute("playsinline","");
  }
  if(silentTag) silentTag.play().catch(()=>{});
  const a=audio();
  if(a.state!=="running") a.resume().catch(()=>{});
  if(!primed){ const s=a.createBufferSource(); s.buffer=a.createBuffer(1,1,22050); s.connect(a.destination); s.start(0); primed=true; }
}
["pointerdown","touchend","keydown"].forEach(ev=>window.addEventListener(ev,unlockAudio,{capture:true,passive:true}));
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible" && ctx && ctx.state!=="running") ctx.resume().catch(()=>{});
  if(document.visibilityState==="hidden" && silentTag) silentTag.pause();
});

function audio() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.85;

  // a small generated room
  const verb = ctx.createConvolver();
  verb.buffer = impulse(ctx, 1.8, 2.4);
  const wet = ctx.createGain(); wet.gain.value = 0.25;
  const dry = ctx.createGain(); dry.gain.value = 0.9;

  master.connect(dry).connect(ctx.destination);
  master.connect(verb); verb.connect(wet).connect(ctx.destination);
  return ctx;
}

function impulse(ac, seconds, decay) {
  const len = ac.sampleRate * seconds;
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

// Start a note (do–si), return a handle you stop() on release.
export function voiceOn(note) {
  const ac = audio();
  if (ac.state !== 'running') ac.resume().catch(() => {});
  const p = voiceParams(note.step);
  const t = ac.currentTime;

  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(p.gain, t + p.attack);         // soft swell, no click

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = p.cutoff + note.freq * 2;

  const o1 = ac.createOscillator(); o1.type = 'sine';     o1.frequency.value = note.freq;
  const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = note.freq; o2.detune.value = p.detune;

  // a gentle breath while held
  const lfo = ac.createOscillator(); lfo.frequency.value = 5;
  const lfoG = ac.createGain(); lfoG.gain.value = 3;
  lfo.connect(lfoG); lfoG.connect(o1.detune); lfoG.connect(o2.detune);

  o1.connect(g); o2.connect(g); g.connect(lp); lp.connect(master);
  o1.start(t); o2.start(t); lfo.start(t + 0.08);

  return {
    stop() {
      const now = ac.currentTime;
      const cur = g.gain.value;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(Math.max(0.0001, cur), now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.release);  // warm tail
      const end = now + p.release + 0.05;
      o1.stop(end); o2.stop(end); lfo.stop(end);
    },
  };
}
