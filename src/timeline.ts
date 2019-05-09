export interface ITimelineEvent {
  targetTime: number
  callback: () => object
}

export class Timeline {
  timelineEventGroup: TimelineEvent[]

  constructor(timelineEvents: ITimelineEvent[]) {
    this.timelineEventGroup = timelineEvents.map(
      (event) => new TimelineEvent(event.targetTime, event.callback)
    )
  }

  getState(deltaTime: number, state: object) {
    let newState = state
    for (const timeEvent of this.timelineEventGroup) {
      const partialState = timeEvent.checkForState(deltaTime)
      if (partialState) {
        newState = { ...newState, ...partialState }
      }
    }
    return newState
  }
}

export class TimelineEvent {
  emitted: boolean

  constructor(private targetTime: number, private callback: () => object) {
    this.emitted = false
  }

  checkForState(time: number) {
    if (this.emitted == true) {
      return false
    }
    if (time >= this.targetTime) {
      this.emitted = true
      return this.callback()
    }
    return false
  }
}
