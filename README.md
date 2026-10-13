# SupportKit — IT support, made clearer

A complete, responsive IT support website created by **Shadab Iqbal**. Built with HTML, CSS, and vanilla JavaScript. No build step, npm install, API keys, CDN scripts, or hosted database is required.

This is a working extension of the toolkit concept in the MSIS internship report. It does not claim the toolkit was deployed at the internship organization.

## Deploy on GitHub Pages

1. Extract `it-support-toolkit-source.zip` on your computer.
2. Create a GitHub repository, for example `it-support-toolkit`. A public repository is the simplest option for GitHub Pages on GitHub Free. Verify your plan if you want a private repository. The published website is ordinarily public.
3. Upload **the contents of the extracted `it-support-toolkit` folder** to the repository root. `index.html` must be at the top level, alongside `styles.css`, `js/`, and `assets/`. Do not upload only the ZIP, and do not put everything inside another nested folder. Keep `.nojekyll` if you upload with Git.
4. In the repository, open **Settings → Pages**.
5. Under **Build and deployment**, set **Source → Deploy from a branch**.
6. Select **main** and **/(root)**, then save.
7. Wait for GitHub to finish publishing. Open the URL shown by GitHub Pages, typically `https://YOUR-USERNAME.github.io/it-support-toolkit/`.

Relative asset links and hash-based navigation support a repository subdirectory. There is no environment configuration or build command. Updates to the publishing branch update the website.

Official instructions: <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>

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

## Customize

- Change creator information in `index.html` and the `about()` function in `js/app.js`.
- Edit `js/data.js` to add or review articles and command references. Each guide has a stable ID, slug, category, employee steps, escalation advice, technician notes, and optional primary-source links.
- Set your verified support email through the app’s settings. This setting applies only to your browser; it is not a deployment-wide default.
- To ship organization-wide default preferences, edit `emptyState()` in `js/core.js`. Users’ existing saved preferences remain until cleared or changed. Keep credentials out of this file.
- Change CSS variables at the start of `styles.css` to adjust the palette.
- Assign article owners and review dates before organizational rollout. The shipped content is reference guidance, not approved employer policy.

## Suggested priority matrix

| Affected scope | Workaround available | Work blocked | Critical work blocked |
| --- | --- | --- | --- |
| One person | P4 | P3 | P2 |
| Team / shared area | P3 | P2 | P1 |
| Organization | P2 | P1 | P1 |

This is a suggestion only. An organization’s incident and security policies override it. P1 does not trigger notifications.

## Checks

Optional checks require Node.js 18 or later; no packages need to be installed:

```bash
npm run check
npm test
```

Automated checks cover subnet boundaries (/0, /31, /32), invalid input, priority mapping, status transitions, validated backups, escaped content, CSV formula protection, derived counts, diagnostic path integrity, relative assets, and page rendering with a DOM test double. A DOM test double is not an interactive browser test.

Interactive browser QA was unavailable in the creation environment. Before submission or organizational use, verify these in a real browser:

1. Search/filter/save a guide and navigate back to it.
2. Follow a diagnosis path, go back, restart, and prepare its request.
3. Save a request, update its status, require a resolution note, and reopen it.
4. Copy/download a request and export CSV; verify email drafts if configured.
5. Toggle request persistence, reload, and confirm the documented behavior.
6. Export/import a backup, reject a malformed file, and cancel replacement/deletion.
7. Use the app on a narrow mobile screen; use Tab, Enter, Space, Escape, and `/` to search.
8. Print a guide and inspect the print preview. Expand the technician supplement before printing if you want it included.

No real employer or employee data is bundled. The MIT license covers the supplied source code; external documentation remains owned by its publishers.
