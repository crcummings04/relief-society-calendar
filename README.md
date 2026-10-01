# Relief Society Teaching Calendar

Live site: https://crcummings04.github.io/relief-society-calendar/

The calendar starts Sunday, October 11, 2026 and defaults to Avery, Morgan, Allie, and Relief Society Presidency. It includes mobile editing, custom teacher changes, lesson topics, preparation notes, statuses for combined/cancelled/skipped Sundays, change history, undo, snapshot sharing, printing/PDF, Google Calendar links, and `.ics` export.

## Optional live shared editing and email notifications

The GitHub Pages site works by itself in private browser mode. To make edits sync for all teachers and email you when a teacher changes:

1. Open [Google Apps Script](https://script.google.com/) and create a new project.
2. Copy the contents of `google-apps-script.gs` into the project and save it.
3. Deploy > New deployment > Web app.
4. Set “Execute as” to your account and “Who has access” to “Anyone,” then deploy and copy the web-app URL.
5. On the calendar, open Settings and paste that URL into “Shared sync URL.” Enter the email address for notifications and save.
6. Use “Copy share link” and send that link to the teachers. The link carries the shared endpoint, so their changes can sync to the same calendar.

The Apps Script stores the calendar state in Script Properties and sends an email when an assignment changes. The first save establishes the shared state; later teacher changes generate notifications.
