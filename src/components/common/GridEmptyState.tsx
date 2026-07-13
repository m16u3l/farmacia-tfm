"use client";

import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";

interface GridEmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Empty state con CTA para usar como noRowsOverlay de un DataGrid:
 *   slots={{ noRowsOverlay: () => <GridEmptyState message="..." actionLabel="..." onAction={...} /> }}
 */
export function GridEmptyState({ message, actionLabel, onAction }: GridEmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 1,
        p: 3,
        textAlign: "center",
        // El overlay del DataGrid desactiva pointer-events; sin esto el botón no es clickeable.
        pointerEvents: "auto",
      }}
    >
      <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      {actionLabel && onAction && (
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
