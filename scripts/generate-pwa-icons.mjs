import fs from "node:fs";
import sharp from "sharp";

fs.mkdirSync("public/icons", { recursive: true });

function iconSvg(size) {
  const radius = Math.round(size * 0.22);
  const titleSize = Math.round(size * 0.31);
  const subtitleSize = Math.round(size * 0.07);
  const titleSpacing = -Math.round(size * 0.015);
  const subtitleSpacing = Math.round(size * 0.006);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${radius}" fill="#0B1B3A"/>
    <text x="50%" y="44%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="900" fill="#FFFFFF" letter-spacing="${titleSpacing}">C.Y</text>
    <text x="50%" y="63%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${subtitleSize}" font-weight="800" fill="#FFFFFF" letter-spacing="${subtitleSpacing}">REALESTATE</text>
  </svg>`;
}

await Promise.all(
  [192, 512].map((size) =>
    sharp(Buffer.from(iconSvg(size)))
      .png()
      .toFile(`public/icons/cy-app-icon-${size}.png`),
  ),
);

console.log("PWA icons created");
