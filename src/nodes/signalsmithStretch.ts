import SignalsmithStretch from 'signalsmith-stretch'
import { type PitchChangerNode } from './pitchChangerNode'
  
export const createSignalsmithStretchPitchChanger =  async (ctx: AudioContext): Promise<PitchChangerNode> => {
  const node = await SignalsmithStretch(ctx)
  node.start()

  return {
    node,
    effect: {
      setPitch: (pitch: number) => {
        node.schedule({
          semitones: pitch,
        })
      }
    }
  }
}
