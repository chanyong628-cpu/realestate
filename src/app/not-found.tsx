import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 text-center">
      <div>
        <p className="text-7xl font-black text-forest-100">404</p>
        <h1 className="mt-3 text-3xl font-black">페이지를 찾을 수 없습니다.</h1>
        <p className="mt-3 text-stone-600">
          주소가 변경되었거나 공개가 종료된 매물일 수 있습니다.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-12 items-center rounded-full bg-forest-700 px-6 font-black text-white"
        >
          전체 매물 보기
        </Link>
      </div>
    </main>
  );
}
