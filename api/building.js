import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

export default async function handler(req, res) {
  const { type, sigunguCd, bjdongCd, bun, ji, serviceKey } = req.query;

  if (!serviceKey) {
    return res.status(400).json({ error: "Missing serviceKey" });
  }

  try {
    const baseUrl = "https://apis.data.go.kr/1613000/BldRgstHubService";
    const url = `${baseUrl}/${type}?sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&bun=${bun}&ji=${ji}&serviceKey=${serviceKey}&_type=json`;

    console.log("📡 Requesting:", url);
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ API Response Error:", text);
      return res.status(500).json({ error: "Failed to fetch from API" });
    }

    let data;
    try {
      // JSON 형태면 그대로 파싱
      data = await response.json();
    } catch {
      // XML일 경우 수동 변환
      const text = await response.text();
      data = await parseStringPromise(text, { explicitArray: false });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("🔥 Internal Server Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}
