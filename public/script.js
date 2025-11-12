//--------------------------------------------------------------
// 🏢 RealEstate HUB 통합조회 script.js (디버그·자동파서 완성형)
//--------------------------------------------------------------

const serviceKey = "6c712922ba179a63f752341c8e77729a92a493a01169e4c73de1d90c110b0d6c"; // 인코딩 안된 키

// Debug 모드 (true → 콘솔 로그 자세히 출력)
const DEBUG = true;

//--------------------------------------------------------------
// 조회 버튼 이벤트
//--------------------------------------------------------------
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

    // 기본정보 표시
    document.getElementById("basicInfo").textContent =
      `사용승인일자: ${basic.useAprDay || "-"}\n` +
      `연면적: ${basic.totArea || "-"}㎡\n` +
      `주용도: ${basic.mainPurpsCdNm || "-"}\n` +
      `지상층: ${basic.grndFlrCnt || "-"}층\n` +
      `지하층: ${basic.ugrndFlrCnt || "-"}층\n` +
      `주차대수: ${basic.parkingCnt || "-"}대`;

    // 층별정보
    if (Array.isArray(floor) && floor.length > 0) {
      const table = floor.map(f =>
        `${f.flrNm || "-"} | ${f.strctCdNm || "-"} | ${f.area || "-"}㎡`
      ).join("\n");
      document.getElementById("floorInfo").textContent =
        `층 | 구조 | 면적(㎡)\n---------------------\n${table}`;
    } else {
      document.getElementById("floorInfo").textContent = "층별 정보 없음";
    }

    // 위반건축물
    document.getElementById("violationInfo").textContent =
      viol?.[0]?.violtCont || "위반 건축물 정보 없음";

  } catch (err) {
    console.error("❌ 전체 오류:", err);
    document.getElementById("basicInfo").textContent = `❌ 오류: ${err.message}`;
  }
});

//--------------------------------------------------------------
// 주소 → 번/지 파싱
//--------------------------------------------------------------
function parseAddress(address) {
  const m = address.match(/(\d+)(?:-(\d+))?/);
  return { bun: m?.[1]?.padStart(4, "0") || "0000", ji: m?.[2]?.padStart(4, "0") || "0000" };
}

//--------------------------------------------------------------
// 법정동 코드 조회
//--------------------------------------------------------------
async function getRegionCode(address) {
  const m = address.match(/(.+구)\s*(.+동)/);
  if (!m) return null;
  const [, gu, dong] = m;
  const query = encodeURIComponent(`${dong}`);

  const baseUrl = "https://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList";
  const params = new URLSearchParams({
    serviceKey, pageNo: "1", numOfRows: "1", type: "json", locatadd_nm: query
  });

  const proxy = "https://api.allorigins.win/get?url=";
  const url = proxy + encodeURIComponent(`${baseUrl}?${params.toString()}`);
  if (DEBUG) console.log("[getRegionCode] URL:", url);

  const res = await fetch(url);
  const txt = await res.text();
  if (DEBUG) console.log("[getRegionCode] raw:", txt.slice(0, 200));

  let content = txt;
  try {
    const wrapped = JSON.parse(txt);
    if (wrapped.contents) content = wrapped.contents;
  } catch {}

  try {
    const data = JSON.parse(content);
    return data?.StanReginCd?.[0]?.region_cd || null;
  } catch {
    if (DEBUG) console.warn("[getRegionCode] JSON 파싱 실패 → XML 시도");
    const parser = new DOMParser();
    const xml = parser.parseFromString(content, "text/xml");
    return xml.querySelector("region_cd")?.textContent || null;
  }
}

//--------------------------------------------------------------
// 건축물대장 조회 (XML/JSON 완전 자동 감지 + 로깅)
//--------------------------------------------------------------
async function getAPI(type, sigunguCd, bjdongCd, bun, ji) {
  try {
    const baseUrl = `https://apis.data.go.kr/1613000/BldRgstHubService/${type}`;
    const params = new URLSearchParams({
      serviceKey, sigunguCd, bjdongCd, platGbCd: "0", bun, ji, _type: "json"
    });

    const proxy = "https://api.allorigins.win/get?url=";
    const url = proxy + encodeURIComponent(`${baseUrl}?${params.toString()}`);

    if (DEBUG) console.log(`[${type}] 요청 URL:`, url);

    const res = await fetch(url);
    const txt = await res.text();

    if (DEBUG) console.log(`[${type}] 응답 일부:`, txt.slice(0, 200));

    // 1단계: allorigins 포맷 처리
    let content = txt;
    try {
      const wrapped = JSON.parse(txt);
      if (wrapped.contents) content = wrapped.contents;
    } catch {}

    // 2단계: 응답 형식 자동 감지
    const trimmed = content.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const data = JSON.parse(content);
      const item = data?.response?.body?.items?.item;
      return Array.isArray(item) ? item : item ? [item] : [];
    } else if (trimmed.startsWith("<")) {
      const parser = new DOMParser();
      const xml = parser.parseFromString(content, "text/xml");
      const items = xml.querySelectorAll("item");
      return Array.from(items).map(it => {
        const obj = {};
        it.childNodes.forEach(n => { if (n.nodeType === 1) obj[n.nodeName] = n.textContent; });
        return obj;
      });
    } else {
      throw new Error("응답이 JSON도 XML도 아닙니다.");
    }
  } catch (err) {
    console.error(`[${type}] API 오류:`, err);
    return [];
  }
}
