import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Render the supplied artwork at browser icon sizes; keep the source PNG intact.
export async function renderBrandIcon(size: number, background = "transparent", padding = 0) {
  const artwork = await readFile(join(process.cwd(), "public/logos/Logo icon.png"));
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background }}>
      {/* ImageResponse renders this locally into a PNG. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${artwork.toString("base64")}`} alt="" width={size - padding * 2} height={size - padding * 2} />
    </div>,
    { width: size, height: size },
  );
}
