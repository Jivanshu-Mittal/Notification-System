/**
 * AlarmBanner — Dynamic sticky alert header and control panel for priority-wise unseen notification alarms.
 */

"use client";

import React, { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Collapse,
  Badge,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import TimerIcon from "@mui/icons-material/Timer";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { UsePriorityAlarmResult } from "@/hooks/usePriorityAlarm";

interface AlarmBannerProps {
  alarmState: UsePriorityAlarmResult;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

import { useTheme } from "@mui/material/styles";

export default function AlarmBanner({
  alarmState,
  onMarkAllRead,
  onMarkRead,
}: AlarmBannerProps): React.ReactElement {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [expanded, setExpanded] = useState<boolean>(false);
  const {
    activeAlarms,
    alarmCount,
    isDemoMode,
    toggleDemoMode,
    isMuted,
    toggleMute,
    thresholds,
  } = alarmState;

  const hasAlarms = activeAlarms.length > 0;

  const bannerBg = hasAlarms
    ? isDark
      ? "rgba(211, 47, 47, 0.15)"
      : "#fff5f5"
    : isDark
    ? "background.paper"
    : "#ffffff";

  const bannerBorder = hasAlarms
    ? isDark
      ? "#ef5350"
      : "#d32f2f"
    : isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "#e0e0e0";

  return (
    <Paper
      elevation={hasAlarms ? 6 : 1}
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: bannerBorder,
        backgroundColor: bannerBg,
        transition: "all 0.3s ease",
        ...(hasAlarms && {
          animation: "pulseBorder 2s infinite ease-in-out",
          "@keyframes pulseBorder": {
            "0%": { boxShadow: `0 0 0 0 ${isDark ? "rgba(239, 83, 80, 0.4)" : "rgba(211, 47, 47, 0.4)"}` },
            "70%": { boxShadow: "0 0 0 10px rgba(211, 47, 47, 0)" },
            "100%": { boxShadow: "0 0 0 0 rgba(211, 47, 47, 0)" },
          },
        }),
      }}
    >
      {/* Primary Banner Header Row */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
        {/* Left Status & Counters */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Badge badgeContent={alarmCount.total} color="error" overlap="circular" showZero={false}>
            <WarningAmberIcon
              color={hasAlarms ? "error" : "action"}
              sx={{
                fontSize: 28,
                ...(hasAlarms && {
                  animation: "bounce 1s infinite alternate",
                  "@keyframes bounce": {
                    "0%": { transform: "translateY(0)" },
                    "100%": { transform: "translateY(-3px)" },
                  },
                }),
              }}
            />
          </Badge>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: hasAlarms ? "#d32f2f" : "text.primary", lineHeight: 1.2 }}>
              {hasAlarms ? `⏰ PRIORITY ALARM: ${alarmCount.total} Overdue Unseen Notification(s)` : "Priority Alarm Monitoring Active"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Thresholds: Placement ({thresholds.Placement}s) • Result ({thresholds.Result}s) • Event ({thresholds.Event}s)
            </Typography>
          </Box>
        </Box>

        {/* Center Priority Chips */}
        {hasAlarms && (
          <Box sx={{ display: "flex", gap: 0.8, alignItems: "center" }}>
            {alarmCount.Placement > 0 && (
              <Chip
                label={`Placement (${alarmCount.Placement})`}
                color="primary"
                size="small"
                sx={{ fontWeight: 700, bgcolor: "#1565c0" }}
              />
            )}
            {alarmCount.Result > 0 && (
              <Chip
                label={`Result (${alarmCount.Result})`}
                color="success"
                size="small"
                sx={{ fontWeight: 700, bgcolor: "#2e7d32" }}
              />
            )}
            {alarmCount.Event > 0 && (
              <Chip
                label={`Event (${alarmCount.Event})`}
                color="warning"
                size="small"
                sx={{ fontWeight: 700, bgcolor: "#e65100" }}
              />
            )}
          </Box>
        )}

        {/* Right Controls */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Demo Mode Toggle Button */}
          <Tooltip title={`Switch to ${isDemoMode ? "Standard Thresholds (30s/2m/5m)" : "Demo Fast Thresholds (10s/20s/30s)"}`}>
            <Button
              variant={isDemoMode ? "contained" : "outlined"}
              color={isDemoMode ? "secondary" : "inherit"}
              size="small"
              onClick={toggleDemoMode}
              startIcon={<TimerIcon fontSize="small" />}
              sx={{ fontSize: "0.75rem" }}
            >
              {isDemoMode ? "Demo Mode (10s/20s/30s)" : "Standard Mode"}
            </Button>
          </Tooltip>

          {/* Audio Sound Mute Toggle */}
          <Tooltip title={isMuted ? "Unmute Alarm Sound" : "Mute Alarm Sound"}>
            <IconButton size="small" onClick={toggleMute} color={isMuted ? "default" : "primary"}>
              {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Mark All Read */}
          {hasAlarms && (
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={onMarkAllRead}
              startIcon={<DoneAllIcon fontSize="small" />}
              sx={{ fontSize: "0.75rem", fontWeight: 700 }}
            >
              Clear Alarms
            </Button>
          )}

          {/* Expand Details Arrow */}
          {hasAlarms && (
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Expandable Overdue Alarms List */}
      <Collapse in={expanded && hasAlarms} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px dashed #ef9a9a" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "#d32f2f", textTransform: "uppercase", display: "block", mb: 1 }}>
            Overdue Notifications Requiring Action:
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {activeAlarms.map((item) => (
              <Box
                key={item.notification.ID}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: "#ffffff",
                  borderLeft: `4px solid ${
                    item.notification.Type === "Placement"
                      ? "#1565c0"
                      : item.notification.Type === "Result"
                      ? "#2e7d32"
                      : "#e65100"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ pr: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    [{item.notification.Type}] {item.notification.Message}
                  </Typography>
                  <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>
                    ⏱ Overdue by {item.overdueSeconds}s (Unseen for {item.elapsedSeconds}s, Limit: {item.thresholdSeconds}s)
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => onMarkRead(item.notification.ID)}
                  sx={{ fontSize: "0.7rem", flexShrink: 0 }}
                >
                  Mark Read
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
