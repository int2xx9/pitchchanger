import soundtouchWorklet from '@soundtouchjs/audio-worklet?url'
import { ensureAudioWorklet, type PitchChangerNode } from './pitchChangerNode'

export const createSoundtouchPitchChanger =  async (ctx: AudioContext): Promise<PitchChangerNode> => {
  await ensureAudioWorklet(ctx, soundtouchWorklet)
  const node = new AudioWorkletNode(ctx, 'soundtouch-processor')

  return {
    node,
    effect: {
      setPitch: (pitch: number) => {
        node.parameters.get('pitchSemitones')?.setValueAtTime(pitch, ctx.currentTime)
      }
    }
  }
}
