"use client";

import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useColorMode } from "@/components/Providers";

export default function ThemeToggle(): React.ReactElement {
  const { mode, toggleColorMode } = useColorMode();

  return (
    <Tooltip title={`Switch to ${mode === "light" ? "Dark" : "Light"} mode`}>
      <IconButton onClick={toggleColorMode} color="inherit" size="small" sx={{ ml: 1 }}>
        {mode === "dark" ? <LightModeIcon sx={{ color: "#ffb74d" }} /> : <DarkModeIcon sx={{ color: "#475569" }} />}
      </IconButton>
    </Tooltip>
  );
}
