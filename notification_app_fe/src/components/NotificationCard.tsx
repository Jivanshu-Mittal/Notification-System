/**
 * NotificationCard — MUI card displaying a single notification.
 * Visually differentiates between read (muted), unread (highlighted), and alarm (overdue pulsing) states.
 */

"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import EventIcon from "@mui/icons-material/Event";
import AlarmIcon from "@mui/icons-material/Alarm";
import { Notification } from "@/lib/api";
import { AlarmItem } from "@/hooks/usePriorityAlarm";
import { Log } from "@/lib/logger";

// ── Type metadata ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  Placement: {
    color: "#1565c0" as const,
    bg: "#e3f2fd" as const,
    icon: <WorkIcon fontSize="small" />,
    chipColor: "primary" as const,
  },
  Result: {
    color: "#2e7d32" as const,
    bg: "#e8f5e9" as const,
    icon: <SchoolIcon fontSize="small" />,
    chipColor: "success" as const,
  },
  Event: {
    color: "#e65100" as const,
    bg: "#fff3e0" as const,
    icon: <EventIcon fontSize="small" />,
    chipColor: "warning" as const,
  },
};

// ── Props ──────────────────────────────────────────────────────────────────────

interface NotificationCardProps {
  notification: Notification;
  isRead: boolean;
  rank?: number;                         // Optional rank number for priority inbox
  alarmInfo?: AlarmItem | null;          // Optional priority alarm details
  onMarkRead: (id: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function NotificationCard({
  notification,
  isRead,
  rank,
  alarmInfo,
  onMarkRead,
}: NotificationCardProps): React.ReactElement {
  const config = TYPE_CONFIG[notification.Type];
  const isAlarm = Boolean(alarmInfo && !isRead);

  function handleMarkRead(): void {
    onMarkRead(notification.ID);
    void Log("frontend", "debug", "component", `Notification ${notification.ID} marked as read by user`);
  }

  const formattedDate = new Date(notification.Timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Card
      elevation={isAlarm ? 6 : isRead ? 0 : 3}
      sx={{
        mb: 1.5,
        border: "1px solid",
        borderColor: isAlarm ? "#d32f2f" : isRead ? "#e0e0e0" : config.color,
        borderLeft: `6px solid ${isAlarm ? "#d32f2f" : isRead ? "#bdbdbd" : config.color}`,
        backgroundColor: isAlarm ? "#fff0f0" : isRead ? "#fafafa" : config.bg,
        opacity: isRead ? 0.75 : 1,
        transition: "all 0.25s ease",
        position: "relative",
        overflow: "visible",
        ...(isAlarm && {
          animation: "cardPulse 1.5s infinite ease-in-out",
          "@keyframes cardPulse": {
            "0%": { boxShadow: "0 0 0 0 rgba(211, 47, 47, 0.4)" },
            "70%": { boxShadow: "0 0 0 8px rgba(211, 47, 47, 0)" },
            "100%": { boxShadow: "0 0 0 0 rgba(211, 47, 47, 0)" },
          },
        }),
        "&:hover": {
          boxShadow: isRead ? 1 : 5,
          opacity: 1,
        },
      }}
    >
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          {/* Left: Rank badge (priority inbox) + type icon + message */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1 }}>
            {rank !== undefined && (
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: isAlarm ? "#d32f2f" : config.color,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                #{rank}
              </Box>
            )}

            <Box sx={{ color: isAlarm ? "#d32f2f" : config.color, flexShrink: 0, mt: 0.3 }}>
              {config.icon}
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="body1"
                color={isAlarm ? "#d32f2f" : isRead ? "text.secondary" : "text.primary"}
                sx={{ fontWeight: isAlarm ? 700 : isRead ? 400 : 600, lineHeight: 1.3 }}
              >
                {notification.Message}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 0.3 }}>
                <Typography variant="caption" color="text.disabled">
                  {formattedDate}
                </Typography>

                {isAlarm && alarmInfo && (
                  <Chip
                    icon={<AlarmIcon fontSize="small" style={{ color: "#fff" }} />}
                    label={`OVERDUE (+${alarmInfo.overdueSeconds}s)`}
                    size="small"
                    color="error"
                    sx={{
                      height: 20,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      animation: "blink 1s infinite alternate",
                      "@keyframes blink": {
                        "0%": { opacity: 0.7 },
                        "100%": { opacity: 1 },
                      },
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Right: Type chip + unread dot + mark-read button */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            <Chip
              label={notification.Type}
              size="small"
              color={config.chipColor}
              variant={isRead ? "outlined" : "filled"}
              sx={{ fontSize: "0.7rem", height: 22 }}
            />

            {!isRead && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: isAlarm ? "#d32f2f" : config.color,
                  flexShrink: 0,
                }}
              />
            )}

            <Tooltip title={isRead ? "Already read" : isAlarm ? "Acknowledge & Clear Alarm" : "Mark as read"}>
              <span>
                <IconButton
                  size="small"
                  onClick={handleMarkRead}
                  disabled={isRead}
                  sx={{ color: isAlarm ? "#d32f2f" : isRead ? "#bdbdbd" : config.color }}
                >
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
