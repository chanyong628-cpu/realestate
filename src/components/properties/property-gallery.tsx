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
      <div className="mx-auto grid aspect-[4/3] w-full max-w-[800px] place-items-center rounded-3xl bg-brand-soft text-brand-muted md:aspect-[16/10]">
        <Images size={54} strokeWidth={1.3} />
      </div>
    );
  }

  return (
    <section
      aria-label="매물 사진 갤러리"
      className="-mx-2 w-[calc(100%+1rem)] sm:mx-auto sm:w-full sm:max-w-[800px]"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-soft shadow-sm md:aspect-[16/10]"
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
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="이전 사진"
              onClick={() => move(-1)}
              className="absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-brand-surface/90 text-brand-ink shadow-md hover:bg-brand-surface md:grid"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              aria-label="다음 사진"
              onClick={() => move(1)}
              className="absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-brand-surface/90 text-brand-ink shadow-md hover:bg-brand-surface md:grid"
            >
              <ChevronRight size={24} />
            </button>
            <span className="absolute right-4 bottom-4 hidden rounded-full bg-brand-dark/75 px-3 py-1.5 text-sm font-bold text-white md:block">
              {current + 1} / {images.length}
            </span>
            <div
              aria-label={`${current + 1} / ${images.length}`}
              className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-brand-dark/55 px-2.5 py-2 md:hidden"
            >
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`${index + 1}번째 사진 보기`}
                  aria-current={current === index ? "true" : undefined}
                  onClick={() => setCurrent(index)}
                  className={`size-1.5 rounded-full transition ${
                    current === index ? "bg-brand-sand" : "bg-brand-surface/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 hidden gap-2 overflow-x-auto pb-1 md:flex">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={`${index + 1}번째 사진 보기`}
              onClick={() => setCurrent(index)}
              className={`relative aspect-[75/46] w-28 shrink-0 overflow-hidden rounded-lg border-2 bg-brand-soft ${
                current === index
                  ? "border-brand-accent"
                  : "border-transparent opacity-70"
              }`}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="112px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
