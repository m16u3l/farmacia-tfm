"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useCallback, useRef, useState } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Color del botón de confirmación; "error" para acciones destructivas. */
  confirmColor?: "primary" | "error";
}

/**
 * Reemplazo de window.confirm con el look & feel de la app.
 *
 * Uso:
 *   const { confirm, confirmDialog } = useConfirmDialog();
 *   if (await confirm({ title: "...", message: "..." })) { ... }
 *   // y renderizar {confirmDialog} una vez en el JSX de la página
 */
export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<(confirmed: boolean) => void>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const close = (confirmed: boolean) => {
    setOptions(null);
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
  };

  const confirmDialog = (
    <Dialog
      open={options !== null}
      onClose={() => close(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{options?.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{options?.message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => close(false)}>
          {options?.cancelLabel ?? "Cancelar"}
        </Button>
        <Button
          variant="contained"
          color={options?.confirmColor ?? "error"}
          onClick={() => close(true)}
          autoFocus
        >
          {options?.confirmLabel ?? "Eliminar"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { confirm, confirmDialog };
}
