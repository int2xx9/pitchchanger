export type PitchChangerNode = {
  node: AudioNode
  effect: {
    setPitch: (pitch: number) => void
  }
}

const loadedAudioWorklets = new WeakMap<AudioContext, Set<string>>()

export const ensureAudioWorklet = async (ctx: AudioContext, url: string) => {
  let loadedWorklets = loadedAudioWorklets.get(ctx)
  if (!loadedWorklets) {
    loadedWorklets = new Set()
    loadedAudioWorklets.set(ctx, loadedWorklets)
  }

  if (!loadedWorklets.has(url)) {
    await ctx.audioWorklet.addModule(url)
    loadedWorklets.add(url)
  }
}
