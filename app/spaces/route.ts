import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

const SPACES_STATIC_BASE_PATH = "/spaces-static";
const SPACES_HTML_PATH = join(
  process.cwd(),
  "public",
  "spaces-static",
  "get-started_spaces.html",
);

function rewriteAssetPaths(html: string) {
  return html
    .replaceAll("./assets/", `${SPACES_STATIC_BASE_PATH}/assets/`)
    .replaceAll("./s/", `${SPACES_STATIC_BASE_PATH}/s/`);
}

export async function GET() {
  const html = await readFile(SPACES_HTML_PATH, "utf8");

  return new Response(rewriteAssetPaths(html), {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
