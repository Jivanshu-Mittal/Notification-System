/**
 * usePriorityAlarm — Custom React hook for tracking unseen notifications and triggering priority-wise alarms.
 *
 * Priority Time Thresholds (Unseen / Unread duration before alarm triggers):
 *   Standard Mode:
 *     - Placement (High Priority)   : 30 seconds
 *     - Result    (Medium Priority) : 120 seconds (2 minutes)
 *     - Event     (Low Priority)    : 300 seconds (5 minutes)
 *
 *   Demo Mode (For quick testing & evaluation):
 *     - Placement (High Priority)   : 10 seconds
 *     - Result    (Medium Priority) : 20 seconds
 *     - Event     (Low Priority)    : 30 seconds
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Notification, NotificationType } from "@/lib/api";
import { Log } from "@/lib/logger";

export interface ThresholdConfig {
  Placement: number; // in seconds
  Result: number;    // in seconds
  Event: number;     // in seconds
}

export const STANDARD_THRESHOLDS: ThresholdConfig = {
  Placement: 30,  // 30s
  Result: 120,    // 2 min
  Event: 300,     // 5 min
};

export const DEMO_THRESHOLDS: ThresholdConfig = {
  Placement: 10,  // 10s
  Result: 20,     // 20s
  Event: 30,      // 30s
};

export interface AlarmItem {
  notification: Notification;
  elapsedSeconds: number;
  thresholdSeconds: number;
  overdueSeconds: number;
}

export interface UsePriorityAlarmResult {
  activeAlarms: AlarmItem[];
  alarmCount: { Placement: number; Result: number; Event: number; total: number };
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  thresholds: ThresholdConfig;
  getNotificationAlarmInfo: (notification: Notification, isRead: boolean) => AlarmItem | null;
}

// ── Web Audio API Chime Generator ──────────────────────────────────────────────

function playAlarmChime(type: NotificationType) {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.15, now);
    masterGain.connect(ctx.destination);

    if (type === "Placement") {
      // Urgent double beep (880Hz -> 1046.5Hz)
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(1046.5, now + 0.1);
      osc1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.3);
      osc2.frequency.setValueAtTime(1046.5, now + 0.4);
      osc2.connect(masterGain);
      osc2.start(now + 0.3);
      osc2.stop(now + 0.55);
    } else if (type === "Result") {
      // Medium chime (659.25Hz -> 783.99Hz)
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.3);
      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      // Gentle tone (440Hz -> 523.25Hz)
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.4);
      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}

// ── Custom Hook Implementation ──────────────────────────────────────────────────

export function usePriorityAlarm(
  notifications: Notification[],
  readIds: Set<string>
): UsePriorityAlarmResult {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Track the first time each notification ID was loaded/seen in the client session
  const firstSeenMap = useRef<Map<string, number>>(new Map());
  const alertedIdsRef = useRef<Set<string>>(new Set());

  const thresholds = isDemoMode ? DEMO_THRESHOLDS : STANDARD_THRESHOLDS;

  // Initialize first-seen timestamp for newly arrived notifications
  useEffect(() => {
    const currentMap = firstSeenMap.current;
    const now = Date.now();

    notifications.forEach((n) => {
      if (!currentMap.has(n.ID)) {
        currentMap.set(n.ID, now);
      }
    });
  }, [notifications]);

  // Tick timer every second to update elapsed age
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Compute active alarms
  const activeAlarms: AlarmItem[] = [];
  const alarmCount = { Placement: 0, Result: 0, Event: 0, total: 0 };

  notifications.forEach((notification) => {
    if (readIds.has(notification.ID)) return;

    const firstSeen = firstSeenMap.current.get(notification.ID) || nowTimestamp;
    const elapsedSeconds = Math.max(0, Math.floor((nowTimestamp - firstSeen) / 1000));
    const thresholdSeconds = thresholds[notification.Type] || 60;

    if (elapsedSeconds >= thresholdSeconds) {
      const overdueSeconds = elapsedSeconds - thresholdSeconds;
      const alarmItem: AlarmItem = {
        notification,
        elapsedSeconds,
        thresholdSeconds,
        overdueSeconds,
      };

      activeAlarms.push(alarmItem);
      alarmCount[notification.Type] += 1;
      alarmCount.total += 1;

      // Play chime for newly triggered alarms
      if (!alertedIdsRef.current.has(notification.ID)) {
        alertedIdsRef.current.add(notification.ID);
        if (!isMuted) {
          playAlarmChime(notification.Type);
        }
        void Log("frontend", "warn", "hook", `ALARM TRIGGERED: Notification ${notification.ID} (${notification.Type}) unseen for ${elapsedSeconds}s (Threshold: ${thresholdSeconds}s)`);
      }
    }
  });

  // Sort active alarms by priority (Placement > Result > Event) then overdue time
  const typeRank: Record<NotificationType, number> = { Placement: 3, Result: 2, Event: 1 };
  activeAlarms.sort((a, b) => {
    const rankDiff = typeRank[b.notification.Type] - typeRank[a.notification.Type];
    if (rankDiff !== 0) return rankDiff;
    return b.overdueSeconds - a.overdueSeconds;
  });

  const getNotificationAlarmInfo = useCallback(
    (notification: Notification, isRead: boolean): AlarmItem | null => {
      if (isRead) return null;
      const firstSeen = firstSeenMap.current.get(notification.ID) || nowTimestamp;
      const elapsedSeconds = Math.max(0, Math.floor((nowTimestamp - firstSeen) / 1000));
      const thresholdSeconds = thresholds[notification.Type] || 60;

      if (elapsedSeconds >= thresholdSeconds) {
        return {
          notification,
          elapsedSeconds,
          thresholdSeconds,
          overdueSeconds: elapsedSeconds - thresholdSeconds,
        };
      }
      return null;
    },
    [nowTimestamp, thresholds]
  );

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      void Log("frontend", "info", "hook", `Switched alarm mode to: ${next ? "DEMO (10s/20s/30s)" : "STANDARD (30s/2m/5m)"}`);
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      void Log("frontend", "info", "hook", `Alarm audio ${next ? "MUTED" : "UNMUTED"}`);
      return next;
    });
  }, []);

  return {
    activeAlarms,
    alarmCount,
    isDemoMode,
    toggleDemoMode,
    isMuted,
    toggleMute,
    thresholds,
    getNotificationAlarmInfo,
  };
}
