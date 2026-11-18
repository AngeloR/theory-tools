type PendoTrackProperties = Record<string, string | number | boolean | string[]>;

type PendoAgent = {
  track: (event: string, properties?: PendoTrackProperties) => void;
};

declare global {
  interface Window {
    pendo?: PendoAgent;
  }
}

/**
 * Sends a Pendo Track Event when the Pendo agent is loaded.
 * Tracking failures are swallowed so they never break the app.
 */
export function trackPendoEvent(event: string, properties: PendoTrackProperties) {
  if (typeof window === "undefined") return;
  try {
    window.pendo?.track(event, properties);
  } catch {
    // ignore tracking errors
  }
}
