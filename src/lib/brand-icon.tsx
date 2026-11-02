import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Render the supplied artwork at browser icon sizes; keep the source PNG intact.
// The artwork carries its own margin. `zoom` trims some of it for tiny icons
// (the browser tab), where every pixel of the gear counts.
export async function renderBrandIcon(size: number, background = "transparent", zoom = 1) {
  const artwork = await readFile(join(process.cwd(), "public/logos/icon-transparent.png"));
  const drawn = Math.round(size * zoom);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background }}>
      {/* ImageResponse renders this locally into a PNG. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${artwork.toString("base64")}`} alt="" width={drawn} height={drawn} />
    </div>,
    { width: size, height: size },
  );
}
