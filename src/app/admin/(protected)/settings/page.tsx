import { CheckCircle2, CircleAlert, ExternalLink } from "lucide-react";
import { GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL } from "@/lib/google-drive";

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
  const driveUrl =
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL ??
    "https://drive.google.com/drive/folders/1CY01o2w0MH7KQ-RT8orJCC8PIK4w-YDj";
  const driveServiceAccountEmail = GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL;
  const driveConnected = true;

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
          connected={driveConnected}
          description="폴더 링크의 사진을 홈페이지 저장소로 가져옵니다."
        />
        <StatusRow
          label="Google Analytics 4"
          connected={Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)}
          description="방문자·유입 경로·문의 전환을 측정합니다."
        />
        <StatusRow
          label="Google Search Console 소유확인"
          connected={Boolean(process.env.GOOGLE_SITE_VERIFICATION)}
          description="메타 태그 방식 소유확인입니다. 도메인(DNS) 또는 다른 방식으로 확인했다면 '설정 필요'로 보여도 정상일 수 있습니다."
        />
        <StatusRow
          label="네이버 서치어드바이저 소유확인"
          connected={Boolean(process.env.NAVER_SITE_VERIFICATION)}
          description="네이버 검색 등록용 소유확인 메타 태그입니다."
        />
      </div>

      <div className="mt-5 rounded-2xl border border-brand-line bg-brand-soft p-5">
        <p className="font-black text-brand-dark">검색 노출 분석(Claude 연동)</p>
        <p className="mt-1 text-sm leading-6 text-brand-slate">
          Attaché(app.attache.studio)에서 Google 계정으로 로그인해 Search Console·GA4·Google Ads를
          읽기 전용으로 연결하면, Claude가 주간 노출·클릭·순위와 색인 상태를 확인해 회의록에 반영합니다.
        </p>
        <a
          href="https://app.attache.studio/dashboard"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold"
        >
          Attaché 연결 화면 열기 <ExternalLink size={16} />
        </a>
      </div>

      {driveServiceAccountEmail && (
        <div className="mt-5 rounded-2xl border border-brand-line bg-brand-soft p-5">
          <p className="font-black text-brand-dark">
            Google Drive 폴더 공유 계정
          </p>
          <p className="mt-1 text-sm leading-6 text-brand-slate">
            사진 폴더의 공유 설정에서 아래 계정을 뷰어로 추가해 주세요.
          </p>
          <p className="mt-3 break-all rounded-lg bg-white px-4 py-3 text-sm font-bold text-brand-accent">
            {driveServiceAccountEmail}
          </p>
        </div>
      )}

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
