import { useEffect, useRef, useState } from 'react'
import './App.css'

import soundtouchWorklet from '@soundtouchjs/audio-worklet?url'

type PitchChanger = {
  setPitch: (pitch: number) => void
}

const CreatePitchChanger =  async (): Promise<PitchChanger> => {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: {
      // prevent original audio playback
      suppressLocalAudioPlayback: true,
      // these constraints may affect the audio quality so disable them
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    } as MediaTrackConstraints,
    video: true,
  })

  const ctx = new AudioContext()
  await ctx.audioWorklet.addModule(soundtouchWorklet)
  const source = ctx.createMediaStreamSource(stream)
  const soundtouchNode = new AudioWorkletNode(ctx, 'soundtouch-processor')
  source.connect(soundtouchNode).connect(ctx.destination)

  return {
    setPitch: (pitch: number) => {
      soundtouchNode.parameters.get('pitchSemitones')?.setValueAtTime(pitch, ctx.currentTime)
    }
  }
}

type PitchSelectorProps = {
  value: number
  onChange: (value: number) => void
}

const PitchSelector = (props: PitchSelectorProps) => {
  const generateNumbers = (start: number, end: number) => {
    return Array(end-start+1).fill(0).map((_, i) => start + i)
  }
  return <>
    <div className="pitch-selector">
      <button onClick={() => props.onChange(0)} style={{ gridColumn: 'span 12' }} disabled={props.value === 0} className={props.value === 0 ? 'active' : ''}>0</button>
      {generateNumbers(1, 12).map((value) => (
        <button key={value} onClick={() => props.onChange(value)} disabled={props.value === value} className={props.value === value ? 'active' : ''}>
          +{value}
        </button>
      ))}
      {generateNumbers(1, 12).map((value) => (
        <button key={`-${value}`} onClick={() => props.onChange(-value)} disabled={props.value === -value} className={props.value === -value ? 'active' : ''}>
          -{value}
        </button>
      ))}
      <button onClick={() => props.onChange(props.value - 12)} style={{ gridColumn: 'span 6' }} disabled={props.value < 0}>-12</button>
      <button onClick={() => props.onChange(props.value + 12)} style={{ gridColumn: 'span 6' }} disabled={props.value > 0}>+12</button>
    </div>
  </>
}

function App() {
  const pitchChanger = useRef<PitchChanger | null>(null)

  const selectTab = async () => {
    pitchChanger.current = await CreatePitchChanger()
    pitchChanger.current?.setPitch(pitch)
  }

  const [pitch, setPitch] = useState(0)

  useEffect(() => {
    pitchChanger.current?.setPitch(pitch)
  }, [pitch])

  const [arrowKeyEnabled, setArrowKeyEnabled] = useState(true)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!arrowKeyEnabled) return

      if (e.key === 'ArrowUp') {
        setPitch(p => Math.min(p + 1, 12))
      }
      if (e.key === 'ArrowDown') {
        setPitch(p => Math.max(p - 1, -12))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [arrowKeyEnabled])

  return (
    <>
      <button onClick={selectTab}>タブを選択</button><br />
      <hr/>
      <PitchSelector value={pitch} onChange={setPitch} /><br />
      <label>
        <input type="checkbox" checked={arrowKeyEnabled} onChange={(e) => setArrowKeyEnabled(e.target.checked)} />
        矢印キー(↑↓)で音程変更
      </label>
      <div style={{ marginTop: '1em', fontSize: '0.9em', color: '#888' }}>
        <a href="https://github.com/int2xx9/pitchchanger/wiki/Usage">使用方法</a>&nbsp;|&nbsp;<a href="https://github.com/int2xx9/pitchchanger">ソースコード</a>
      </div>
    </>
  )
}

export default App
