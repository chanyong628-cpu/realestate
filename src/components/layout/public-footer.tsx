import Image from "next/image";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-brand-line bg-brand-dark text-brand-base">
      <div className="mx-auto max-w-[1600px] px-5 py-8 text-center sm:px-8 lg:py-10">
        <Image
          src="/images/cy-realestate-logo.png"
          alt="C.Y REALESTATE"
          width={500}
          height={119}
          sizes="(max-width: 640px) 190px, (max-width: 1024px) 230px, 270px"
          className="mx-auto h-auto w-[190px] brightness-0 invert sm:w-[230px] lg:w-[270px]"
        />

        <div className="mt-5 hidden text-[13px] leading-6 font-semibold tracking-[-0.02em] text-brand-base lg:block">
          <p>
            상호: 씨와이(C.Y)부동산중개&nbsp;&nbsp;|&nbsp;&nbsp;대표자:
            공인중개사 박찬영&nbsp;&nbsp;|&nbsp;&nbsp;사업자등록번호:
            383-54-01061&nbsp;&nbsp;|&nbsp;&nbsp;부동산등록번호:
            11710-2025-00257
          </p>
          <p>
            주소: 서울특별시 송파구 오금로53길 9, 101호(거여동,
            제이빌)&nbsp;&nbsp;|&nbsp;&nbsp;전화: 02-6425-8090
          </p>
        </div>

        <dl className="mx-auto mt-5 grid max-w-2xl gap-1 text-left text-xs leading-5 text-brand-base lg:hidden">
          <div><dt className="inline font-bold">상호: </dt><dd className="inline">씨와이(C.Y)부동산중개</dd></div>
          <div><dt className="inline font-bold">대표자: </dt><dd className="inline">공인중개사 박찬영</dd></div>
          <div><dt className="inline font-bold">사업자등록번호: </dt><dd className="inline">383-54-01061</dd></div>
          <div><dt className="inline font-bold">부동산등록번호: </dt><dd className="inline">11710-2025-00257</dd></div>
          <div><dt className="inline font-bold">주소: </dt><dd className="inline">서울특별시 송파구 오금로53길 9, 101호(거여동, 제이빌)</dd></div>
          <div><dt className="inline font-bold">전화: </dt><dd className="inline">02-6425-8090</dd></div>
        </dl>

        <p className="mt-5 text-xs leading-5 font-semibold tracking-[-0.02em] text-brand-base">
          씨와이(C.Y)부동산중개. 사진. 매물. 커뮤니티 등 사이트 내 모든
          정보는 보호되며 무단 전재 및 재배포 금지합니다.
        </p>
        <Link
          href="/admin"
          aria-label="관리자 페이지"
          className="mt-3 inline-block text-[11px] text-brand-sand hover:text-white"
        >
          -
        </Link>
      </div>
    </footer>
  );
}
