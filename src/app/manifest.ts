import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rebuild Auto Group",
    short_name: "RAG",
    start_url: "/search",
    display: "standalone",
    background_color: "#F5F7FA",
    theme_color: "#F5F7FA",
    icons: [{ src: "/app-icon", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
