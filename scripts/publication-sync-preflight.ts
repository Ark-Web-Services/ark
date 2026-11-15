import { runPublicationPreflight } from "./lib/publication-sync";

try {
  const baseSha = runPublicationPreflight();
  console.log("GitHub/Gitea publication preflight passed for " + process.env.PROMOTION_BRANCH + " at " + baseSha + ".");
} catch (error) {
  console.error("Content publication preflight failed: " + (error as Error).message);
  process.exitCode = 1;
}
