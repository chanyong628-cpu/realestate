"use client";

export function ProposalPlaceholderButton() {
  return (
    <button
      type="button"
      onClick={() =>
        window.alert("PPT 양식과 생성 방식을 함께 정리한 뒤 연결하겠습니다.")
      }
      title="PPT 양식 협의 후 연결 예정"
      className="whitespace-nowrap rounded-lg border border-[#155EEF] px-3 py-2 text-xs font-bold text-[#155EEF] hover:bg-blue-50"
    >
      PPT
    </button>
  );
}
