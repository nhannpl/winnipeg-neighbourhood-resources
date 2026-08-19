import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const clientDir = path.resolve("dist/client");
const manifestPath = path.join(clientDir, "vinext-client-entry-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const entryFile = manifest.appBrowserEntry;

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#07111f" />
    <link rel="icon" href="./favicon.svg" />
    <title>Winnipeg Neighbourhood & Resource Map</title>
    <script type="module" src="./${entryFile}"></script>
  </head>
  <body>
    <div id="__next"></div>
  </body>
</html>
`;

await mkdir(clientDir, { recursive: true });
await writeFile(path.join(clientDir, "index.html"), html);
