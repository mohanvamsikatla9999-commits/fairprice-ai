import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  href?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 44, text: "text-2xl" },
};

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="14" fill="#1B4DFF" />
      <path
        d="M14 18.5C14 16.0147 16.0147 14 18.5 14H29.5C31.9853 14 34 16.0147 34 18.5V22.2C34 23.3046 33.1046 24.2 32 24.2H16C14.8954 24.2 14 23.3046 14 22.2V18.5Z"
        fill="white"
      />
      <path
        d="M16 25.5H32V31.5C32 33.9853 29.9853 36 27.5 36H20.5C18.0147 36 16 33.9853 16 31.5V25.5Z"
        fill="#B8FF3C"
      />
      <circle cx="24" cy="20" r="2.2" fill="#1B4DFF" />
      <path
        d="M36.5 11.2L37.35 13.35L39.5 14.2L37.35 15.05L36.5 17.2L35.65 15.05L33.5 14.2L35.65 13.35L36.5 11.2Z"
        fill="#C8FF5A"
      />
      <path
        d="M41 17.5L41.45 18.65L42.6 19.1L41.45 19.55L41 20.7L40.55 19.55L39.4 19.1L40.55 18.65L41 17.5Z"
        fill="white"
        fillOpacity="0.9"
      />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
  href = "/",
  size = "md",
}: LogoProps) {
  const s = sizeMap[size];
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={s.icon} />
      {showWordmark ? (
        <span className={cn("font-display font-bold tracking-tight text-foreground", s.text)}>
          FairPrice<span className="text-primary"> AI</span>
        </span>
      ) : (
        <span className="sr-only">FairPrice AI</span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus-visible:rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
