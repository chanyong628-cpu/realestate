import type { PropertyListingTag } from "@/types/database";

export const listingTagLabels: Record<PropertyListingTag, string> = {
  office: "사무실",
  store: "상가",
  theme_new_build: "신축, 리모델링",
  theme_whole_rent: "통임대",
  theme_sale: "매매",
  theme_rooftop: "테라스",
  theme_etc: "기타",
};

export const primaryListingTags = ["office", "store"] as const;

export const themeDefinitions = [
  {
    slug: "new-build",
    tag: "theme_new_build",
    label: "신축, 리모델링",
    description: "신축 또는 리모델링으로 새롭게 관리된 매물",
  },
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
    slug: "terrace",
    tag: "theme_rooftop",
    label: "테라스",
    description: "테라스나 야외 공간을 활용할 수 있는 매물",
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  tag: PropertyListingTag;
  label: string;
  description: string;
}>;

export type ThemeSlug = (typeof themeDefinitions)[number]["slug"];

export function getThemeDefinition(slug: string) {
  if (slug === "rooftop") {
    return themeDefinitions.find((theme) => theme.slug === "terrace");
  }
  return themeDefinitions.find((theme) => theme.slug === slug);
}
