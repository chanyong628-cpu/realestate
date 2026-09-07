"use client";

import { useState } from "react";
import type { Property } from "@/types/database";

export function ProposalDownloadForm({
  blockId,
  properties,
}: {
  blockId: string;
  properties: Property[];
}) {
  const [selected, setSelected] = useState(() =>
    properties.map((property) => property.id),
  );
  const [pending, setPending] = useState(false);
  const allSelected =
    properties.length > 0 && selected.length === properties.length;

  function toggle(propertyId: string) {
    setSelected((current) =>
      current.includes(propertyId)
        ? current.filter((id) => id !== propertyId)
        : [...current, propertyId],
    );
  }

  return (
    <section
      id="ppt-proposal"
      className="mt-8 rounded-2xl border border-brand-line bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black tracking-wider text-brand-accent-dark">
            POWERPOINT
          </p>
          <h2 className="mt-1 text-xl font-black">임대제안서 저장</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            1·4페이지는 한 번만 들어가고, 선택한 매물마다 2·3페이지가
            반복됩니다.
          </p>
        </div>
        {!!properties.length && (
          <button
            type="button"
            onClick={() =>
              setSelected(
                allSelected ? [] : properties.map((property) => property.id),
              )
            }
            className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold"
          >
            {allSelected ? "전체 해제" : "전체 선택"}
          </button>
        )}
      </div>

      {!properties.length ? (
        <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-stone-600">
          먼저 매물의 즐겨찾기 메뉴에서 이 고객 블록에 매물을 추가해 주세요.
        </p>
      ) : (
        <form
          method="post"
          action={`/api/admin/customer-blocks/${blockId}/proposal`}
          onSubmit={() => setPending(true)}
          className="mt-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {properties.map((property) => (
              <label
                key={property.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-4 hover:border-brand-accent"
              >
                <input
                  type="checkbox"
                  name="propertyIds"
                  value={property.id}
                  checked={selected.includes(property.id)}
                  onChange={() => toggle(property.id)}
                  className="mt-1 size-4 accent-brand-accent"
                />
                <span className="min-w-0">
                  <strong className="block text-sm text-brand-accent-dark">
                    {property.property_number}
                  </strong>
                  <span className="mt-1 block truncate font-bold">
                    {property.title}
                  </span>
                  <span className="mt-1 block text-xs text-stone-500">
                    {property.public_address || "주소 미입력"}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <button
            disabled={!selected.length || pending}
            className="mt-5 h-12 w-full rounded-xl bg-brand-accent-dark px-6 font-black text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {pending
              ? "PowerPoint 만드는 중..."
              : `선택 매물 ${selected.length}개 PPT 저장`}
          </button>
        </form>
      )}
    </section>
  );
}
