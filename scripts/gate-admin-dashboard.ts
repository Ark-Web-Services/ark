// Static admin assets are never safe to deploy: middleware cannot protect files
// served directly by the CDN. Runtime admin/API routes have their own bearer gate.

import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const DIST_DIRS = [join(process.cwd(), "dist", "admin"), join(process.cwd(), "dist", "_admin")];
for (const directory of DIST_DIRS) {
  if (!existsSync(directory)) continue;
  rmSync(directory, { recursive: true, force: true });
  console.log(`Stripped static admin assets from deployable output: ${directory}`);
}
