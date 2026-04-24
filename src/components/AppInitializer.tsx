"use client";

import { useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export default function AppInitializer() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initializePermissions = async () => {
      try {
        // 1. Request Location Permission
        const locStatus = await Geolocation.checkPermissions();
        if (locStatus.location === 'prompt' || locStatus.location === 'prompt-with-description') {
          await Geolocation.requestPermissions();
        }

        // 2. Request Notification Permission
        const notifStatus = await LocalNotifications.checkPermissions();
        if (notifStatus.display === 'prompt') {
          await LocalNotifications.requestPermissions();
        }

        console.log('🚀 App permissions initialized');
      } catch (error) {
        console.error('❌ Error initializing permissions:', error);
      }
    };

    initializePermissions();

    // Handle App State (Background/Foreground)
    const handleAppState = App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });

    return () => {
      handleAppState.remove();
    };
  }, []);

  return null;
}
