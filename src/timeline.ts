export interface TimelineEventObject {
  targetTime: number
  callback: () => object
}

export class TimelineEvent {
  private emitted: boolean
  private targetTime: number
  private callback: () => object

  public constructor(targetTime: number, callback: () => object) {
    this.targetTime = targetTime
    this.callback = callback
    this.emitted = false
  }

  public checkForState(time: number): object | null {
    if (this.emitted == true) {
      return null
    }
    if (time >= this.targetTime) {
      this.emitted = true
      return this.callback()
    }
    return null
  }
}

export class Timeline {
  private timelineEventGroup: TimelineEvent[]

  public constructor(timelineEvents: TimelineEventObject[]) {
    this.timelineEventGroup = timelineEvents.map(
      (event): TimelineEvent =>
        new TimelineEvent(event.targetTime, event.callback)
    )
  }

  public getState(deltaTime: number, state: object): object {
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
