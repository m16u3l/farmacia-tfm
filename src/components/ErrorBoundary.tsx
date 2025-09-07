"use client";

import { Box, Typography, Button } from "@mui/material";

interface ErrorBoundaryProps {
  error: Error;
  reset?: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <Box
      sx={{
        p: 3,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Typography color="error" variant="h6">
        Error: {error.message}
      </Typography>
      {reset && (
        <Button variant="contained" onClick={reset}>
          Intentar de nuevo
        </Button>
      )}
    </Box>
  );
}
