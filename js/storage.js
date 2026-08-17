// Minimal localStorage utility: anonymous per-device ID + per (date, level)
// result tracking, so a device can't replay a day's puzzle once completed.
// No accounts, no sync — purely local, session-independent.

const DEVICE_ID_KEY = 'splitsecond:deviceId';

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function resultKey(dateKey, level) {
  return `splitsecond:result:${dateKey}:${level}`;
}

function getStoredResult(dateKey, level) {
  const raw = localStorage.getItem(resultKey(dateKey, level));
  return raw ? JSON.parse(raw) : null;
}

function storeResult(dateKey, level, record) {
  localStorage.setItem(resultKey(dateKey, level), JSON.stringify(record));
}

window.Storage = { getDeviceId, getStoredResult, storeResult };