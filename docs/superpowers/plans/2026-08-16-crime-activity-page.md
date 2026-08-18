# Crime & Recent Activity Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `/crime` page that presents the official Winnipeg Police Service crime and calls-for-service dashboard with accurate update and privacy guidance.

**Architecture:** Keep WPS as the authoritative data owner by embedding its ArcGIS dashboard instead of copying police data. Add a server-rendered route with independent metadata, reuse the existing brand shell, and route all crime-related navigation away from the service map to the new page.

**Tech Stack:** Next.js-compatible vinext routes, React server components, CSS, Node test runner, Sites hosting.

## Global Constraints

- Do not store, transform or represent WPS data as application-owned data.
- Do not pass property labels or coordinates to WPS.
- Distinguish verified monthly crime data from preliminary weekly calls for service.
- Describe locations as generalized, never exact incident addresses.
- Preserve confidential service-location protections and all existing directory behavior.

---

### Task 1: Route contract and navigation regression

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Create: `app/crime/page.tsx`

**Interfaces:**
- Consumes: the vinext worker route handler exposed from `dist/server/index.js`.
- Produces: an HTML response for `/crime` containing a page-specific title, WPS dashboard URL, update schedules and privacy language.

- [ ] **Step 1: Write the failing route test**

Extend the render helper to accept a path. Add an assertion that `/crime` returns status 200 and includes “Crime & Recent Activity”, “updated monthly”, “previous 10 weeks”, “generalized”, and `https://wps-crime-calls-for-service-wpsgis.hub.arcgis.com/`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL because `/crime` does not exist.

- [ ] **Step 3: Create the route**

Create `app/crime/page.tsx` as a server component. Export page-specific metadata, render the common brand header, emergency guidance, two explanatory cards, a titled iframe using the official WPS dashboard URL, a new-tab fallback link, and privacy/interpretation guidance.

- [ ] **Step 4: Run the route test**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: PASS.

### Task 2: Remove misleading controls and connect navigation

**Files:**
- Modify: `app/components/ResourceExplorer.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `/crime` route.
- Produces: a resource map with no inactive crime metrics and links to the dedicated page from the header and property context.

- [ ] **Step 1: Write the failing regression assertions**

Assert the root page includes `href="/crime"` and no longer contains the four inactive crime metric labels.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: FAIL because the root still renders inactive controls.

- [ ] **Step 3: Implement the minimal navigation change**

Remove `CrimeMetric` and its state from `ResourceExplorer`. Add “Crime & recent activity” to the top navigation. Replace the map controls with a concise link to `/crime`, and route property context to `/crime` without including address or coordinate query parameters.

- [ ] **Step 4: Run the route tests**

Run: `npm run build && node --test tests/rendered-html.test.mjs`

Expected: PASS.

### Task 3: Responsive page styling and full validation

**Files:**
- Modify: `app/globals.css`
- Test: `tests/directory.test.ts`
- Test: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: the semantic class names emitted by `/crime`.
- Produces: a responsive embedded-dashboard page consistent with the directory design.

- [ ] **Step 1: Add focused styles**

Add layout rules for the crime hero, update cards, dashboard frame, fallback link and guidance. Use a minimum iframe height of 720px on desktop and 780px on narrow screens. Preserve keyboard focus indicators and existing breakpoints.

- [ ] **Step 2: Run full verification**

Run: `npm run lint && npm test`

Expected: lint exits 0; all directory tests, production build and rendered-route tests pass.

- [ ] **Step 3: Package and publish privately**

Commit and push the exact validated source, package the successful build with the Sites helper, save a new version, deploy it with owner-only access, and confirm the deployment succeeds before opening `/crime`.
