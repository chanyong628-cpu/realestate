export function derivePublicAddress(address: string) {
  const normalized = address
    .replace(/^서울(?:특별시)?\s*/g, "")
    .replace(/^송파구\s*/g, "")
    .trim();
  const dong = normalized.match(/([가-힣0-9]+동)(?=\s*\d|\s|,|$)/)?.[1];
  if (!dong) return "";
  return `송파구 ${dong}`;
}

export function normalizeSongpaAddress(address: string) {
  const normalized = address
    .replace(/[()]/g, " ")
    .replace(/[－–—]/g, "-")
    .replace(/번지/g, "")
    .replace(/,\s*.*$/g, "")
    .replace(/\s+(?:지하\s*)?\d+\s*층.*$/g, "")
    .replace(/\s+\d+\s*호.*$/g, "")
    .replace(/([동읍면])(\d)/g, "$1 $2")
    .replace(/^서울(?:특별시)?\s*/g, "")
    .replace(/^송파구\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const parcelMatch = normalized.match(
    /([가-힣0-9]+동)\s*((?:산\s*)?\d+(?:-\d+)?)/,
  );
  if (parcelMatch) {
    return `서울특별시 송파구 ${parcelMatch[1]} ${parcelMatch[2].replace(/\s+/g, " ")}`;
  }

  return normalized ? `서울특별시 송파구 ${normalized}` : "";
}
