import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { BRAND_NAME } from "@shared/platform";
import { useLanguage } from "@/lib/language";
import "@/brand.css";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Fraunces:opsz,wght@9..144,520;9..144,650&family=Fredoka:wght@500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Nunito:wght@400;600;700&family=Outfit:wght@400;500;600;700&display=swap";

export function useBrandFonts() {
  useEffect(() => {
    const id = "rsvp-brand-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

/** "RSVP Sites by Mission" -> ["RSVP Sites", "by Mission"]. A rename stays in BRAND_NAME. */
export function splitBrand(name = BRAND_NAME): [string, string] {
  const marker = " by ";
  const at = name.toLowerCase().lastIndexOf(marker);
  if (at === -1) return [name, ""];
  return [name.slice(0, at), name.slice(at + 1)];
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  const [main, by] = splitBrand();
  return (
    <span className={`inline-flex items-center ${compact ? "gap-2" : "gap-2.5"}`}>
      <svg width={compact ? 28 : 34} height={compact ? 28 : 34} viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="10" fill="#142033" />
        <path d="M9 18.5 14.2 23 25 11" fill="none" stroke="#f0b429" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="leading-tight">
        <span className="brand-display block text-[1.05rem] font-medium tracking-tight text-[#142033]">{main}</span>
        {by ? <span className="block text-[10px] uppercase tracking-[0.16em] text-[#526072]">{by}</span> : null}
      </span>
    </span>
  );
}

export function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="rounded-full border border-[#d7dee7] bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-[#142033]"
      aria-label={t("toggle.aria")}
      data-testid="button-language"
    >
      {language === "en" ? "ES" : "EN"}
    </button>
  );
}

export function BrandShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  useBrandFonts();
  useEffect(() => {
    const previous = document.title;
    document.title = title || BRAND_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <div className="brand-site min-h-screen" data-testid="platform-chrome">
      {children}
    </div>
  );
}

export function BrandHeader({ ctaHref = "/start", cta }: { ctaHref?: string; cta: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#d7dee7] bg-[#f3f5f8]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" aria-label={BRAND_NAME}>
          <Wordmark />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link href={ctaHref} className="brand-btn !px-4 !py-2 text-sm" data-testid="link-start-header">
            {cta}
          </Link>
        </div>
      </div>
    </header>
  );
}
