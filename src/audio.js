/**
 * RoboSwitch music manager.
 *
 * One authoritative desired track is maintained at all times. Playback
 * requests are versioned so an older asynchronous play() promise cannot
 * revive a track after the game has already changed screens.
 */

export const Music = Object.freeze({
  TITLE: "title",
  GAMEPLAY: "gameplay",
  LEVEL_CLEAR: "levelClear",
  ENDING: "ending",
});

const TRACK_DEFINITIONS = Object.freeze({
  [Music.TITLE]: {
    source: new URL("../assets/music/lets_have_fun.ogg", import.meta.url).href,
    loop: true,
    volume: 0.55,
  },
  [Music.GAMEPLAY]: {
    source: new URL("../assets/music/racing.ogg", import.meta.url).href,
    loop: true,
    volume: 0.5,
  },
  [Music.LEVEL_CLEAR]: {
    source: new URL("../assets/music/stage_end.ogg", import.meta.url).href,
    loop: false,
    volume: 0.7,
  },
  [Music.ENDING]: {
    source: new URL("../assets/music/end.ogg", import.meta.url).href,
    loop: false,
    volume: 0.65,
  },
});

const tracks = Object.fromEntries(
  Object.entries(TRACK_DEFINITIONS).map(([trackName, definition]) => {
    const track = new Audio(definition.source);
    track.preload = trackName === Music.TITLE || trackName === Music.GAMEPLAY ? "auto" : "metadata";

    track.loop = definition.loop;
    track.volume = definition.volume;
    track.setAttribute("playsinline", "");
    return [trackName, track];
  }),
);

let currentTrack = null;
let currentTrackName = null;
let desiredTrackName = null;
let requestVersion = 0;
let masterMusicVolume = 1;
let musicMuted = false;
let suspendedByGame = false;
let userHasInteracted = false;
let retryTimer = 0;
let lastAttemptAt = 0;

const AUDIO_DEBUG = new URLSearchParams(window.location.search).get("audioDebug") === "1";

function debug(...args) {
  if (AUDIO_DEBUG) console.info("[RoboSwitch music]", ...args);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function isValidTrack(trackName) {
  return Object.prototype.hasOwnProperty.call(tracks, trackName);
}

function updateTrackVolume(trackName) {
  if (!isValidTrack(trackName)) return;
  const track = tracks[trackName];
  const definition = TRACK_DEFINITIONS[trackName];
  track.volume = musicMuted
    ? 0
    : clamp(definition.volume * masterMusicVolume, 0, 1);
}

function updateAllTrackVolumes() {
  for (const trackName of Object.keys(tracks)) updateTrackVolume(trackName);
}

function clearRetry() {
  if (!retryTimer) return;
  window.clearTimeout(retryTimer);
  retryTimer = 0;
}

function pauseOtherTracks(exceptTrack = null) {
  for (const track of Object.values(tracks)) {
    if (track === exceptTrack) continue;
    if (!track.paused) track.pause();
  }
}

function shouldBePlaying(trackName) {
  return (
    Boolean(trackName) &&
    desiredTrackName === trackName &&
    !suspendedByGame &&
    !musicMuted &&
    masterMusicVolume > 0 &&
    !document.hidden
  );
}

function scheduleRetry(trackName, version, delay = 650) {
  clearRetry();
  if (!userHasInteracted || !shouldBePlaying(trackName)) return;

  retryTimer = window.setTimeout(() => {
    retryTimer = 0;
    if (version !== requestVersion || desiredTrackName !== trackName) return;
    void attemptPlayback(trackName, version, "retry");
  }, delay);
}
async function attemptPlayback(trackName, version, reason) {
  if (!isValidTrack(trackName)) return false;
  if (version !== requestVersion || desiredTrackName !== trackName) return false;
  if (suspendedByGame || document.hidden) return false;

  const track = tracks[trackName];
  const previousTrack =
    currentTrack && currentTrack !== track ? currentTrack : null;

  updateTrackVolume(trackName);
  lastAttemptAt = performance.now();

  try {
    await track.play();

    // A newer screen may have requested another song while play() awaited.
    if (
      version !== requestVersion ||
      desiredTrackName !== trackName ||
      suspendedByGame
    ) {
      track.pause();
      debug("discarded stale play", trackName, reason);
      return false;
    }

    // Only stop the old music after the new track is definitely playing.
    currentTrack = track;
    currentTrackName = trackName;
    pauseOtherTracks(track);

    if (previousTrack) {
      previousTrack.currentTime = 0;
    }

    clearRetry();
    debug("playing", trackName, reason);
    return true;
  } catch (error) {
    if (version !== requestVersion || desiredTrackName !== trackName) {
      return false;
    }

    if (error?.name !== "AbortError") {
      console.warn(
        `RoboSwitch could not play music "${trackName}":`,
        error,
      );
    }

    scheduleRetry(
      trackName,
      version,
      error?.name === "NotAllowedError" ? 1200 : 700,
    );

    return false;
  }
}


export function setMusicSettings({
  volume = masterMusicVolume,
  muted = musicMuted,
} = {}) {
  const parsedVolume = Number(volume);
  masterMusicVolume = Number.isFinite(parsedVolume)
    ? clamp(parsedVolume, 0, 1)
    : masterMusicVolume;
  musicMuted = Boolean(muted);
  updateAllTrackVolumes();

  if (!musicMuted && desiredTrackName && currentTrack?.paused && userHasInteracted) {
    void attemptPlayback(desiredTrackName, requestVersion, "settings");
  }
}

export async function playMusic(trackName, { restart = false } = {}) {
  if (!isValidTrack(trackName)) {
    console.warn(`Unknown RoboSwitch music track: ${trackName}`);
    return false;
  }

  clearRetry();
  suspendedByGame = false;

  const switchingTracks = desiredTrackName !== trackName;
  if (switchingTracks) requestVersion += 1;
  desiredTrackName = trackName;

  const requestedTrack = tracks[trackName];

  if (restart) {
    requestVersion += 1;
    requestedTrack.currentTime = 0;
  }

  const version = requestVersion;
  if (!requestedTrack.paused && !restart) return true;
  return attemptPlayback(trackName, version, restart ? "restart" : "request");
}

export function stopMusic({ reset = true } = {}) {
  clearRetry();
  requestVersion += 1;
  desiredTrackName = null;
  suspendedByGame = false;

  for (const track of Object.values(tracks)) {
    track.pause();
    if (reset) track.currentTime = 0;
  }

  currentTrack = null;
  currentTrackName = null;
  debug("stopped");
}

export function pauseMusic() {
  clearRetry();
  suspendedByGame = true;
  if (currentTrack && !currentTrack.paused) currentTrack.pause();
  debug("paused by game", currentTrackName);
}

export async function resumeMusic() {
  suspendedByGame = false;
  if (!desiredTrackName) return false;
  return attemptPlayback(desiredTrackName, requestVersion, "resume");
}

/** Mark a real click/key gesture and retry only the currently desired song. */
export function notifyMusicInteraction() {
  userHasInteracted = true;
  if (
    desiredTrackName &&
    !suspendedByGame &&
    tracks[desiredTrackName]?.paused &&
    !tracks[desiredTrackName]?.ended
  ) {
    void attemptPlayback(desiredTrackName, requestVersion, "user gesture");
  }
}

export function getCurrentMusic() {
  return currentTrackName;
}

export function isMusicPlaying() {
  return Boolean(currentTrack && !currentTrack.paused && !currentTrack.ended);
}

export function getMusicDebugState() {
  return {
    currentTrackName,
    desiredTrackName,
    playing: isMusicPlaying(),
    paused: currentTrack?.paused ?? true,
    ended: currentTrack?.ended ?? false,
    suspendedByGame,
    userHasInteracted,
    muted: musicMuted,
    volume: masterMusicVolume,
    readyState: currentTrack?.readyState ?? 0,
    networkState: currentTrack?.networkState ?? 0,
    currentTime: currentTrack?.currentTime ?? 0,
    lastAttemptAt,
  };
}

export function resetAllMusic() {
  stopMusic({ reset: true });
}

// Recover from an unexpected browser/media pause without fighting intentional
// pause screens, muting, tab hiding, or completed one-shot tracks.
window.setInterval(() => {
  if (!userHasInteracted || !desiredTrackName || suspendedByGame || document.hidden) return;
  const track = tracks[desiredTrackName];
  if (!track || !track.paused || track.ended || musicMuted || masterMusicVolume <= 0) return;
  if (performance.now() - lastAttemptAt < 1200) return;
  void attemptPlayback(desiredTrackName, requestVersion, "watchdog");
}, 1500);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (currentTrack && !currentTrack.paused) currentTrack.pause();
    return;
  }

  if (userHasInteracted && desiredTrackName && !suspendedByGame) {
    void attemptPlayback(desiredTrackName, requestVersion, "tab visible");
  }
});

for (const [trackName, track] of Object.entries(tracks)) {
  track.addEventListener("error", () => {
    console.warn(`RoboSwitch music media error for "${trackName}":`, track.error);
    if (desiredTrackName === trackName) scheduleRetry(trackName, requestVersion, 1000);
  });

  track.addEventListener("stalled", () => {
    debug("stalled", trackName);
    if (desiredTrackName === trackName) scheduleRetry(trackName, requestVersion, 900);
  });

  track.addEventListener("ended", () => {
    debug("ended", trackName);
    // One-shot tracks intentionally remain ended and silent until the game
    // requests another screen's music. The watchdog must not restart them.
  });
}

updateAllTrackVolumes();
