"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useRef, useState } from "react";

export function PropertyGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);

  function move(offset: number) {
    setCurrent((index) => (index + offset + images.length) % images.length);
  }

  if (!images.length) {
    return (
      <div className="grid aspect-[16/8] place-items-center rounded-3xl bg-stone-200 text-stone-400">
        <Images size={54} strokeWidth={1.3} />
      </div>
    );
  }

  return (
    <section aria-label="매물 사진 갤러리">
      <div
        className="relative aspect-[75/46] overflow-hidden rounded-2xl bg-stone-100"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const distance =
            (event.changedTouches[0]?.clientX ?? touchStart.current) -
            touchStart.current;
          if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
          touchStart.current = null;
        }}
      >
        <Image
          key={images[current]}
          src={images[current]}
          alt={`${title} 사진 ${current + 1}`}
          fill
          priority={current === 0}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) calc(100vw - 40px), 960px"
          className="object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="이전 사진"
              onClick={() => move(-1)}
              className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#111827] shadow-md hover:bg-white"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              aria-label="다음 사진"
              onClick={() => move(1)}
              className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#111827] shadow-md hover:bg-white"
            >
              <ChevronRight size={24} />
            </button>
            <span className="absolute right-4 bottom-4 rounded-full bg-black/65 px-3 py-1.5 text-sm font-bold text-white">
              {current + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={`${index + 1}번째 사진 보기`}
              onClick={() => setCurrent(index)}
              className={`relative aspect-[75/46] w-28 shrink-0 overflow-hidden rounded-lg border-2 bg-stone-100 ${
                current === index
                  ? "border-[#155EEF]"
                  : "border-transparent opacity-70"
              }`}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(max-width: 640px) 25vw, 112px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
