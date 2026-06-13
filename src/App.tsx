import { useEffect, useRef, useState } from 'react'
import './App.css'

import { createSignalsmithStretchPitchChanger } from './nodes'
import { SpotlightProvider, SpotlightTour, useSpotlight } from 'react-tourlight'

import 'react-tourlight/styles.css'

const OnboardingStatus = {
  isCompleted: localStorage.getItem('onboardingCompleted') !== null,
  markCompleted: () => localStorage.setItem('onboardingCompleted', new Date().getTime().toString()),
}

const EnvironmentWarning = () => {
  const isChromium = /Chrome/i.test(navigator.userAgent)
  if (isChromium) {
    return null
  }

  const isPC = /Windows|Macintosh|Linux/i.test(navigator.userAgent)
  if (!isPC) {
    return null
  }

  return <div className="environment-warning">
    ⚠️あなたの環境ではこのアプリは正しく動作しない可能性があります。<br/>
    推奨環境はmacOSまたはWindows上のGoogle Chromeです。
    </div>
}

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
  const node = await createSignalsmithStretchPitchChanger(ctx)

  const source = ctx.createMediaStreamSource(stream)
  source.connect(node.node).connect(ctx.destination)

  return {
    setPitch: (pitch: number) => {
      node.effect.setPitch(pitch)
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
    <div className="pitch-selector" data-tour="onboarding-step-2">
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

const App = () => {
  const spotlight = useSpotlight()

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

  useEffect(() => {
    if (!OnboardingStatus.isCompleted) {
      spotlight.start('onboarding')
    }
  }, [])

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
        <button
          className="open-onboarding-button"
          type="button"
          onClick={() => spotlight.start('onboarding')}
          aria-label="使い方を表示"
          title="使い方を表示">
          ?
        </button>
      </div>

      <button data-tour="onboarding-step-1" onClick={selectTab}>タブを選択</button><br />
      <EnvironmentWarning />
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

function SpotlightedApp() {
  return <SpotlightProvider>
    <SpotlightTour
      id="onboarding"
      onComplete={() => OnboardingStatus.markCompleted()}
      onSkip={() => OnboardingStatus.markCompleted()}
      steps={[
        {
          target: '[data-tour="onboarding-step-1"]',
          title: '1. タブを選択する',
          content: '音程を変更したい動画を別のタブで開いた後、このボタンをクリックして動画を再生しているタブを選択してください。',
          placement: 'auto',
        },
        {
          target: '[data-tour="onboarding-step-2"]',
          title: '2. 音程を変更する',
          content: '選択した数字に応じて音程が変化します。',
          placement: 'auto',
        }
      ]}
    />
    <App />
  </SpotlightProvider>
}

export default SpotlightedApp
