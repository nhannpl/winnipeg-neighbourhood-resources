import type { Metadata } from "next";
import Link from "next/link";

const WPS_DASHBOARD = "https://wps-crime-calls-for-service-wpsgis.hub.arcgis.com/";

export const metadata: Metadata = {
  title: "Crime & Recent Activity | Winnipeg Neighbourhood Map",
  description: "Explore official Winnipeg Police Service crime and calls-for-service information, with clear update schedules and privacy limits.",
  openGraph: {
    title: "Crime & Recent Activity | Winnipeg Neighbourhood Map",
    description: "Official WPS crime and calls-for-service context for Winnipeg neighbourhoods.",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "Crime & Recent Activity | Winnipeg Neighbourhood Map",
    description: "Official WPS crime and calls-for-service context for Winnipeg neighbourhoods.",
    images: [],
  },
};

export default function CrimePage() {
  return (
    <main className="app-shell crime-page" id="top">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Winnipeg Neighbourhood and Resource Map home">
          <span className="brand-mark">W</span>
          <span><strong>Winnipeg</strong><small>Neighbourhood & resource map</small></span>
        </Link>
        <nav className="topbar-actions" aria-label="Primary navigation">
          <Link href="/">Community resources</Link>
          <Link href="/crime" aria-current="page">Crime & recent activity</Link>
        </nav>
      </header>

      <section className="crime-hero">
        <div>
          <p className="eyebrow">Official neighbourhood information</p>
          <h1>Crime & Recent Activity</h1>
          <p>Explore information published and maintained by the Winnipeg Police Service. The two datasets below have different meanings and update schedules.</p>
        </div>
        <a className="crime-source-link" href={WPS_DASHBOARD} target="_blank" rel="noreferrer">Open the official WPS dashboard ↗</a>
      </section>

      <section className="crime-update-grid" aria-label="How the police data is updated">
        <article>
          <span className="crime-data-icon">✓</span>
          <div><p className="eyebrow">Verified crimes</p><h2>Updated monthly</h2><p>Crime reports appear after verification, with an approximately two-month reporting delay.</p></div>
        </article>
        <article>
          <span className="crime-data-icon activity">↻</span>
          <div><p className="eyebrow">Calls for service</p><h2>Reviewed weekly</h2><p>Shows the previous 10 weeks of dispatched and reported activity. A call for service is not necessarily a confirmed crime.</p></div>
        </article>
      </section>

      <section className="crime-dashboard-section" aria-labelledby="dashboard-title">
        <div className="crime-dashboard-heading">
          <div><p className="eyebrow">Winnipeg Police Service</p><h2 id="dashboard-title">Interactive crime and calls-for-service dashboard</h2></div>
          <p>Use the dashboard’s tabs and filters to choose a neighbourhood, time period and activity category.</p>
        </div>
        <div className="crime-dashboard-frame">
          <iframe
            src={WPS_DASHBOARD}
            title="Official Winnipeg Police Service crime and calls-for-service dashboard"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <p className="crime-dashboard-fallback">If the dashboard does not load or is difficult to use on your device, <a href={WPS_DASHBOARD} target="_blank" rel="noreferrer">open the official full-screen version</a>.</p>
      </section>

      <section className="crime-guidance" aria-labelledby="crime-guidance-title">
        <div><p className="eyebrow">Read with care</p><h2 id="crime-guidance-title">Generalized locations, not property predictions</h2></div>
        <div>
          <p>Winnipeg Police deliberately limits event locations to generalized areas to protect privacy. The map does not show exact incident addresses.</p>
          <p>Historical activity does not predict what will happen at a property. Community services and nearby supports are never used to calculate a safety score.</p>
        </div>
      </section>

      <section className="emergency-banner crime-emergency" aria-labelledby="crime-emergency-title">
        <span className="emergency-icon">!</span>
        <div><strong id="crime-emergency-title">Need police assistance?</strong><span>For an emergency or crime in progress, call 911. For non-emergency police assistance, call 204-986-6222.</span></div>
        <a href="tel:911">Call 911</a>
      </section>

      <footer>
        <div><strong>Winnipeg Neighbourhood & Resource Map</strong><span>Independent public-information project</span></div>
        <p>Police information is displayed from the official WPS source.</p>
        <p><Link href="/">Return to community resources</Link></p>
      </footer>
    </main>
  );
}
