// api/building.js
import fetch from "node-fetch";
import xml2js from "xml2js";

// 🚀 Vercel 서버리스 함수 (공공데이터포털 API 프록시)
export default async function handler(req, res) {
  // CORS 허용 (브라우저 접근 허용)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS preflight 대응
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { type, sigunguCd, bjdongCd, bun, ji, serviceKey } = req.query;

    if (!type || !sigunguCd || !bjdongCd || !serviceKey) {
      return res.status(400).json({ error: "필수 파라미터 누락" });
    }

    const apiUrl = `https://apis.data.go.kr/1613000/BldRgstHubService/${type}?serviceKey=${serviceKey}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&platGbCd=0&bun=${bun}&ji=${ji}&_type=json`;

    const response = await fetch(apiUrl);
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text); // JSON 응답일 경우
    } catch {
      // XML 응답일 경우 자동 변환
      const parser = new xml2js.Parser({ explicitArray: false });
      data = await parser.parseStringPromise(text);
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ 서버 내부 오류:", err);
    res.status(500).json({ error: err.message });
  }
}
