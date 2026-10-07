"use client";

import { EyeOff, FileDown, Heart, LoaderCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FavoriteButton } from "@/components/properties/favorite-button";
import {
  bulkManagePropertiesAction,
  setPropertyPublishedAction,
  setPropertyRecommendedAction,
} from "@/features/admin/properties/actions";
import { DeletePropertyButton } from "@/features/admin/properties/delete-button";
import { PropertyProposalButton } from "@/features/admin/properties/property-proposal-button";
import {
  isStoredAddressHidden,
  resolvePublicAddress,
} from "@/lib/properties/address";
import type { Property, PropertyCategory } from "@/types/database";

const categoryLabels: Record<PropertyCategory, string> = {
  office: "사무실",
  store: "상가",
  etc: "기타",
};

function formatWon(value: number | null) {
  return value === null ? "협의" : `${value.toLocaleString("ko-KR")}만원`;
}

function formatPyeong(value: number | null) {
  if (value === null) return "";
  const rounded = Number((value / 3.3058).toFixed(1));
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}평`;
}

function memoPreview(property: Property) {
  const memo = property.private_memo
    ?.replace(/^Google Drive\s*폴더명\s*:\s*/i, "")
    .trim();
  const source = memo || "";
  const address =
    source.match(/([가-힣0-9]+동)\s*((?:산\s*)?\d+(?:-\d+)?)/)?.slice(1, 3)
      .filter(Boolean)
      .join(" ") ||
    property.private_address ||
    property.public_address;
  const floor =
    source.match(/((?:지하\s*)?\d+\s*층)(?:전체|일부)?/)?.[1]?.replace(/\s+/g, "") ||
    property.floor;
  const money =
    source.match(/(\d+\s*-\s*\d+\s*-\s*(?:\d+|포함|없음|무|무료|관리비포함))/i)?.[1]
      ?.replace(/\s+/g, "") ||
    `보증금 ${formatWon(property.deposit)} / 월세 ${formatWon(property.monthly_rent)}`;
  const area =
    source.match(/(\d+(?:\.\d+)?\s*평)/)?.[1]?.replace(/\s+/g, "") ||
    formatPyeong(property.exclusive_area);

  return [address, floor, money, area].filter(Boolean).join(" · ");
}

function ActionButton({
  children,
  disabled,
  tone,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  tone: "neutral" | "green" | "red" | "accent";
  onClick: () => void;
}) {
  const tones = {
    neutral: "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    red: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
    accent: "border-brand-accent bg-brand-accent text-white hover:bg-brand-accent-dark",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function AdminPropertyTable({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const propertyIds = useMemo(() => properties.map((property) => property.id), [properties]);
  const selectedIds = propertyIds.filter((id) => selected.has(id));
  const allSelected = propertyIds.length > 0 && selectedIds.length === propertyIds.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedIds.length > 0 && !allSelected;
    }
  }, [allSelected, selectedIds.length]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(propertyIds));
  }

  async function runMutation(action: "hide" | "delete" | "favorite") {
    if (!selectedIds.length || pending) return;
    if (
      action === "delete" &&
      !window.confirm(
        `선택한 ${selectedIds.length}개 매물을 완전히 삭제할까요?\n사진 파일도 함께 삭제되며 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }
    if (
      action === "hide" &&
      !window.confirm(`선택한 ${selectedIds.length}개 매물을 모두 비노출로 바꿀까요?`)
    ) {
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      const result = await bulkManagePropertiesAction({ ids: selectedIds, action });
      setMessage({ ok: result.success, text: result.message });
      if (result.success) {
        setSelected(new Set());
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "작업을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." });
    } finally {
      setPending(false);
    }
  }

  async function downloadProposal() {
    if (!selectedIds.length || pending) return;
    if (selectedIds.length > 20) {
      setMessage({ ok: false, text: "PPT는 한 번에 최대 20개 매물까지 만들 수 있습니다." });
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/properties/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "PPT를 만들지 못했습니다.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `CY_선택매물_${selectedIds.length}개_임대제안서.pptx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage({ ok: true, text: `${selectedIds.length}개 매물을 한 PPT에 넣었습니다.` });
    } catch (error) {
      setMessage({
        ok: false,
        text: error instanceof Error ? error.message : "PPT를 만들지 못했습니다.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative mt-8 overflow-visible rounded-2xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 bg-gradient-to-r from-amber-50 via-white to-emerald-50 p-4">
        <div className="mr-auto flex min-w-[150px] items-center gap-3">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="현재 목록 전체 선택"
            className="size-6 cursor-pointer accent-violet-700"
          />
          <div>
            <b className="block text-sm">현재 목록 전체 선택</b>
            <span className="text-xs font-bold text-violet-700">{selectedIds.length}개 선택됨</span>
          </div>
        </div>
        <ActionButton disabled={!selectedIds.length || pending} tone="neutral" onClick={() => runMutation("hide")}>
          <EyeOff size={16} /> 선택 비노출
        </ActionButton>
        <ActionButton disabled={!selectedIds.length || pending} tone="accent" onClick={downloadProposal}>
          <FileDown size={16} /> 선택 PPT
        </ActionButton>
        <ActionButton disabled={!selectedIds.length || pending} tone="green" onClick={() => runMutation("favorite")}>
          <Heart size={16} /> 선택 즐겨찾기
        </ActionButton>
        <ActionButton disabled={!selectedIds.length || pending} tone="red" onClick={() => runMutation("delete")}>
          <Trash2 size={16} /> 선택 삭제
        </ActionButton>
        {pending && <LoaderCircle size={20} className="animate-spin text-brand-accent" />}
      </div>

      {message && (
        <p className={`border-b px-5 py-3 text-sm font-bold ${message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <div>
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
              <th className="w-14 px-2 py-4 text-center">선택</th>
              <th className="px-5 py-4">매물</th>
              <th className="hidden w-20 px-2 py-4 xl:table-cell">분류</th>
              <th className="hidden w-32 px-2 py-4 2xl:table-cell">공개 주소</th>
              <th className="hidden w-24 px-2 py-4 text-center 2xl:table-cell">주소 표시</th>
              <th className="w-20 px-2 py-4 text-center">노출</th>
              <th className="w-20 px-2 py-4 text-center">추천</th>
              <th className="hidden w-24 px-2 py-4 text-center xl:table-cell">사진</th>
              <th className="hidden w-16 px-2 py-4 text-center 2xl:table-cell">찜</th>
              <th className="w-48 px-3 py-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => {
              const hasImages = property.image_urls.length > 0;
              const preview = memoPreview(property);
              const isSelected = selected.has(property.id);

              return (
                <tr
                  key={property.id}
                  className={`border-b last:border-0 ${
                    isSelected
                      ? "border-violet-200 bg-violet-100/80 ring-2 ring-inset ring-violet-500"
                      : !hasImages
                        ? "border-red-100 bg-red-50/30"
                        : "border-stone-100"
                  }`}
                >
                  <td className="px-2 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(property.id)}
                      aria-label={`${property.property_number} 선택`}
                      className="size-6 cursor-pointer accent-violet-700"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/properties/${property.property_number}`} className="group block">
                      <b className="block group-hover:text-forest-700 group-hover:underline">{property.title}</b>
                      <span className="mt-1 block text-xs font-bold text-forest-600">{property.property_number}</span>
                      {preview && <span className="mt-1.5 block max-w-[390px] truncate text-xs font-semibold text-red-600">{preview}</span>}
                    </Link>
                  </td>
                  <td className="hidden px-2 py-4 text-sm xl:table-cell">{categoryLabels[property.category]}</td>
                  <td className="hidden truncate px-2 py-4 text-sm text-stone-600 2xl:table-cell">
                    {resolvePublicAddress(property.public_address, property.private_address) || "-"}
                  </td>
                  <td className="hidden whitespace-nowrap px-2 py-4 text-center 2xl:table-cell">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-black ${
                      isStoredAddressHidden(property.public_address)
                        ? "bg-amber-100 text-amber-800"
                        : "bg-brand-line text-brand-accent"
                    }`}>
                      {isStoredAddressHidden(property.public_address) ? "반경 표시" : "주소 공개"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-4 text-center">
                    <form className="inline-flex" action={setPropertyPublishedAction.bind(null, property.id, !property.is_published)}>
                      <button className={`rounded-full px-3 py-1.5 text-xs font-black ${property.is_published ? "bg-forest-100 text-forest-700" : "bg-stone-100 text-stone-500"}`}>
                        {property.is_published ? "노출" : "비노출"}
                      </button>
                    </form>
                  </td>
                  <td className="whitespace-nowrap px-2 py-4 text-center">
                    <form className="inline-flex" action={setPropertyRecommendedAction.bind(null, property.id, !property.is_recommended)}>
                      <button className={`rounded-full px-3 py-1.5 text-xs font-black ${property.is_recommended ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-500"}`}>
                        {property.is_recommended ? "추천" : "일반"}
                      </button>
                    </form>
                  </td>
                  <td className="hidden px-2 py-4 text-center xl:table-cell">
                    {hasImages ? (
                      <span className="inline-flex min-w-20 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-800" title={`${property.image_urls.length}장 등록됨`}>
                        사진 {property.image_urls.length}장
                      </span>
                    ) : (
                      <span className="inline-flex min-w-20 items-center justify-center rounded-full border-2 border-red-500 bg-red-100 px-3 py-1.5 text-xs font-black text-red-700" title="사진 미등록">
                        사진 없음
                      </span>
                    )}
                  </td>
                  <td className="hidden px-2 py-4 text-center 2xl:table-cell"><FavoriteButton propertyId={property.id} compact /></td>
                  <td className="whitespace-nowrap px-3 py-4">
                    <div className="flex flex-nowrap justify-end gap-2">
                      <PropertyProposalButton id={property.id} propertyNumber={property.property_number} />
                      <Link href={`/admin/properties/${property.id}/edit`} className="whitespace-nowrap rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold hover:bg-stone-50">수정</Link>
                      <DeletePropertyButton id={property.id} propertyNumber={property.property_number} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
