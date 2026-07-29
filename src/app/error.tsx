"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 text-center">
      <div>
        <p className="text-sm font-black tracking-widest text-red-600">
          TEMPORARY ERROR
        </p>
        <h1 className="mt-3 text-3xl font-black">
          잠시 문제가 발생했습니다.
        </h1>
        <p className="mt-3 text-stone-600">
          잠시 후 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 h-12 rounded-full bg-forest-700 px-6 font-black text-white"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
