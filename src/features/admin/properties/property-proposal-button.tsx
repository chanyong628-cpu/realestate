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
      className="whitespace-nowrap rounded-lg border border-brand-accent px-3 py-2 text-xs font-bold text-brand-accent hover:bg-brand-soft"
    >
      PPT
    </a>
  );
}
