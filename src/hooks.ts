import { useEffect, useState, useRef } from 'react'
import load from 'load-asset'

import AudioMixer from './mixer'
import { Timeline, TimelineEventObject } from './timeline'

export function timeoutThen(time: number): Promise<void> {
  return new Promise((resolve): number => setTimeout(resolve, time))
}

interface Asset {
  [key: string]: string
}

export function usePrefetch(assets: Asset[]): void {
  useEffect((): void => {
    load.all(assets)
  }, [])
}

export interface Bounds {
  width: number
  height: number
}

export function useBounds(): Bounds {
  const [bounds, setBounds] = useState<Bounds>({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect((): (() => void) => {
    const handleResize = (): void =>
      setBounds({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return (): void => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return bounds
}

export function useAudioTimeline(
  audioURL: string,
  timeline: TimelineEventObject[]
): [{}, () => Promise<void>, () => Promise<void>] {
  const [state, setState] = useState({})

  // Create mixer and timeline
  const stateRef = useRef({})
  const mixerRef = useRef<AudioMixer>()
  const timelineRef = useRef<Timeline>()

  useEffect((): void => {
    mixerRef.current = new AudioMixer()
    timelineRef.current = new Timeline(timeline)
  }, [])

  const setup = async (): Promise<void> => {
    await mixerRef.current!.resume()

    // Load music
    const { music } = await load.all({
      music: { url: audioURL, type: 'binary' },
    })

    const handleTick = (time: number): void => {
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
      onEnded: (): void => console.log('R.I.P.'), // eslint-disable-line no-console
    })
  }

  const play = async (location = 0): Promise<void> => {
    await mixerRef.current!.play('music', location)
  }

  return [state, setup, play]
}
