import { CheckCircle2, CircleAlert, ExternalLink } from "lucide-react";

function StatusRow({
  label,
  connected,
  description,
}: {
  label: string;
  connected: boolean;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-stone-100 py-5 last:border-0">
      <div>
        <h2 className="font-black">{label}</h2>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>
      <span
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
          connected
            ? "bg-forest-50 text-forest-700"
            : "bg-amber-50 text-amber-800"
        }`}
      >
        {connected ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
        {connected ? "연결됨" : "설정 필요"}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const driveUrl = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL;

  return (
    <section>
      <p className="font-bold text-forest-600">SETTINGS</p>
      <h1 className="mt-1 text-3xl font-black">설정</h1>
      <p className="mt-2 text-stone-600">외부 서비스 연결 상태입니다.</p>

      <div className="mt-8 rounded-2xl bg-white px-6 shadow-sm">
        <StatusRow
          label="Supabase"
          connected={Boolean(
            process.env.NEXT_PUBLIC_SUPABASE_URL &&
              process.env.SUPABASE_SECRET_KEY,
          )}
          description="매물, 고객 블록 및 관리자 데이터를 저장합니다."
        />
        <StatusRow
          label="카카오 지도"
          connected={Boolean(process.env.NEXT_PUBLIC_MAP_API_KEY)}
          description="매물 상세 페이지에 공개 위치를 표시합니다."
        />
        <StatusRow
          label="Google Drive"
          connected={Boolean(driveUrl)}
          description="매물 이미지 원본을 관리하는 폴더입니다."
        />
      </div>

      {driveUrl && (
        <a
          href={driveUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-bold"
        >
          Google Drive 폴더 열기 <ExternalLink size={16} />
        </a>
      )}
    </section>
  );
}
