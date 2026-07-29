import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "C.Y 부동산",
    short_name: "C.Y 부동산",
    description: "송파구 사무실·상가 전문 C.Y 부동산",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0B1B3A",
    icons: [
      {
        src: "/icons/cy-app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/cy-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
