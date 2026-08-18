# Crime & Recent Activity Page Design

## Goal

Add a dedicated `/crime` page to the Winnipeg Neighbourhood & Resource Map. The page will make official Winnipeg Police Service crime and calls-for-service information easy to find without presenting preliminary activity as verified crime or implying that generalized events occurred at a specific property.

## Page structure

- Add a “Crime & recent activity” link to the shared top navigation.
- Remove the inactive crime-metric buttons from the service-location map.
- Replace the property context’s external WPS link with a link to `/crime`.
- Give `/crime` its own title, description and social metadata.
- Lead with two clearly separated explanations:
  - Verified crimes: updated monthly with an approximately two-month reporting delay.
  - Calls for service: updated weekly and covering the preceding ten weeks; preliminary and not equivalent to confirmed crime.
- Embed the official WPS Crime and Calls for Service ArcGIS dashboard as the primary interactive surface.
- Provide a prominent fallback button that opens the official dashboard in a new tab when embedding is blocked, slow or unsuitable for a small screen.
- Include plain-language privacy and interpretation guidance immediately below the dashboard.

## Data and privacy

The application will not copy, transform, cache or claim ownership of WPS crime data. The official dashboard remains the data source and controls its own filters and updates. The resource site will not pass the private property label or map pin to WPS. WPS locations are generalized, and the page will not describe them as exact incident addresses.

## Failure handling

The page must remain useful if the third-party dashboard cannot load. Introductory guidance, update schedules, the official-source link, emergency guidance and non-emergency police contact information will render independently of the embed.

## Accessibility and responsive behavior

The embedded dashboard will have a descriptive title. The surrounding page will use headings, concise definitions and keyboard-accessible links. On narrow screens, the embed will use a taller viewport and the page will recommend opening the official dashboard for its full mobile experience.

## Validation

- Route tests will confirm `/crime` renders its own metadata, verified-crime guidance, calls-for-service guidance, privacy warning and official WPS dashboard link.
- Existing route tests will confirm the misleading metric controls are absent from the resource map and the new navigation link is present.
- The full directory validation, confidential-location checks, lint and production build must continue to pass before private publication.
