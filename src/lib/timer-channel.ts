export const TIMER_CHANNEL_NAME = "portpolio-timer" as const;

export type TimerStateMessage = {
  type: "STATE";
  running: boolean;
  paused: boolean;
  elapsed: number;
  title: string;
  startedAt: number | null;   // 현재 구간 시작 타임스탬프(ms), 정지/일시정지면 null
  accumulatedMs: number;      // 이전 구간 누적 시간(ms)
};

export type TimerCommandMessage =
  | { type: "START"; title: string }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "STOP" }
  | { type: "REQUEST_STATE" };

export type TimerMessage = TimerStateMessage | TimerCommandMessage;
