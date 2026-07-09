"use client";

import { AppBar, Toolbar, IconButton, Typography, Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";

interface MobileAppBarProps {
  onMenuClick: () => void;
}

export function MobileAppBar({ onMenuClick }: MobileAppBarProps) {
  return (
    <AppBar
      position="fixed"
      sx={{
        display: { xs: "block", md: "none" },
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 1.5 }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LocalPharmacyIcon fontSize="small" />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
            BioFarm
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
