'use client';

import { useEffect } from 'react';

async function initCron() {
  try {
    await fetch('/api/cron/init');
  } catch (error) {
    console.error('Error initializing cron jobs:', error);
  }
}

export function CronInitializer() {
  useEffect(() => {
    initCron();
  }, []);

  return null;
}