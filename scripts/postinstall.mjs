import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const source = new URL("../vendor/image-size-safe/", import.meta.url);
const target = new URL("../node_modules/image-size/", import.meta.url);

await rm(target, { recursive: true, force: true });
await mkdir(path.dirname(target.pathname), { recursive: true });
await cp(source, target, { recursive: true });
