const BASEMENT_PREFIX = "(?:B|b|지하|지)?";

function floorEnd(prefix: string | undefined, digits: string) {
  const basement = Boolean(prefix?.trim());
  return `${basement ? "B" : ""}${Number(digits)}`;
}

/**
 * 여러 층을 한 번에 임대하는 표기를 "3~4층", "B1~7층" 형태로 통일한다.
 * 인식 예: 3~4층 / 3층~4층 / 3,4층 / 3층,4층 / 2,3,4층 / B1~7층 / B1층~7층 / B1층~7층 통임대
 * 한 개 층이거나 이어지지 않는 층이면 null.
 */
export function normalizeFloorRange(text: string | null | undefined) {
  if (!text) return null;

  const range = text.match(
    new RegExp(
      `(${BASEMENT_PREFIX})\\s*(\\d+)\\s*층?\\s*[~∼～]\\s*(${BASEMENT_PREFIX})\\s*(\\d+)\\s*층`,
    ),
  );
  if (range) {
    return `${floorEnd(range[1], range[2])}~${floorEnd(range[3], range[4])}층`;
  }

  const list = text.match(
    /(?:\d+\s*층?\s*[,，、]\s*)+\d+\s*층/,
  );
  if (list) {
    const numbers = (list[0].match(/\d+/g) ?? []).map(Number);
    const consecutive = numbers.every(
      (value, index) => index === 0 || value === numbers[index - 1] + 1,
    );
    if (numbers.length >= 2 && consecutive) {
      return `${numbers[0]}~${numbers[numbers.length - 1]}층`;
    }
  }

  return null;
}

export function formatCurrentFloor(floor: string | null) {
  if (!floor?.trim()) return "-";

  const normalized = floor.trim();
  const floorRange = normalizeFloorRange(normalized);
  if (floorRange) return floorRange;

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
