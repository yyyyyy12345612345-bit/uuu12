/**
 * 🎵 Media Session API — Spotify-style notification controls
 * 
 * This module provides lock-screen & notification-shade media controls
 * that show the current Surah name, reciter, and playback buttons.
 * 
 * Works on:
 * - Android (Chrome, WebView, Capacitor)
 * - iOS Safari (limited)
 * - Desktop browsers
 */

const APP_LOGO = '/logo/logo.png';
const APP_LOGO_FULL = 'https://quran1mu.vercel.app/logo/logo.png';

export interface MediaInfo {
  /** e.g. "سورة الفاتحة" */
  title: string;
  /** e.g. "مشاري العفاسي" */
  artist: string;
  /** e.g. "القرآن الكريم" */
  album?: string;
}

export interface MediaHandlers {
  onPlay: () => void;
  onPause: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSeekTo?: (time: number) => void;
}

/**
 * Initialize or update the media session notification.
 * Call this whenever the track changes (new surah, new verse, etc.)
 */
export function setupMediaSession(info: MediaInfo, handlers: MediaHandlers): void {
  if (!('mediaSession' in navigator)) return;

  try {
    // 1. Set metadata — this is what shows in the notification
    navigator.mediaSession.metadata = new MediaMetadata({
      title: info.title,
      artist: info.artist,
      album: info.album || 'القرآن الكريم',
      artwork: [
        { src: APP_LOGO, sizes: '96x96', type: 'image/png' },
        { src: APP_LOGO, sizes: '128x128', type: 'image/png' },
        { src: APP_LOGO, sizes: '192x192', type: 'image/png' },
        { src: APP_LOGO_FULL, sizes: '512x512', type: 'image/png' },
      ],
    });

    // 2. Register action handlers — these are the buttons in the notification
    navigator.mediaSession.setActionHandler('play', () => {
      handlers.onPlay();
      setPlaybackState('playing');
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      handlers.onPause();
      setPlaybackState('paused');
    });

    // Next track button
    if (handlers.onNext) {
      navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
    } else {
      navigator.mediaSession.setActionHandler('nexttrack', null);
    }

    // Previous track button
    if (handlers.onPrev) {
      navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrev);
    } else {
      navigator.mediaSession.setActionHandler('previoustrack', null);
    }

    // Seek support (for progress bar in notification)
    if (handlers.onSeekTo) {
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          handlers.onSeekTo!(details.seekTime);
        }
      });
    }

    // Stop handler
    navigator.mediaSession.setActionHandler('stop', () => {
      handlers.onPause();
      setPlaybackState('none');
    });

  } catch (e) {
    console.warn('[MediaSession] Setup failed:', e);
  }
}

/**
 * Update the playback state shown in the notification.
 * Call this whenever play/pause state changes.
 */
export function setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch (e) {
    // Silently fail — some browsers don't support this
  }
}

/**
 * Update the position state (progress bar) in the notification.
 * Call this periodically during playback for the seek bar to work.
 */
export function updatePositionState(
  duration: number,
  position: number,
  playbackRate: number = 1
): void {
  if (!('mediaSession' in navigator)) return;
  try {
    if (duration > 0 && position >= 0 && position <= duration) {
      navigator.mediaSession.setPositionState({
        duration,
        position,
        playbackRate,
      });
    }
  } catch (e) {
    // Silently fail — not all browsers support position state
  }
}

/**
 * Clear the media session completely.
 * Call this when playback fully stops.
 */
export function clearMediaSession(): void {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
    
    const actions: MediaSessionAction[] = ['play', 'pause', 'nexttrack', 'previoustrack', 'seekto', 'stop'];
    actions.forEach(action => {
      try { navigator.mediaSession.setActionHandler(action, null); } catch {}
    });
  } catch (e) {
    // Silently fail
  }
}
