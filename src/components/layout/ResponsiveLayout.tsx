"use client";

import { useState } from "react";
import { Box, CssBaseline } from "@mui/material";
import { Sidebar } from "./Sidebar";
import { MobileAppBar } from "./MobileAppBar";

const DRAWER_WIDTH = 240;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />
      
      {/* Mobile App Bar */}
      <MobileAppBar onMenuClick={handleDrawerToggle} />
      
      {/* Sidebar */}
      <Sidebar 
        mobileOpen={mobileOpen} 
        onMobileToggle={handleDrawerToggle} 
      />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { 
            xs: '100%', 
            md: `calc(100% - ${DRAWER_WIDTH}px)` 
          },
          minHeight: '100vh',
          display: "flex",
          flexDirection: "column",
          // Add top margin for mobile app bar
          mt: { xs: '64px', md: 0 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
