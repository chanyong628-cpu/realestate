export function formatCurrentFloor(floor: string | null) {
  if (!floor?.trim()) return "-";

  const normalized = floor.trim();
  const basement = normalized.match(/(?:^|\s)B\s*(\d+)\s*층?/i);
  if (basement) return `지하${basement[1]}층`;

  const koreanBasement = normalized.match(/지하\s*(\d+)\s*층?/);
  if (koreanBasement) return `지하${koreanBasement[1]}층`;

  const negativeBasement = normalized.match(/(?:^|\s)-\s*(\d+)\s*층?/);
  if (negativeBasement) return `지하${negativeBasement[1]}층`;

  const room = normalized.match(/(\d{3,})\s*호/)?.[1];
  if (room) {
    const roomFloor = Number(room.slice(0, -2));
    if (roomFloor > 0) return `${roomFloor}층`;
  }

  const current = normalized.match(/(\d+)\s*층?/)?.[1];
  return current ? `${current}층` : normalized;
}
