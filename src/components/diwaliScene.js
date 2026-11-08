// A self-contained, responsive canvas scene. No assets or network calls are needed.
const TAU = Math.PI * 2
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n))
const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
const palette = ['#ffd98b', '#ffbc71', '#efa2ad', '#b7a0ef', '#8dd8c4', '#fff0b5']

export function createCourtyard(canvas, onPhase) {
  const ctx = canvas.getContext('2d')
  let width = 1000, height = 570, raf, previous = 0, start = null, selected = null
  let phase = 'idle', sound = false, gentle = false, audio = null, particles = [], emitted = new Set(), disposed = false
  let emissionDebt = 0, effectSound = -1
  const stars = Array.from({ length: 90 }, (_, i) => ({ x: ((i * 137.5) % 1000), y: ((i * 73.7) % 400), r: .6 + (i % 3) * .45 }))
  function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill() }
  function line(x, y, x2, y2, color, size = 1) { ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke() }
  function rect(x, y, w, h, color, radius = 0) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill() }
  function glow(x, y, r, color) { const g = ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');circle(x,y,r,g) }
  function phaseTo(next) { if (phase !== next) { phase = next; onPhase(next) } }
  function resize() {
    const bounds = canvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(bounds.width * dpr); canvas.height = Math.round(bounds.height * dpr)
    width = 1000; height = 1000 * bounds.height / bounds.width
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0)
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize()
  function tone(kind = 'spark') {
    if (!sound || !audio || audio.state !== 'running') return
    const n = audio.currentTime
    const gain = audio.createGain();gain.connect(audio.destination)
    const duration = kind === 'burst' ? .7 : .13
    const length = Math.ceil(audio.sampleRate * duration), buffer = audio.createBuffer(1, length, audio.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i=0;i<length;i++) data[i]=(Math.random()*2-1)*(1-i/length)
    const source = audio.createBufferSource();source.buffer=buffer
    const filter=audio.createBiquadFilter();filter.type=kind==='burst'?'lowpass':'highpass';filter.frequency.value=kind==='burst'?450:2500
    source.connect(filter);filter.connect(gain);gain.gain.setValueAtTime(kind==='burst'?.18:.035,n);gain.gain.exponentialRampToValueAtTime(.001,n+duration)
    source.start();source.stop(n+duration)
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()}
  }
  function diya(x, y, scale, time) {
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale)
    glow(0,-9,37,'#ffc76a1e')
    ctx.fillStyle='#bb7751';ctx.beginPath();ctx.ellipse(0,0,10,4,0,0,Math.PI);ctx.fill()
    ctx.fillStyle='#f1b86c';ctx.beginPath();ctx.ellipse(0,-1,10,2.8,0,0,TAU);ctx.fill()
    const flicker=gentle?0:Math.sin(time*3+x)*1.2
    ctx.fillStyle='#ffd184';ctx.beginPath();ctx.moveTo(0,-18-flicker);ctx.bezierCurveTo(-8,-8,-3,-3,0,-3);ctx.bezierCurveTo(7,-3,6,-10,0,-18-flicker);ctx.fill()
    circle(0,-7,2,'#fff4bd');ctx.restore()
  }
  function skyline(time) {
    const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#211d37');sky.addColorStop(.62,'#453047');sky.addColorStop(1,'#81504e');rect(0,0,width,height,sky)
    glow(765,height*.23,145,'#ad729017')
    stars.forEach((s,i)=>{const alpha=(gentle?.55:.35+.3*Math.sin(time*.5+i));ctx.globalAlpha=alpha;circle(s.x,s.y*height/650,s.r,'#f6dcba')});ctx.globalAlpha=1
    circle(858,height*.19,21,'#ead3a4');circle(849,height*.18,21,'#272139');glow(857,height*.19,60,'#ffe3a009')
    const horizon=height*.67
    // Distant terraces, rooftop pavilions, domes, and tiny lit windows.
    for(let layer=0;layer<2;layer++){
      const colors=layer?['#513d4f','#59404e','#60434f']:['#352b43','#3b2e46','#403048']
      for(let i=0;i<15;i++){
        const x=i*81-40+layer*18, w=65+(i%3)*10, roof=horizon-35-layer*4-(Math.sin(i*5.2)*.5+.5)*(layer?60:100)
        rect(x,roof,w,height*.79-roof,colors[i%3]);rect(x-3,roof, w+6,5,layer?'#795461':'#503c52')
        if(i%4===0){ctx.fillStyle=colors[i%3];ctx.beginPath();ctx.arc(x+w/2,roof-9,w*.3,Math.PI,0);ctx.fill();rect(x+w*.2,roof-9,w*.6,12,colors[i%3]);line(x+w/2,roof-w*.3-9,x+w/2,roof-w*.3-19,'#866174',1.5)}
        for(let j=0;j<3;j++){const wx=x+11+j*19, wy=roof+18+(i%2)*10;rect(wx,wy,6,10,(i+j)%3?'#d6a27375':'#d6a27325',3);if((i+j)%3)glow(wx+3,wy+4,15,'#ffd18b08')}
        if(layer){ctx.strokeStyle='#b47d6966';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,roof+5);ctx.quadraticCurveTo(x+w/2,roof+27,x+w,roof+5);ctx.stroke();for(let j=0;j<6;j++){let xx=x+j*w/5;circle(xx,roof+7+Math.sin(j/5*Math.PI)*9,1.5,'#ecc287')}}
      }
    }
    // A string of marigolds across the upper corners.
    ctx.strokeStyle='#b3896566';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-10,65);ctx.quadraticCurveTo(160,141,330,21);ctx.stroke();ctx.beginPath();ctx.moveTo(730,20);ctx.quadraticCurveTo(900,123,1020,60);ctx.stroke()
    for(let i=0;i<16;i++){const t=i/15,x=-10+340*t,y=(1-t)**2*65+2*(1-t)*t*141+t*t*21;circle(x,y,4,i%2?'#d49b51':'#b77445');if(i%3===0)diya(x,y+12,.5,time)}
    for(let i=0;i<12;i++){const t=i/11,x=730+290*t,y=(1-t)**2*20+2*(1-t)*t*123+t*t*60;circle(x,y,4,i%2?'#d49b51':'#b77445')}
    const wall=height*.715, ground=height*.82
    rect(0,wall,1000,ground-wall,'#6e4a52');rect(0,wall,1000,8,'#ae7769');rect(0,wall+8,1000,4,'#4b3545');rect(0,wall+25,1000,3,'#865a60')
    for(let i=0;i<18;i++){const x=i*61-10;rect(x,wall+37,34,ground-wall-42,'#5a3d4d',13);rect(x+4,wall+41,26,ground-wall-47,'#81545b',11)}
    const floor=ctx.createLinearGradient(0,ground,0,height);floor.addColorStop(0,'#72505b');floor.addColorStop(1,'#9b6a6a');rect(0,ground,1000,height-ground,floor);line(0,ground,1000,ground,'#d0937770',2)
    for(let i=-8;i<15;i++)line(500+i*24,ground,500+i*120,height,'#deb29814')
    for(let i=1;i<5;i++){const y=ground+(height-ground)*(i/5)**1.8;line(0,y,1000,y,'#deb29816')}
    for(let i=0;i<10;i++)diya(40+i*104,wall-1,.8,time)
    // Hand-drawn rangoli, off to one side of the watching spot.
    ctx.save();ctx.translate(320,ground+65);ctx.scale(1,.36);ctx.globalAlpha=.48
    for(let i=0;i<12;i++){ctx.save();ctx.rotate(i*TAU/12);ctx.strokeStyle=i%2?'#e5b87e':'#e6b1b1';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(28,0,20,8,0,0,TAU);ctx.stroke();ctx.restore()}
    ctx.strokeStyle='#efcc9e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,14,0,TAU);ctx.stroke();ctx.restore()
    diya(78,height-31,1.55,time);diya(921,height-31,1.55,time)
    // Little unlit gift boxes on the roof.
    rect(108,ground-25,35,25,'#9e5b64',2);line(125,ground-25,125,ground,'#d9ad7a',4);rect(136,ground-16,24,16,'#b58b62',2);line(147,ground-16,147,ground,'#e9c9a0',3)
  }
  function kid(x, ground, time, moving, crouch, facing, celebrate) {
    ctx.save();ctx.translate(x,ground);ctx.scale(facing,1)
    const gait=moving?Math.sin(time*19):0, bob=moving&&!gentle?Math.abs(gait)*3:0
    ctx.translate(0,-bob);ctx.fillStyle='#271e363b';ctx.beginPath();ctx.ellipse(0,2,25,6,0,0,TAU);ctx.fill()
    const bend=crouch?14:0
    // Legs and embroidered slippers.
    line(-9,-35,-10+gait*12,-7,'#663d62',11);line(9,-35,10-gait*12,-7,'#663d62',11)
    line(-10+gait*12,-5,-3+gait*12,-5,'#e0b27a',7);line(10-gait*12,-5,17-gait*12,-5,'#e0b27a',7)
    ctx.save();ctx.translate(crouch?8:0,bend);ctx.rotate(crouch?.3:0)
    ctx.fillStyle='#5ea89b';ctx.beginPath();ctx.moveTo(-15,-78);ctx.quadraticCurveTo(0,-87,15,-78);ctx.lineTo(20,-31);ctx.quadraticCurveTo(0,-24,-20,-31);ctx.closePath();ctx.fill()
    line(-17,-36,17,-36,'#cfbd82',2);line(0,-78,0,-54,'#dbce99',1.5);[0,1,2].forEach(i=>circle(3,-72+i*8,1.5,'#f1d59d'))
    let handX=crouch?45:celebrate?26:20+gait*12, handY=crouch?-55:celebrate?-99:-49
    line(13,-73,handX,handY,'#72b5a4',10);circle(handX+2,handY+2,5,'#dfa277')
    line(-13,-73,-20-gait*10,-48,'#5fa699',10);circle(-20-gait*10,-45,5,'#dfa277')
    if(crouch){line(handX+3,handY+1,handX+26,handY-2,'#cba97a',2);glow(handX+26,handY-2,15,'#ffd69755');circle(handX+26,handY-2,2,'#ffe0a2')}
    rect(-6,-91,12,16,'#cb8d66',4);circle(0,-102,20,'#e4ab80');circle(18,-101,4,'#dfa277')
    ctx.fillStyle='#302639';ctx.beginPath();ctx.moveTo(-20,-101);ctx.bezierCurveTo(-26,-132,17,-133,20,-108);ctx.lineTo(9,-114);ctx.lineTo(-1,-110);ctx.lineTo(-9,-114);ctx.lineTo(-15,-99);ctx.fill()
    circle(8,-102,1.6,'#48343b');line(12,-98,14,-96,'#bb7b5e',1.5);ctx.strokeStyle='#8a4d46';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(7,-94,4,.15,2);ctx.stroke();circle(12,-95,3,'#ee998466')
    ctx.restore();ctx.restore()
  }
  function cracker(x,y,time,lit,active) {
    if(!selected){selected={id:'flower',color:'#edaf46',duration:5.5}}
    ctx.save();ctx.translate(x,y)
    ctx.fillStyle='#2d243640';ctx.beginPath();ctx.ellipse(0,3,25,5,0,0,TAU);ctx.fill()
    if(selected.id==='flower') {ctx.fillStyle='#b4814c';ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(-4,-33);ctx.lineTo(4,-33);ctx.lineTo(16,0);ctx.fill();line(-10,-11,11,-16,'#f0c785',3);line(-6,-23,6,-26,'#e2b47a',2)}
    else if(selected.id==='chakra'){ctx.fillStyle='#d29265';ctx.beginPath();ctx.ellipse(0,-2,17,5,active?time*10:0,0,TAU);ctx.fill();circle(0,-3,3,'#f5cd89')}
    else if(['rocket','comet'].includes(selected.id)){if(!active){line(0,0,0,-48,'#c5a376',2);rect(-7,-44,14,26,selected.color,1);ctx.fillStyle='#efc27f';ctx.beginPath();ctx.moveTo(-9,-44);ctx.lineTo(0,-57);ctx.lineTo(9,-44);ctx.fill();line(-6,-38,6,-33,'#f0d5ae',3)}}
    else if(selected.id==='sparkler'){line(-10,0,7,-40,'#c9c5b5',2.5);line(1,-25,7,-40,'#dfb979',3)}
    else if(selected.id==='chain'){for(let i=0;i<8;i++)rect(-28+i*8,-7+Math.sin(i)*3,6,8,'#cf6977',1)}
    else {rect(-13,-21,26,21,selected.color,2);line(-9,-12,9,-12,'#efd39b',3)}
    if(lit&&!active){const fy=['rocket','comet'].includes(selected.id)?-22:selected.id==='flower'?-34:-23;line(0,fy,7,fy-7,'#b69a72',1.5);glow(7,fy-7,26,'#ffd49445');circle(7,fy-7,2,'#ffe0a1');for(let i=0;i<4;i++){const a=time*7+i*1.7;circle(7+Math.cos(a)*9,fy-7+Math.sin(a)*9,1,'#ffcf8a')}}
    ctx.restore()
  }
  function spawn(x,y,vx,vy,color,life=1.5,size=2,gravity=85){if(particles.length>1600)return;particles.push({x,y,px:x,py:y,vx,vy,color,life,max:life,size,gravity})}
  function burst(x,y,color,count=100,speed=135,willow=false){
    tone('burst');for(let i=0;i<count;i++){const a=i/count*TAU, v=speed*(.55+Math.random()*.45);spawn(x,y,Math.cos(a)*v,Math.sin(a)*v,color==='multi'?palette[i%6]:color,willow?3.2:1.6+Math.random()*.7,1.4+Math.random(),willow?45:60)}
  }
  function once(key,condition,fn){if(condition&&!emitted.has(key)){emitted.add(key);fn()}}
  function effect(t,dt,ground){
    const x=650, rate=gentle?.4:1, id=selected.id, end=selected.duration
    emissionDebt+=dt*60;const frames=Math.min(4,Math.floor(emissionDebt));emissionDebt-=frames
    if(t<end-1.2){
      if(id==='flower')for(let j=0;j<frames*7*rate;j++){const vx=(Math.random()-.5)*145,vy=-160-Math.random()*240;spawn(x,ground-32,vx,vy,Math.random()>.2?'#ffcf80':'#fff1be',1+Math.random(),Math.random()*1.5+1,200);glow(x,ground-25,60,'#fcb55f17')}
      if(id==='chakra')for(let j=0;j<frames*5*rate;j++){const a=t*20+j*.4;spawn(x,ground-4,Math.cos(a)*230,-20-Math.random()*60,'#ffce75',.6+Math.random()*.5,1.7,150);line(x-12,ground-4,x+12,ground-4,'#f5c57b',3)}
      if(id==='sparkler')for(let j=0;j<frames*4*rate;j++){const a=Math.random()*TAU;spawn(x+7,ground-40,Math.cos(a)*80,Math.sin(a)*80,'#ffe4a1',.3+Math.random()*.6,1.7,60);glow(x+7,ground-40,35,'#ffe2a022')}
      if(id==='chain')for(let i=0;i<8;i++)once('pop'+i,t>i*.32,()=>{burst(x-28+i*8,ground-5,'#ffd499',gentle?12:26,75);})
    }
    if(['rocket','comet','peony','willow'].includes(id)){
      const flight=1.25, launchY=ground-35, targetY=height*.36, targetX=id==='comet'?800:660
      if(t<flight){const p=t/flight,rx=x+(targetX-x)*p,ry=launchY+(targetY-launchY)*p;glow(rx,ry,24,'#ffd39436');circle(rx,ry,3,'#ffdc8f');for(let i=0;i<frames*3*rate;i++)spawn(rx,ry,(Math.random()-.5)*23,30+Math.random()*50,'#ffce83',.7,1.7,30)}
      once('main',t>=flight,()=>burst(targetX,targetY,id==='peony'?'multi':'#ffd28b',gentle?70:id==='willow'?180:130,id==='willow'?130:140,id==='willow'))
      if(id==='peony'){once('second',t>2.1,()=>burst(420,height*.43,'#bd9ce9',gentle?40:95,110));once('third',t>2.8,()=>burst(790,height*.47,'#8edac3',gentle?40:95,100))}
      if(id==='comet'&&t>=flight&&t<2.6)for(let j=0;j<frames*3*rate;j++)spawn(targetX+(t-flight)*25,targetY+(t-flight)*12,-50-Math.random()*70,Math.random()*40,'#ffcb76',1.4,2,40)
    }
    const beat=Math.floor(t*8)
    if(['flower','sparkler','chakra'].includes(id)&&beat!==effectSound&&t<end-1.3){effectSound=beat;tone()}
  }
  function frame(now){
    if(disposed)return
    const dt=Math.min((now-previous)/1000||.016,.04);previous=now
    const time=now/1000, elapsed=start===null?0:(now-start)/1000, ground=height*.82-3
    skyline(time)
    let x=208,moving=false,crouch=false,facing=1,celebrate=false
    if(start!==null){
      if(elapsed<1.6){phaseTo('approach');x=208+(588-208)*ease(elapsed/1.6);moving=true}
      else if(elapsed<2.4){phaseTo('light');x=588;crouch=true}
      else if(elapsed<3.7){phaseTo('retreat');x=588-(588-208)*ease((elapsed-2.4)/1.3);moving=true;facing=-1}
      else if(elapsed<4.1){phaseTo('fuse')}
      else if(elapsed<4.1+selected.duration){phaseTo('effect');celebrate=true}
      else {phaseTo('done');celebrate=true;start=null}
    }
    cracker(650,ground,time,start!==null&&elapsed>=2.1,phase==='effect'||phase==='done')
    kid(x,ground,time,moving,crouch,facing,celebrate||phase==='done')
    if(phase==='effect')effect(elapsed-4.1,dt,ground)
    ctx.save();ctx.globalCompositeOperation='lighter'
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){particles.splice(i,1);continue}p.px=p.x;p.py=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;p.vx*=1-dt*.2;ctx.globalAlpha=clamp(p.life/p.max);line(p.px,p.py,p.x,p.y,p.color,p.size);circle(p.x,p.y,p.size*.65,p.color)}
    ctx.restore()
    if(phase==='idle'){ctx.save();ctx.globalAlpha=.18;for(let i=0;i<14;i++){const a=i*TAU/14;line(728+Math.cos(a)*45,height*.42+Math.sin(a)*45,728+Math.cos(a)*58,height*.42+Math.sin(a)*58,'#d9ad80',1)}ctx.restore()}
    raf=requestAnimationFrame(frame)
  }
  raf=requestAnimationFrame(frame)
  return {
    configure(settings){sound=settings.sound;gentle=settings.gentle;if(!sound&&audio?.state==='running')audio.suspend();if(sound&&audio?.state==='suspended')audio.resume().catch(()=>{})},
    play(cracker){if(disposed)return;selected=cracker;particles=[];emitted.clear();emissionDebt=0;effectSound=-1;start=performance.now();phaseTo('approach');if(sound){try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){audio??=new Audio();audio.resume().catch(()=>{})}}catch{/* Sound is optional on browsers without Web Audio. */}}},
    destroy(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();particles=[];if(audio)audio.close().catch(()=>{})},
  }
}
