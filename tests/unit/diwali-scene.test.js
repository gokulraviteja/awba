import test from 'node:test'
import assert from 'node:assert/strict'
import { createCourtyard } from '../../src/components/diwaliScene.js'

// Advance the real renderer with a deterministic animation clock, without a browser.
// This covers every effect branch as well as its ordering, restart, and cleanup.
for (const [id, duration] of [['flower',5.5],['chakra',5],['rocket',5],['sparkler',4.5],['peony',5.5],['comet',5],['chain',4.5],['willow',6]]) {
  test(`${id}: approach → light → retreat → fuse → effect → done; replay and dispose`, () => {
    const original = {window:globalThis.window, ResizeObserver:globalThis.ResizeObserver, requestAnimationFrame:globalThis.requestAnimationFrame, cancelAnimationFrame:globalThis.cancelAnimationFrame}
    let callback, disconnected = false, cancelled = false
    globalThis.window = {devicePixelRatio:1}
    globalThis.ResizeObserver = class { observe(){} disconnect(){disconnected=true} }
    globalThis.requestAnimationFrame = cb => {callback=cb;return 1}
    globalThis.cancelAnimationFrame = () => {cancelled=true}
    const gradient = { addColorStop(){} }
    let drawCount = 0
    const context = new Proxy({}, {get:(_,key)=>key==='createLinearGradient'||key==='createRadialGradient'?()=>gradient:()=>{drawCount++},set:()=>true})
    const canvas = {getContext:()=>context,getBoundingClientRect:()=>({width:900,height:500})}
    try {
      const phases=[]
      const scene=createCourtyard(canvas,p=>phases.push(p))
      scene.configure({sound:false,gentle:false})
      scene.play({id,color:'#edaf46',duration})
      const base=performance.now()
      for(let time=0;time<(4.1+duration+.3)*1000;time+=16.7)callback(base+time)
      assert.deepEqual(phases,['approach','light','retreat','fuse','effect','done'])
      assert.ok(drawCount>1000,'the canvas rendered throughout the sequence')
      scene.configure({sound:false,gentle:true})
      scene.play({id,color:'#edaf46',duration})
      assert.equal(phases.at(-1),'approach','replay restarts the sequence')
      const replayBase=performance.now()
      for(let time=0;time<(4.1+duration+.3)*1000;time+=16.7)callback(replayBase+time)
      assert.equal(phases.at(-1),'done','gentle mode completes')
      scene.destroy()
      assert.ok(disconnected&&cancelled,'resize and animation subscriptions are cleaned up')
    } finally {
      for(const [key,value] of Object.entries(original))if(value===undefined)delete globalThis[key];else globalThis[key]=value
    }
  })
}
