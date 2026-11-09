import type { PropertyListingTag } from "@/types/database";

export const listingTagLabels: Record<PropertyListingTag, string> = {
  office: "사무실",
  store: "상가",
  theme_whole_rent: "통임대",
  theme_sale: "매매",
  theme_rooftop: "루프탑",
  theme_etc: "기타",
};

export const primaryListingTags = ["office", "store"] as const;

export const themeDefinitions = [
  {
    slug: "whole-rent",
    tag: "theme_whole_rent",
    label: "통임대",
    description: "건물 전체 또는 여러 층을 함께 사용하는 매물",
  },
  {
    slug: "sale",
    tag: "theme_sale",
    label: "매매",
    description: "송파구 사무실·상가 매매 매물",
  },
  {
    slug: "rooftop",
    tag: "theme_rooftop",
    label: "루프탑",
    description: "옥상과 테라스를 활용할 수 있는 매물",
  },
  {
    slug: "etc",
    tag: "theme_etc",
    label: "기타",
    description: "특별한 조건과 특징을 가진 매물",
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  tag: PropertyListingTag;
  label: string;
  description: string;
}>;

export type ThemeSlug = (typeof themeDefinitions)[number]["slug"];

export function getThemeDefinition(slug: string) {
  return themeDefinitions.find((theme) => theme.slug === slug);
}
