export function PropertyProposalButton({
  id,
  propertyNumber,
}: {
  id: string;
  propertyNumber: string;
}) {
  return (
    <a
      href={`/api/admin/properties/${id}/proposal`}
      title={`${propertyNumber} 임대제안서 PowerPoint 저장`}
      className="whitespace-nowrap rounded-lg border border-[#155EEF] px-3 py-2 text-xs font-bold text-[#155EEF] hover:bg-blue-50"
    >
      PPT
    </a>
  );
}
