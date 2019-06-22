import {
  IAudioContext,
  AudioContext,
  IAudioBufferSourceNode,
} from 'standardized-audio-context'

interface Node {
  source: IAudioBufferSourceNode<IAudioContext>
  name: string
  start: number
  offset: number
  isPlaying: boolean
  onTimeUpdate: (currentTime: number) => void
}

export interface AudioSource {
  buffer: ArrayBuffer
  name: string
  onTimeUpdate: (time: number) => void
  onEnded: () => void
}

export default class AudioMixer {
  public AudioContext: IAudioContext
  private reqFrame: number
  private nodes: Node[]

  public constructor() {
    this.AudioContext = new AudioContext()
    this.nodes = []
    this.reqFrame = requestAnimationFrame(this.onTimeUpdate)
    this.onTimeUpdate = this.onTimeUpdate.bind(this)
  }

  public resume(): Promise<void> {
    return this.AudioContext.resume()
  }

  public isRunning(): boolean {
    return this.AudioContext.state === 'running'
  }

  public async addSource(args: AudioSource): Promise<Node> {
    const audioBuffer = await this.AudioContext.decodeAudioData(args.buffer)
    const bufferSource = this.AudioContext.createBufferSource()

    const node: Node = {
      source: bufferSource,
      name: args.name,
      start: 0,
      offset: 0,
      isPlaying: false,
      onTimeUpdate: args.onTimeUpdate,
    }

    bufferSource.onended = (): void => {
      node.source.stop()
      node.offset = 0
      node.isPlaying = false
      args.onEnded()
    }
    bufferSource.buffer = audioBuffer
    bufferSource.connect(this.AudioContext.destination)

    this.nodes.push(node)
    return node
  }

  public async play(name: string, startPosition: number = 0): Promise<void> {
    const node = this._getNode(name)
    if (!node) {
      return
    }
    node.offset = this.AudioContext.currentTime
    node.start = startPosition
    node.source.start(0, startPosition)
    node.isPlaying = true
  }

  public stop(name: string): void {
    const node = this._getNode(name)
    if (!node) {
      return
    }
    node.source.stop()
    node.offset = 0
    node.isPlaying = false
  }

  public stopAll(): void {
    for (const node of this.nodes) {
      if (node.isPlaying) {
        node.source.stop()
        node.offset = 0
        node.isPlaying = false
      }
    }
  }

  public onTimeUpdate(): void {
    for (const node of this.nodes) {
      if (node.isPlaying) {
        const currentTime =
          this.AudioContext.currentTime - node.offset + node.start
        node.onTimeUpdate(currentTime)
      }
    }
    this.reqFrame = requestAnimationFrame(this.onTimeUpdate)
  }

  private _getNode(name: string): Node | undefined {
    return this.nodes.find((node: Node): boolean => node.name === name)
  }
}
