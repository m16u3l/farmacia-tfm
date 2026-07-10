"use client";

import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";
import { fluidFontSize } from "@/utils/fluidType";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      mb={3}
      flexDirection={{ xs: "column", sm: "row" }}
      gap={{ xs: 2, sm: 0 }}
    >
      <Box display="flex" alignItems="center" gap={1.5}>
        {icon && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: "rgba(14, 124, 102, 0.1)",
              color: "primary.main",
              flexShrink: 0,
              "& svg": { fontSize: 24 },
            }}
          >
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="h4" sx={{ fontSize: fluidFontSize(1.35, 1.6) }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {action && (
        <Box sx={{ width: { xs: "100%", sm: "auto" } }}>{action}</Box>
      )}
    </Box>
  );
}
