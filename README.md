# SupportKit — IT support, made clearer

A complete, responsive IT support website created by **Shadab Iqbal**. Built with HTML, CSS, and vanilla JavaScript. No build step, npm install, API keys, CDN scripts, or hosted database is required.

## What works

- Overview with quick issue categories and local request counts.
- Searchable knowledge base with **10 articles**, category filtering, saved guides, and print support.
- Employee instructions and expandable technician supplements.
- **5 branching diagnosis paths**: network, account, workstation performance, printing, and applications.
- Structured request intake with original task, exact error, device ID, attempted checks, scope, and urgency.
- Suggested priority using an explicit impact/urgency matrix.
- Local request records with Draft, Investigating, Waiting, and Resolved states.
- Resolution notes required before marking a request resolved.
- Copy a request, download Markdown, export CSV, or open a configured support email.
- Dashboard category chart derived from your local requests, with no synthetic live metrics.
- **8 read-only command references**, an IPv4 subnet calculator, and **3 persistent checklists**.
- Workspace settings, optional request persistence, JSON backup/import, and local deletion controls.
- Responsive layouts, keyboard navigation, visible focus, a skip link, status announcements, reduced-motion support, and accessible input labels.

## Local preview

Open `index.html` directly for a quick look. For consistent storage and clipboard behavior, use a local web server:

```bash
cd it-support-toolkit
python -m http.server 8000
```

Then visit <http://localhost:8000>. On Windows, `py -m http.server 8000` may be the appropriate command. Stop the server with Ctrl+C.

## Important behavior

**This is a static toolkit, not a shared help desk backend.** Requests are local drafts. Creating or updating one does not notify IT, email anyone, or create a real help desk ticket. The UI states this explicitly.

- Default: requests exist in page memory and are discarded on reload. Export them before closing if needed.
- Optional: enable **Data & settings → Keep requests in this browser between visits** on a trusted device. Requests are then saved in `localStorage`.
- Bookmarks, checklists, and preferences use `localStorage` when available.
- Turning request persistence off removes the saved request copies while retaining the current in-memory session until reload.
- Browser storage is not encrypted by this app. Do not store passwords, MFA codes, confidential documents, or sensitive production incident details here.
- JSON backups contain current local records. Imports replace the workspace after validation and explicit confirmation. Limits: 10 MB and 500 requests.
- Local data is scoped to browser profile and origin. Changing domains, browsers, or profiles changes the workspace. Other unrelated apps on the same origin may be able to access browser storage.
- The support email setting adds a `mailto:` link that opens your email app with a draft. You review and send it yourself. Very large drafts may exceed your email client’s URL limit; use Markdown or copy instead.
- No login, role enforcement, device scanning, network command execution, file attachments, shared inventory, SLA monitoring, or automated notifications are implied.

For production multi-user use, add an authenticated backend or approved help desk integration, role-based access, audit records, organization-approved retention, secure handling of logs, and actual notifications. GitHub Pages cannot run that server code itself. Do not put API credentials in public JavaScript or your repository.

## Source structure

```text
it-support-toolkit/
  index.html             Entry page and app shell
  styles.css             Responsive visual design and print styles
  assets/favicon.svg     Local vector favicon
  js/data.js             Articles, diagnostic flows, commands, checklists
  js/core.js             Calculation, validation, request and export logic
  js/app.js              Routing, rendering, and interactions
  tests/core.test.cjs     Core behavior and flow integrity tests
  tests/source.test.cjs   Asset, render, and escaping checks
  package.json           Optional test commands; no dependencies
  .nojekyll              Disable GitHub Pages Jekyll processing
  .gitignore
  README.md
  SOURCES.md
  LICENSE
```

