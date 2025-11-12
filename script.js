const serviceKey = "6c712922ba179a63f752341c8e77729a92a493a01169e4c73de1d90c110b0d6c"; // 디코딩된 키

document.getElementById("searchBtn").addEventListener("click", async () => {
  const address = document.getElementById("addressInput").value.trim();
  if (!address) return alert("주소를 입력해주세요.");

  document.getElementById("basicInfo").textContent = "조회 중...";
  document.getElementById("floorInfo").textContent = "-";
  document.getElementById("violationInfo").textContent = "-";

  try {
    const regionCode = await getRegionCode(address);
    if (!regionCode) throw new Error("법정동 코드 조회 실패");

    const sigunguCd = regionCode.substring(0, 5);
    const bjdongCd = regionCode.substring(5, 10);
    const { bun, ji } = parseAddress(address);

    const basic = await getAPI("getBrTitleInfo", sigunguCd, bjdongCd, bun, ji);
    const floor = await getAPI("getBrFlrOulnInfo", sigunguCd, bjdongCd, bun, ji);
    const viol = await getAPI("getBrViolationInfo", sigunguCd, bjdongCd, bun, ji);

    if (!basic) throw new Error("건축물대장 데이터 없음");

    document.getElementById("basicInfo").textContent =
      `사용승인일자: ${basic.useAprDay || "-"}\n` +
      `연면적: ${basic.totArea || "-"}㎡\n` +
      `주용도: ${basic.mainPurpsCdNm || "-"}\n` +
      `지상층: ${basic.grndFlrCnt || "-"}층\n` +
      `지하층: ${basic.ugrndFlrCnt || "-"}층\n` +
      `주차대수: ${basic.parkingCnt || "-"}대`;

    document.getElementById("floorInfo").textContent = floor?.length
      ? floor.map(f => `${f.flrNm} (${f.strctCdNm}, ${f.area}㎡)`).join("\n")
      : "층별 정보 없음";

    document.getElementById("violationInfo").textContent =
      viol?.[0]?.violtCont || "?";

  } catch (err) {
    document.getElementById("basicInfo").textContent = `❌ 오류: ${err.message}`;
  }
});

function parseAddress(address) {
  const m = address.match(/(\d+)(?:-(\d+))?/);
  return { bun: m?.[1]?.padStart(4, "0") || "0000", ji: m?.[2]?.padStart(4, "0") || "0000" };
}

async function getRegionCode(address) {
  const m = address.match(/(.+구)\s*(.+동)/);
  if (!m) return null;
  const [, gu, dong] = m;
  const query = encodeURIComponent(`${dong}`);
  const url = `https://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList?serviceKey=${serviceKey}&pageNo=1&numOfRows=1&type=json&locatadd_nm=${query}`;
  const res = await fetch(url);
  const json = await res.json();
  return json?.StanReginCd?.[0]?.region_cd || null;
}

async function getAPI(type, sigunguCd, bjdongCd, bun, ji) {
  const url = `https://apis.data.go.kr/1613000/BldRgstHubService/${type}?serviceKey=${serviceKey}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&platGbCd=0&bun=${bun}&ji=${ji}&_type=json`;
  const res = await fetch(url);
  const data = await res.json();
  const item = data?.response?.body?.items?.item;
  return Array.isArray(item) ? item[0] : item;
}
