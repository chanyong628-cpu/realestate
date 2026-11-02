import type { Property, PropertyCategory } from "@/types/database";

export type SongpaRegion = {
  slug: string;
  name: string;
  nearby: string;
  profile: string;
  strengths: [string, string, string];
};

export const songpaRegions: readonly SongpaRegion[] = [
  {
    slug: "garak-dong",
    name: "가락동",
    nearby: "가락시장역·경찰병원역과 송파대로",
    profile:
      "업무시설과 생활상권이 함께 형성되어 소형 사무실부터 중형 업무공간까지 비교하기 좋은 지역입니다.",
    strengths: ["가락시장역·경찰병원역 접근", "송파대로 중심 이동", "생활편의시설이 가까운 업무환경"],
  },
  {
    slug: "geoyeo-dong",
    name: "거여동",
    nearby: "거여역과 오금로·위례 생활권",
    profile:
      "주거 배후수요와 역세권 상권을 함께 살필 수 있어 실사용 중심의 사무실과 근린상가를 찾는 고객에게 적합합니다.",
    strengths: ["거여역 역세권", "위례·문정 방면 이동", "주거 밀집지역의 생활수요"],
  },
  {
    slug: "macheon-dong",
    name: "마천동",
    nearby: "마천역과 거여·위례 생활권",
    profile:
      "송파 동남권의 주거상권을 기반으로 합리적인 임대조건의 업무공간과 생활밀착형 점포를 비교하기 좋은 지역입니다.",
    strengths: ["마천역 접근", "거여·위례 생활권 연계", "생활밀착형 상권"],
  },
  {
    slug: "munjeong-dong",
    name: "문정동",
    nearby: "문정역·장지역과 문정법조단지",
    profile:
      "법조단지와 지식산업센터, 대형 업무시설이 모여 있어 기업 사무실과 전문서비스 업종의 수요가 꾸준한 지역입니다.",
    strengths: ["문정역·장지역 접근", "법조단지 업무수요", "지식산업센터와 지원시설"],
  },
  {
    slug: "bangi-dong",
    name: "방이동",
    nearby: "방이역·송파나루역과 올림픽공원",
    profile:
      "업무·외식·생활상권이 함께 형성되어 사무실뿐 아니라 고객 방문형 업종의 입지도 함께 검토하기 좋은 지역입니다.",
    strengths: ["방이역·송파나루역 접근", "올림픽공원 인접", "업무와 상업수요가 공존하는 상권"],
  },
  {
    slug: "samjeon-dong",
    name: "삼전동",
    nearby: "삼전역과 백제고분로",
    profile:
      "잠실 생활권과 가까우면서 비교적 다양한 규모의 건물이 분포해 실속형 사무실과 지역상권 매물을 찾기 좋습니다.",
    strengths: ["삼전역 역세권", "잠실 생활권 접근", "백제고분로 중심 이동"],
  },
  {
    slug: "seokchon-dong",
    name: "석촌동",
    nearby: "석촌역·송파나루역과 석촌호수",
    profile:
      "두 개 역세권과 석촌호수 주변 상권을 바탕으로 업무공간과 방문형 상업시설을 폭넓게 비교할 수 있습니다.",
    strengths: ["석촌역·송파나루역 접근", "석촌호수 생활권", "송파대로·백제고분로 이동"],
  },
  {
    slug: "songpa-dong",
    name: "송파동",
    nearby: "송파역·송파나루역과 석촌호수 동측",
    profile:
      "송파 중심 생활권에 위치해 고객 접근성이 중요한 사무실과 안정적인 배후수요가 필요한 상가를 함께 살피기 좋습니다.",
    strengths: ["송파역·송파나루역 접근", "석촌호수 인접", "주거와 상업수요가 균형 잡힌 지역"],
  },
  {
    slug: "sincheon-dong",
    name: "신천동",
    nearby: "잠실역·잠실나루역과 올림픽로",
    profile:
      "잠실 핵심 업무·상업시설과 가까워 대중교통 접근성과 브랜드 가시성을 함께 고려하는 업종에 적합한 지역입니다.",
    strengths: ["잠실역·잠실나루역 접근", "대형 업무·상업시설 인접", "올림픽로 중심 교통망"],
  },
  {
    slug: "ogeum-dong",
    name: "오금동",
    nearby: "오금역·개롱역과 오금로",
    profile:
      "5호선과 3호선 환승권을 이용할 수 있고 주거 배후가 탄탄해 실사용 사무실과 생활서비스 업종을 검토하기 좋습니다.",
    strengths: ["오금역 환승 교통", "개롱역 생활권", "안정적인 주거 배후수요"],
  },
  {
    slug: "jamsil-dong",
    name: "잠실동",
    nearby: "잠실역·종합운동장역과 테헤란로 동측",
    profile:
      "송파구의 대표 업무·상업 중심지로 교통, 인지도, 고객 접근성을 중시하는 기업과 매장을 위한 선택지가 많은 지역입니다.",
    strengths: ["잠실역·종합운동장역 접근", "대규모 업무·상업수요", "높은 지역 인지도"],
  },
  {
    slug: "jangji-dong",
    name: "장지동",
    nearby: "장지역과 문정법조단지·위례 생활권",
    profile:
      "문정 업무지구와 위례를 함께 연결하는 위치로 신축 업무공간과 계획형 상권의 매물을 비교하기 좋습니다.",
    strengths: ["장지역 역세권", "문정법조단지 연계", "위례 생활권 접근"],
  },
  {
    slug: "pungnap-dong",
    name: "풍납동",
    nearby: "강동구청역과 올림픽대로",
    profile:
      "강동·잠실 방면 이동이 편리하고 주거 배후수요가 풍부해 지역 기반 사무실과 생활밀착형 상가를 찾기 좋은 지역입니다.",
    strengths: ["강동구청역 접근", "잠실·강동 방면 이동", "풍부한 주거 배후수요"],
  },
] as const;

export const songpaRegionNames = songpaRegions.map((region) => region.name);

export function getSongpaRegionBySlug(slug: string) {
  return songpaRegions.find((region) => region.slug === slug) ?? null;
}

export function getSongpaRegionByAddress(address: string | null | undefined) {
  if (!address) return null;
  return songpaRegions.find((region) => address.includes(region.name)) ?? null;
}

export function filterPropertiesByRegion(
  properties: Property[],
  region: SongpaRegion,
) {
  return properties.filter((property) =>
    [property.public_address, property.title].some((value) =>
      value?.includes(region.name),
    ),
  );
}

export function getRegionPath(
  category: Extract<PropertyCategory, "office" | "store">,
  region: SongpaRegion,
) {
  return `/${category}/${region.slug}`;
}
