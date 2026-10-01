// Relief Society calendar shared sync + email notifications.
// Paste this file into a Google Apps Script project, then deploy it as a
// Web app: Execute as you, Who has access: Anyone.

const STATE_KEY = 'RELIEF_SOCIETY_CALENDAR_STATE';
const EMAIL_KEY = 'RELIEF_SOCIETY_NOTIFICATION_EMAIL';

function doGet() {
  const saved = PropertiesService.getScriptProperties().getProperty(STATE_KEY);
  const payload = saved ? JSON.parse(saved) : { state: null, history: [] };
  return jsonOutput(payload);
}

function doPost(event) {
  const incoming = JSON.parse(event.postData.contents || '{}');
  if (!incoming.state) return jsonOutput({ ok: false, error: 'Missing calendar state.' });

  const properties = PropertiesService.getScriptProperties();
  const previousRaw = properties.getProperty(STATE_KEY);
  const previous = previousRaw ? JSON.parse(previousRaw) : null;
  const email = incoming.notificationEmail || properties.getProperty(EMAIL_KEY) || '';
  const saved = {
    state: incoming.state,
    history: Array.isArray(incoming.history) ? incoming.history.slice(0, 20) : [],
    updatedAt: incoming.updatedAt || new Date().toISOString()
  };

  properties.setProperty(STATE_KEY, JSON.stringify(saved));
  if (email) properties.setProperty(EMAIL_KEY, email);

  const changes = findTeacherChanges(previous && previous.state, incoming.state);
  if (email && changes.length) {
    sendTeacherChangeEmail(email, changes, incoming.state);
  }

  return jsonOutput({ ok: true, teacherChanges: changes.length });
}

function findTeacherChanges(previous, current) {
  if (!previous) return [];
  const before = previous.savedOverrides || {};
  const after = current.savedOverrides || {};
  const dates = {};
  Object.keys(before).forEach(date => dates[date] = true);
  Object.keys(after).forEach(date => dates[date] = true);

  // Also compare the visible three-month schedule so rotation or starting-date
  // changes can notify the calendar owner, even without a one-date override.
  [previous.settings, current.settings].forEach(settings => {
    if (!settings || !settings.startDate) return;
    const start = new Date(settings.startDate + 'T00:00:00');
    for (let week = 0; week < 14; week++) {
      dates[Utilities.formatDate(new Date(start.getTime() + week * 7 * 24 * 60 * 60 * 1000), Session.getScriptTimeZone() || 'America/Denver', 'yyyy-MM-dd')] = true;
    }
  });

  return Object.keys(dates).sort().map(date => {
    const oldTeacher = before[date] || scheduledTeacher(previous.settings, date);
    const newTeacher = after[date] || scheduledTeacher(current.settings, date);
    return oldTeacher !== newTeacher ? { date, oldTeacher, newTeacher } : null;
  }).filter(Boolean);
}

function scheduledTeacher(settings, dateText) {
  const rotation = settings && settings.rotation;
  if (!rotation || !rotation.length) return '';
  const start = new Date(settings.startDate + 'T00:00:00');
  const date = new Date(dateText + 'T00:00:00');
  const weeks = Math.floor((date.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return weeks >= 0 ? rotation[weeks % rotation.length] : '';
}

function sendTeacherChangeEmail(email, changes, state) {
  const lines = changes.map(change => `${formatDate(change.date)}: ${change.oldTeacher || 'Unassigned'} → ${change.newTeacher || 'Unassigned'}`);
  const subject = 'Relief Society teaching assignment changed';
  const body = [
    'A teaching assignment changed in your Relief Society calendar.',
    '',
    lines.join('\n'),
    '',
    'Open the calendar: https://crcummings04.github.io/relief-society-calendar/',
    '',
    `Updated: ${state.updatedAt || new Date().toISOString()}`
  ].join('\n');
  MailApp.sendEmail(email, subject, body);
}

function formatDate(dateText) {
  const date = new Date(dateText + 'T00:00:00');
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'America/Denver', 'EEE, MMM d, yyyy');
}

function jsonOutput(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
