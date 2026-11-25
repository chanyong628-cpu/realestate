// 관리자 모바일 목록(매물 관리·매물장 DB)이 함께 쓰는 표기 규칙.
export interface AdminListSource {
  title: string;
  private_address: string | null;
  public_address: string | null;
  floor: string | null;
  private_memo: string | null;
  deposit: number | null;
  monthly_rent: number | null;
  maintenance_fee: number | null;
  exclusive_area: number | null;
}

export function money(value: number | null) {
  return value === null ? "-" : value.toLocaleString("ko-KR");
}

export function pyeong(area: number | null) {
  if (area === null) return "-";
  const value = Number((area / 3.3058).toFixed(1));
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}평`;
}

export function exactFloor(property: Pick<AdminListSource, "private_memo" | "floor">) {
  const folderLine = (property.private_memo ?? "")
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("Google Drive 폴더명:"));
  return folderLine?.match(/(?:B\d+층(?:전체|일부)?|\d+층(?:전체|일부)?|\d+호)/i)?.[0] ?? property.floor ?? "-";
}

export function memoValue(property: Pick<AdminListSource, "private_memo">, prefix: string) {
  const line = (property.private_memo ?? "")
    .split(/\r?\n/)
    .find((item) => item.trim().startsWith(prefix));
  return line ? line.trim().slice(prefix.length).trim() : "";
}

// 모바일 제목: 동 + 지번 + 건물명(없으면 생략) + 층수. "서울특별시 송파구" 같은 앞부분은 뺀다.
export function mobileTitle(property: AdminListSource) {
  const trimmed = (property.private_address || property.public_address || property.title)
    .replace(/^(서울특별시|서울시|서울)\s*/, "")
    .replace(/^\S+구\s+/, "");
  const address = trimmed.match(/^\S*?(?:동|가|리|로|길)\s*\d+(?:-\d+)?/)?.[0] ?? trimmed;
  const building = memoValue(property, "건물명:");
  const floor = exactFloor(property);
  return [
    address,
    building && !address.includes(building) ? building : "",
    floor !== "-" && !address.includes(floor) ? floor : "",
  ].filter(Boolean).join(" ");
}

export function mobilePriceLine(property: AdminListSource) {
  const fee = property.maintenance_fee !== null ? ` ${money(property.maintenance_fee)}` : "";
  return `${money(property.deposit)} / ${money(property.monthly_rent)}${fee}`;
}

export function mobileAreaLine(property: AdminListSource) {
  return `실 ${pyeong(property.exclusive_area)}`;
}

// 관리자가 직접 적은 메모만 돌려준다(폴더명·건물명 같은 자동 기록 줄은 뺀다).
export function managerMemo(value: string | null) {
  return (value ?? "")
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return !trimmed.startsWith("Google Drive 폴더명:") && !trimmed.startsWith("건물명:");
    })
    .join("\n")
    .trim();
}
