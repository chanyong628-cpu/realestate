//--------------------------------------------------------------
// 🏢 RealEstate HUB 통합조회 script.js (최종 완성형)
//--------------------------------------------------------------

// ⚠️ 여기에 공공데이터포털 일반키 입력 (디코딩된 버전)
const serviceKey = "여기에_공공데이터포털_API키_입력";

//--------------------------------------------------------------
// [1] 조회 버튼 클릭 이벤트
//--------------------------------------------------------------
document.getElementById("searchBtn").addEventListener("click", async () => {
  const address = document.getElementById("addressInput").value.trim();
  if (!address) return alert("주소를 입력해주세요.");

  document.getElementById("basicInfo").textContent = "조회 중...";
  document.getElementById("floorInfo").textContent = "-";
  document.getElementById("violationInfo").textContent = "-";

  try {
    // 🔹 1단계: 법정동 코드 조회
    const regionCode = await getRegionCode(address);
    if (!regionCode) throw new Error("법정동 코드 조회 실패");

    const sigunguCd = regionCode.substring(0, 5);
    const bjdongCd = regionCode.substring(5, 10);
    const { bun, ji } = parseAddress(address);

    // 🔹 2단계: 건축물대장 데이터 호출
    const basic = await getAPI("getBrTitleInfo", sigunguCd, bjdongCd, bun, ji);
    const floor = await getAPI("getBrFlrOulnInfo", sigunguCd, bjdongCd, bun, ji);
    const viol = await getAPI("getBrViolationInfo", sigunguCd, bjdongCd, bun, ji);

    if (!basic) throw new Error("건축물대장 데이터가 없습니다.");

    // 🔹 3단계: 기본정보 표시
    document.getElementById("basicInfo").textContent =
      `사용승인일자: ${basic.useAprDay || "-"}\n` +
      `연면적: ${basic.totArea || "-"}㎡\n` +
      `주용도: ${basic.mainPurpsCdNm || "-"}\n` +
      `지상층: ${basic.grndFlrCnt || "-"}층\n` +
      `지하층: ${basic.ugrndFlrCnt || "-"}층\n` +
      `주차대수: ${basic.parkingCnt || "-"}대`;

    // 🔹 4단계: 층별정보 표 형식으로 표시
    if (Array.isArray(floor) && floor.length > 0) {
      const table = floor.map(f => 
        `${f.flrNm || "-"}  |  ${f.strctCdNm || "-"}  |  ${f.area || "-"}㎡`
      ).join("\n");
      document.getElementById("floorInfo").textContent = 
        `층 | 구조 | 면적(㎡)\n---------------------\n${table}`;
    } else {
      document.getElementById("floorInfo").textContent = "층별 정보 없음";
    }

    // 🔹 5단계: 위반건축물 표시
    document.getElementById("violationInfo").textContent =
      viol?.[0]?.violtCont || "위반 건축물 정보 없음";

  } catch (err) {
    console.error("오류:", err);
    document.getElementById("basicInfo").textContent = `❌ 오류: ${err.message}`;
  }
});

//--------------------------------------------------------------
// [2] 주소 → 번/지 파싱
//--------------------------------------------------------------
function parseAddress(address) {
  const m = address.match(/(\d+)(?:-(\d+))?/);
  return {
    bun: m?.[1]?.padStart(4, "0") || "0000",
    ji: m?.[2]?.padStart(4, "0") || "0000"
  };
}

//--------------------------------------------------------------
// [3] 법정동 코드 조회 (CORS 프록시 + JSON 보장)
//--------------------------------------------------------------
async function getRegionCode(address) {
  const m = address.match(/(.+구)\s*(.+동)/);
  if (!m) return null;
  const [, gu, dong] = m;
  const query = encodeURIComponent(`${dong}`);

  const baseUrl = "https://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList";
  const params = new URLSearchParams({
    serviceKey,
    pageNo: "1",
    numOfRows: "1",
    type: "json",
    locatadd_nm: query
  });

  const proxy = "https://api.allorigins.win/get?url=";
  const url = proxy + encodeURIComponent(`${baseUrl}?${params.toString()}`);

  const res = await fetch(url);
  const raw = await res.json();

  let data;
  try {
    data = JSON.parse(raw.contents);
  } catch {
    data = raw;
  }

  return data?.StanReginCd?.[0]?.region_cd || null;
}

//--------------------------------------------------------------
// [4] 건축물대장 조회 (CORS + XML 자동변환 완전대응)
//--------------------------------------------------------------
async function getAPI(type, sigunguCd, bjdongCd, bun, ji) {
  try {
    const baseUrl = `https://apis.data.go.kr/1613000/BldRgstHubService/${type}`;
    const params = new URLSearchParams({
      serviceKey,
      sigunguCd,
      bjdongCd,
      platGbCd: "0",
      bun,
      ji,
      _type: "json"
    });

    const proxy = "https://api.allorigins.win/get?url=";
    const url = proxy + encodeURIComponent(`${baseUrl}?${params.toString()}`);

    const res = await fetch(url);
    const text = await res.text();

    // ✅ allorigins 포맷 정리
    let content = text;
    try {
      const wrapped = JSON.parse(text);
      if (wrapped?.contents) content = wrapped.contents;
    } catch {}

    // ✅ JSON 응답 처리
    try {
      const data = JSON.parse(content);
      const item = data?.response?.body?.items?.item;
      return Array.isArray(item) ? item : item ? [item] : [];
    } catch {
      // ✅ XML 응답 처리
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, "text/xml");
      const items = xmlDoc.querySelectorAll("item");
      if (!items.length) return [];

      return Array.from(items).map(itemNode => {
        const item = {};
        itemNode.childNodes.forEach(n => {
          if (n.nodeType === 1) item[n.nodeName] = n.textContent;
        });
        return item;
      });
    }
  } catch (err) {
    console.error("API 오류:", err);
    return [];
  }
}
