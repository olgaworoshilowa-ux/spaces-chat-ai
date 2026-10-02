import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

const TOKEN_CSS_PATH = join(
  process.cwd(),
  "public",
  "spaces-static",
  "assets",
  "css",
  "tokens.css",
);

export async function GET() {
  const css = await readFile(TOKEN_CSS_PATH, "utf8");

  return new Response(css, {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
      "Content-Type": "text/css; charset=utf-8",
    },
  });
}
