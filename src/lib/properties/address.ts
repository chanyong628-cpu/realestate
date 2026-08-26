const hiddenAddressPrefix = "__CY_ADDRESS_HIDDEN__:";

export function derivePublicAddress(address: string) {
  const normalized = address
    .replace(/^서울(?:특별시)?\s*/g, "")
    .replace(/^송파구\s*/g, "")
    .trim();
  const dong = normalized.match(/([가-힣0-9]+동)(?=\s*\d|\s|,|$)/)?.[1];
  if (!dong) return "";
  return `송파구 ${dong}`;
}

export function isStoredAddressHidden(address: string | null | undefined) {
  return address?.startsWith(hiddenAddressPrefix) ?? false;
}

export function buildStoredPublicAddress(
  privateAddress: string,
  isAddressHidden: boolean,
) {
  const exactAddress = privateAddress.trim();
  if (!isAddressHidden) return exactAddress;

  const neighborhood = derivePublicAddress(exactAddress);
  return `${hiddenAddressPrefix}${neighborhood}`;
}

export function resolvePublicAddress(
  storedAddress: string | null | undefined,
  privateAddress: string | null | undefined,
) {
  if (isStoredAddressHidden(storedAddress)) {
    const neighborhood = storedAddress?.slice(hiddenAddressPrefix.length).trim();
    return neighborhood || derivePublicAddress(privateAddress ?? "");
  }

  return privateAddress?.trim() || storedAddress?.trim() || "";
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
