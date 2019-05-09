import { useEffect, useState, useRef } from 'react'
import load from 'load-asset'

import AudioMixer from './mixer'
import { Timeline, ITimelineEvent } from './timeline'

export function timeoutThen(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

interface IAsset {
  [key: string]: string
}

export function usePrefetch(assets: IAsset[]) {
  useEffect(() => {
    load.all(assets)
  }, [])
}

export function useBounds() {
  const [bounds, setBounds] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () =>
      setBounds({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return bounds
}

export function useAudioTimeline(audioURL: string, timeline: ITimelineEvent[]) {
  const [state, setState] = useState({})

  // Create mixer and timeline
  const stateRef = useRef({})
  const mixerRef = useRef<AudioMixer>()
  const timelineRef = useRef<Timeline>()

  useEffect(() => {
    mixerRef.current = new AudioMixer()
    timelineRef.current = new Timeline(timeline)
  }, [])

  const setup = async () => {
    await mixerRef.current!.resume()

    // Load music
    const { music } = await load.all({
      music: { url: audioURL, type: 'binary' },
    })

    const handleTick = (time: number) => {
      const newTimelineState = timelineRef.current!.getState(
        time,
        stateRef.current
      )
      if (newTimelineState !== stateRef.current) {
        stateRef.current = newTimelineState
        setState(newTimelineState)
      }
    }

    // Create source
    await mixerRef.current!.addSource({
      name: 'music',
      buffer: music,
      onTimeUpdate: handleTick,
      onEnded: () => console.log('R.I.P.'),
    })
  }

  const play = async (location = 0) => {
    await mixerRef.current!.play('music', location)
  }

  return [state, setup, play]
}
