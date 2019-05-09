import {
  IAudioContext,
  AudioContext,
  IAudioBufferSourceNode,
} from 'standardized-audio-context'

interface INode {
  source: IAudioBufferSourceNode
  name: string
  start: number
  offset: number
  isPlaying: boolean
  onTimeUpdate: (currentTime: number) => void
}

export interface ISource {
  buffer: ArrayBuffer
  name: string
  onTimeUpdate: (time: number) => void
  onEnded: () => void
}

export default class AudioMixer {
  AudioContext: IAudioContext
  reqFrame: number
  nodes: INode[]

  constructor() {
    this.AudioContext = new AudioContext()
    this.nodes = []
    this.reqFrame = requestAnimationFrame(this.onTimeUpdate)
    this.onTimeUpdate = this.onTimeUpdate.bind(this)
  }

  resume() {
    return this.AudioContext.resume()
  }

  isRunning() {
    return this.AudioContext.state === 'running'
  }

  async addSource(args: ISource) {
    const audioBuffer = await this.AudioContext.decodeAudioData(args.buffer)
    const bufferSource = this.AudioContext.createBufferSource()

    const node: INode = {
      source: bufferSource,
      name: args.name,
      start: 0,
      offset: 0,
      isPlaying: false,
      onTimeUpdate: args.onTimeUpdate,
    }

    bufferSource.onended = () => {
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

  async play(name: string, startPosition: number = 0) {
    const node = this._getNode(name)
    if (!node) {
      return
    }
    node.offset = this.AudioContext.currentTime
    node.start = startPosition
    node.source.start(0, startPosition)
    node.isPlaying = true
  }

  stop(name: string) {
    const node = this._getNode(name)
    if (!node) {
      return
    }
    node.source.stop()
    node.offset = 0
    node.isPlaying = false
  }

  stopAll() {
    for (const node of this.nodes) {
      if (node.isPlaying) {
        node.source.stop()
        node.offset = 0
        node.isPlaying = false
      }
    }
  }

  onTimeUpdate() {
    for (const node of this.nodes) {
      if (node.isPlaying) {
        const currentTime =
          this.AudioContext.currentTime - node.offset + node.start
        node.onTimeUpdate(currentTime)
      }
    }
    this.reqFrame = requestAnimationFrame(this.onTimeUpdate)
  }

  _getNode(name: string) {
    return this.nodes.find((node: INode) => node.name === name)
  }
}
