/** Keep the service worker alive during long operations (e.g. searching 15 ingredients). */
export function setupKeepalive(): void {
  chrome.alarms.create("keepalive", { periodInMinutes: 0.25 });
  // Empty listener is sufficient to prevent termination during the alarm period
  chrome.alarms.onAlarm.addListener((_alarm) => {
    // no-op keepalive
  });
}
