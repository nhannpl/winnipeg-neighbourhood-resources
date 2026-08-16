import type { Metadata } from "next";

import { ResourceExplorer } from "./components/ResourceExplorer";
import { directoryData } from "./lib/services";

export const metadata: Metadata = {
  title: "Winnipeg Neighbourhood & Resource Map",
  description: "Search verified Winnipeg community services across 20 topics and explore public resources near a property pin.",
};

export default function Home() {
  return <ResourceExplorer data={directoryData} />;
}
