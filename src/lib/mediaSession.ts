
export interface MediaMetadata {
  title: string;
  artist: string;
  album?: string;
  artwork?: { src: string; sizes: string; type: string }[];
}

export function updateMediaSession(
  metadata: MediaMetadata,
  handlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext?: () => void;
    onPrev?: () => void;
  }
) {
  if (!('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album || 'القرآن الكريم',
    artwork: metadata.artwork || [
      { src: 'https://quran1mu.vercel.app/logo/logo.png', sizes: '512x512', type: 'image/png' }
    ]
  });

  navigator.mediaSession.setActionHandler('play', handlers.onPlay);
  navigator.mediaSession.setActionHandler('pause', handlers.onPause);
  
  if (handlers.onNext) {
    navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
  } else {
    navigator.mediaSession.setActionHandler('nexttrack', null);
  }

  if (handlers.onPrev) {
    navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrev);
  } else {
    navigator.mediaSession.setActionHandler('previoustrack', null);
  }
}

export function updatePlaybackState(state: 'playing' | 'paused' | 'none') {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = state;
}
