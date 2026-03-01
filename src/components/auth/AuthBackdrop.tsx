import { useEffect, useMemo, useState } from "react";
import heroVideo from "../assets/hero.webm";
import mapBackdrop from "../assets/mapBig.svg";
import photoOne from "../../pages/assets/DSC_2041.jpg";
import photoTwo from "../../pages/assets/data24.jpg";

type AuthMediaItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster?: string };

const AUTH_MEDIA: AuthMediaItem[] = [
  { type: "image", src: photoOne },
  { type: "image", src: photoTwo },
  { type: "image", src: mapBackdrop },
  { type: "video", src: heroVideo, poster: photoOne },
];

const pickRandom = (items: AuthMediaItem[]) => items[Math.floor(Math.random() * items.length)];

export default function AuthBackdrop() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (globalThis.window === undefined) return undefined;
    const mediaQuery = globalThis.window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const selected = useMemo<AuthMediaItem>(() => {
    const pool = prefersReducedMotion
      ? AUTH_MEDIA.filter((item) => item.type === "image")
      : AUTH_MEDIA;
    return pickRandom(pool) ?? AUTH_MEDIA[0]!;
  }, [prefersReducedMotion]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-black" />
      {selected.type === "video" ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          src={selected.src}
          poster={selected.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          src={selected.src}
          alt=""
        />
      )}
      <div className="absolute inset-0 bg-black/60" />
    </div>
  );
}
