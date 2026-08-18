"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type LType from "leaflet";

import { distanceKm, filterPrograms, summarizeFreshness } from "../lib/directory";
import type { Coordinate, DirectoryData, Program, ServiceLocation, ServiceMethod, Topic } from "../lib/types";

type Tab = "map" | "directory";
const topicGroups: Array<{ label: string; topics: Topic[] }> = [
  { label: "Urgent & essential", topics: ["Emergency / Crisis", "Mental Health / Addictions", "Homelessness", "Food / Basic Needs", "Housing"] },
  { label: "People & identity", topics: ["Youth / Young Adults", "Older Adults", "2SLGBTQ+", "Indigenous", "Newcomers", "Parenting"] },
  { label: "Daily life", topics: ["Health", "Accessibility", "Income Support", "Employment / Training", "Education", "Consumer Debt Services"] },
  { label: "Rights & belonging", topics: ["Victim Support", "Legal Advocacy", "Community and Culture"] },
];

const topicColors: Partial<Record<Topic, string>> = {
  "Emergency / Crisis": "#c4473e",
  "Mental Health / Addictions": "#855384",
  Homelessness: "#d27731",
  Housing: "#b9912f",
  Health: "#24766f",
  Indigenous: "#9c592d",
  "Youth / Young Adults": "#3c6d96",
  "2SLGBTQ+": "#9f5077",
};

const markerColor = (program: Program) => topicColors[program.topics[0]] ?? "#355f5a";
const getLocation = (id: string, locations: ServiceLocation[]) => locations.find((item) => item.programId === id);
const phoneHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

export function ResourceExplorer({ data }: { data: DirectoryData }) {
  const [tab, setTab] = useState<Tab>("map");
  const [query, setQuery] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [method, setMethod] = useState<ServiceMethod | "All">("All");
  const [freeOnly, setFreeOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addressLabel, setAddressLabel] = useState("");
  const addressLabelRef = useRef("");
  const [pinInstruction, setPinInstruction] = useState("");
  const [propertyPin, setPropertyPin] = useState<(Coordinate & { label: string }) | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapNode = useRef<HTMLDivElement>(null);
  const leaflet = useRef<typeof LType | null>(null);
  const map = useRef<LType.Map | null>(null);
  const resourceLayer = useRef<LType.LayerGroup | null>(null);
  const propertyMarker = useRef<LType.Marker | null>(null);

  const filtered = useMemo(() => filterPrograms(data.programs, { query, topics, method, freeOnly }), [data.programs, query, topics, method, freeOnly]);
  const selected = data.programs.find((program) => program.id === selectedId) ?? null;
  const selectedLocation = selected ? getLocation(selected.id, data.locations) : undefined;
  const freshness = summarizeFreshness(data.programs, new Date("2026-08-16T12:00:00Z"));
  const topicCount = new Set(data.programs.flatMap((program) => program.topics)).size;

  const results = useMemo(() => {
    if (!propertyPin) return filtered;
    return [...filtered].sort((a, b) => {
      const aLoc = getLocation(a.id, data.locations);
      const bLoc = getLocation(b.id, data.locations);
      const aDistance = aLoc?.latitude !== undefined && aLoc.longitude !== undefined ? distanceKm(propertyPin, { latitude: aLoc.latitude, longitude: aLoc.longitude }) : Infinity;
      const bDistance = bLoc?.latitude !== undefined && bLoc.longitude !== undefined ? distanceKm(propertyPin, { latitude: bLoc.latitude, longitude: bLoc.longitude }) : Infinity;
      return aDistance - bDistance;
    });
  }, [filtered, propertyPin, data.locations]);

  useEffect(() => { addressLabelRef.current = addressLabel; }, [addressLabel]);

  useEffect(() => {
    if (!mapNode.current || map.current) return;
    let cancelled = false;
    let instance: LType.Map | null = null;
    void import("leaflet").then(({ default: L }) => {
      if (cancelled || !mapNode.current) return;
      leaflet.current = L;
      instance = L.map(mapNode.current, { zoomControl: false }).setView([49.8954, -97.1385], 12);
      L.control.zoom({ position: "bottomright" }).addTo(instance);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(instance);
      resourceLayer.current = L.layerGroup().addTo(instance);
      instance.on("click", (event) => {
        const label = addressLabelRef.current.trim() || "Selected Winnipeg property";
        setPropertyPin({ latitude: event.latlng.lat, longitude: event.latlng.lng, label });
        setPinInstruction("");
      });
      map.current = instance;
      setMapReady(true);
    });
    return () => { cancelled = true; instance?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const L = leaflet.current;
    const layer = resourceLayer.current;
    if (!L || !layer) return;
    layer.clearLayers();
    filtered.forEach((program) => {
      const location = getLocation(program.id, data.locations);
      if (location?.visibility !== "Public" || location.latitude === undefined || location.longitude === undefined) return;
      const icon = L.divIcon({
        className: "marker-shell",
        html: `<span class="resource-marker" style="--marker:${markerColor(program)}"><i></i></span>`,
        iconSize: [30, 36], iconAnchor: [15, 34],
      });
      L.marker([location.latitude, location.longitude], { icon, title: program.name }).on("click", () => setSelectedId(program.id)).addTo(layer);
    });
  }, [filtered, data.locations, mapReady]);

  useEffect(() => {
    const L = leaflet.current;
    if (!L || !map.current || !propertyPin) return;
    propertyMarker.current?.remove();
    propertyMarker.current = L.marker([propertyPin.latitude, propertyPin.longitude], {
      icon: L.divIcon({ className: "property-marker-shell", html: '<span class="property-marker">⌂</span>', iconSize: [42, 42], iconAnchor: [21, 21] }),
      title: propertyPin.label,
    }).addTo(map.current);
    map.current.setView([propertyPin.latitude, propertyPin.longitude], 14);
  }, [propertyPin, mapReady]);

  function toggleTopic(topic: Topic) {
    setTopics((current) => current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]);
  }

  function preparePropertyPin(event: React.FormEvent) {
    event.preventDefault();
    setTab("map");
    setPinInstruction("For privacy, zoom to the property and click the map to place its pin.");
    map.current?.setView([49.8954, -97.1385], 12);
  }

  const visible = results.slice(0, tab === "map" ? 6 : results.length);

  return (
    <main className="app-shell" id="top">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Winnipeg Neighbourhood and Resource Map home"><span className="brand-mark">W</span><span><strong>Winnipeg</strong><small>Neighbourhood & resource map</small></span></a>
        <nav className="topbar-actions" aria-label="Primary navigation"><span className="verified-pill"><i /> Sources checked Aug 16, 2026</span><a href="/crime">Crime & recent activity</a><a href="#about">How to use</a></nav>
      </header>

      <section className="intro">
        <div><p className="eyebrow">A clearer way through Winnipeg</p><h1>Find the right support.<br />Understand the neighbourhood.</h1><p className="intro-copy">Search verified community services across 20 topics, or place a private property pin for nearby public resources and official crime-data context.</p></div>
        <div className="intro-stats"><div><strong>{data.programs.length}</strong><span>verified programs</span></div><div><strong>{topicCount}</strong><span>service topics</span></div><div><strong>{data.locations.filter((item) => item.visibility === "Public").length}</strong><span>public locations</span></div></div>
      </section>

      <section className="emergency-banner" aria-labelledby="emergency-title"><span className="emergency-icon">!</span><div><strong id="emergency-title">Emergency help</strong><span>Immediate danger: call 911. Klinic crisis support: 204-786-8686. Domestic violence crisis line: 1-877-977-0007.</span></div><a href="tel:911">Call 911</a></section>

      <section className="search-band">
        <form className="address-search" onSubmit={preparePropertyPin}><label htmlFor="address">Label a property, then place it on the map</label><div className="search-control"><span>⌖</span><input id="address" value={addressLabel} onChange={(event) => setAddressLabel(event.target.value)} placeholder="Optional private label, e.g. 510 Main" autoComplete="off" /><button type="submit">Place property pin</button></div>{pinInstruction && <p className="address-status" role="status">{pinInstruction}</p>}</form>
        <div className="privacy-note"><span>◇</span><p><strong>Private by design</strong>The label stays in this page. It is never sent to a lookup service or saved.</p></div>
      </section>

      {propertyPin && <section className="property-context"><div><span>Property context</span><strong>{propertyPin.label}</strong><small>Public services below are ordered by straight-line distance.</small></div><div><span>Crime information</span><strong>Use generalized neighbourhood context</strong><small>Your property label and pin are not sent to Winnipeg Police.</small></div><a href="/crime">View crime & recent activity →</a></section>}

      <div className="workspace">
        <aside className="filters" aria-label="Directory filters">
          <div className="filter-heading"><div><span className="eyebrow">Refine results</span><h2>What do you need?</h2></div>{topics.length > 0 && <button onClick={() => setTopics([])}>Clear</button>}</div>
          <label className="field-label" htmlFor="service-search">Search the directory</label><div className="keyword-search"><span>⌕</span><input id="service-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Service, need, or organization" /></div>
          <div className="topic-groups">{topicGroups.map((group) => <fieldset key={group.label}><legend>{group.label}</legend>{group.topics.map((topic) => <label key={topic} className={topics.includes(topic) ? "selected" : ""}><input type="checkbox" checked={topics.includes(topic)} onChange={() => toggleTopic(topic)} /><span>{topic}</span><small>{data.programs.filter((program) => program.topics.includes(topic)).length}</small></label>)}</fieldset>)}</div>
          <details className="more-filters"><summary>More filters</summary><label>Service method<select value={method} onChange={(event) => setMethod(event.target.value as ServiceMethod | "All")}><option>All</option><option>In person</option><option>Phone</option><option>Online</option><option>Mobile</option></select></label><label className="check-row"><input type="checkbox" checked={freeOnly} onChange={(event) => setFreeOnly(event.target.checked)} /> Free services only</label></details>
        </aside>

        <section className="explorer" aria-label="Resource results">
          <div className="explorer-toolbar"><div className="tabs" role="tablist"><button className={tab === "map" ? "active" : ""} onClick={() => setTab("map")} role="tab" aria-selected={tab === "map"}>Explore the map</button><button className={tab === "directory" ? "active" : ""} onClick={() => setTab("directory")} role="tab" aria-selected={tab === "directory"}>Browse directory</button></div><p><strong>{filtered.length}</strong> programs match</p></div>
          {topics.includes("Emergency / Crisis") && <div className="crisis-note"><strong>Crisis services are shown first.</strong> If someone is in immediate danger, call 911.</div>}

          {tab === "map" ? <div className="map-layout">
            <div className="map-wrap"><a className="crime-map-link" href="/crime">Crime & recent activity <span>→</span></a><div ref={mapNode} className="map" aria-label="Interactive map of public Winnipeg service locations" /><div className="map-key"><span><i className="key-service" /> Public service</span><span><i className="key-property" /> Property pin</span></div><div className="map-disclaimer"><strong>Information, not a safety score.</strong> Service proximity is never used to rate a property. Crime information is historical and does not predict what will happen at an address.</div></div>
            <div className="map-results"><div className="result-heading"><div><span className="eyebrow">{propertyPin ? "Nearest matches" : "Verified services"}</span><h2>{propertyPin ? "Near your property pin" : "Explore local support"}</h2></div><span>{visible.length} shown</span></div><div className="compact-cards">{visible.map((program) => <ProgramCard key={program.id} program={program} location={getLocation(program.id, data.locations)} compact selected={program.id === selectedId} onSelect={() => setSelectedId(program.id)} propertyPin={propertyPin} />)}</div>{visible.length === 0 && <EmptyState onClear={() => { setQuery(""); setTopics([]); }} />}</div>
          </div> : <div className="directory-view"><div className="directory-intro"><div><span className="eyebrow">Complete directory</span><h2>Support, sorted clearly</h2></div><p>One program can serve several needs. Topic tags explain every match without duplicating entries.</p></div><div className="directory-grid">{visible.map((program) => <ProgramCard key={program.id} program={program} location={getLocation(program.id, data.locations)} onSelect={() => setSelectedId(program.id)} propertyPin={propertyPin} />)}</div>{visible.length === 0 && <EmptyState onClear={() => { setQuery(""); setTopics([]); }} />}</div>}
        </section>
      </div>

      {selected && <div className="drawer-shell"><button className="drawer-backdrop" onClick={() => setSelectedId(null)} aria-label="Close service details" /><article className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button className="drawer-close" onClick={() => setSelectedId(null)} aria-label="Close service details">×</button><span className="eyebrow">Verified program</span><h2 id="detail-title">{selected.name}</h2><p className="drawer-org">{selected.organization}</p><p className="drawer-description">{selected.description}</p><div className="drawer-topics">{selected.topics.map((topic) => <span key={topic}>{topic}</span>)}</div><dl><div><dt>How to access</dt><dd>{selected.intake}</dd></div><div><dt>Who it serves</dt><dd>{selected.eligibility} · {selected.ageRange}</dd></div><div><dt>Cost</dt><dd>{selected.cost}</dd></div><div><dt>Service options</dt><dd>{selected.methods.join(" · ")}</dd></div><div><dt>Location</dt><dd>{selectedLocation?.visibility === "Public" ? selectedLocation.address : selectedLocation?.visibility === "Confidential" ? "Confidential location — call for safe access" : `${selected.serviceArea} service`}</dd></div><div><dt>Last checked</dt><dd>{selected.verifiedAt}</dd></div></dl><div className="drawer-actions"><a className="primary-action" href={phoneHref(selected.phone)}>Call {selected.phone}</a><a href={selected.website} target="_blank" rel="noreferrer">Official website ↗</a></div></article></div>}

      <section className="about" id="about"><div><span className="eyebrow">About the data</span><h2>Useful context, with clear limits.</h2></div><p>Records come from government, health-authority and provider-owned sources. Confidential shelter locations are never stored or mapped. Services change—call before visiting.</p><a href="/freshness-report.json">View source & freshness report ↗</a></section>
      <footer><div><strong>Winnipeg Neighbourhood & Resource Map</strong><span>Independent public-information project</span></div><p>{data.organizations.length} organizations · {freshness.total} programs · {freshness.dueForReverification} due for reverification</p><p>Winnipeg is located in Treaty One Territory and the National Homeland of the Red River Métis.</p></footer>
    </main>
  );
}

function ProgramCard({ program, location, compact = false, selected = false, onSelect, propertyPin }: { program: Program; location?: ServiceLocation; compact?: boolean; selected?: boolean; onSelect: () => void; propertyPin: Coordinate | null }) {
  const distance = propertyPin && location?.latitude !== undefined && location.longitude !== undefined ? distanceKm(propertyPin, { latitude: location.latitude, longitude: location.longitude }) : null;
  return <article className={`program-card ${compact ? "compact" : ""} ${selected ? "selected" : ""}`}><button className="card-main" onClick={onSelect} aria-label={`View ${program.name}`}><span className="card-icon" style={{ "--card-color": markerColor(program) } as React.CSSProperties}>{program.emergency ? "!" : "+"}</span><span className="card-copy"><span className="card-meta">{program.organization}{distance !== null ? ` · ${distance.toFixed(1)} km` : ""}</span><strong>{program.name}</strong>{!compact && <small>{program.description}</small>}<span className="tag-row">{program.topics.slice(0, compact ? 2 : 3).map((topic) => <i key={topic}>{topic}</i>)}</span></span><span className="card-arrow">›</span></button><div className="card-footer"><span>{location?.visibility === "Public" ? "● Public location" : location?.visibility === "Confidential" ? "◆ Confidential location" : "◌ Service area"}</span><a href={phoneHref(program.phone)}>Call</a></div></article>;
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return <div className="empty-state"><span>⌕</span><h3>No exact matches</h3><p>Try a broader search or remove a topic filter.</p><button onClick={onClear}>Clear filters</button></div>;
}
