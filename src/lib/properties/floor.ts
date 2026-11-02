export function formatCurrentFloor(floor: string | null) {
  if (!floor?.trim()) return "-";

  const normalized = floor.trim();
  const basement = normalized.match(/(?:^|\s)B\s*(\d+)\s*층?/i);
  if (basement) return `B${basement[1]}층`;

  const koreanBasement = normalized.match(/지하\s*(\d+)\s*층?/);
  if (koreanBasement) return `B${koreanBasement[1]}층`;

  const current = normalized.match(/(\d+)\s*층?/)?.[1];
  return current ? `${current}층` : normalized;
}
