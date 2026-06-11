export const TIMER_CHANNEL_NAME = "portpolio-timer" as const;

export type TimerStateMessage = {
  type: "STATE";
  running: boolean;
  paused: boolean;
  elapsed: number;
  title: string;
};

export type TimerCommandMessage =
  | { type: "START"; title: string }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "STOP" }
  | { type: "REQUEST_STATE" };

export type TimerMessage = TimerStateMessage | TimerCommandMessage;
