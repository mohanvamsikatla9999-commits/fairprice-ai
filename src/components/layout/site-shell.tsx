"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";

type MeUser = {
  name: string;
  email?: string;
  image?: string;
} | null;

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/admin");
  const [user, setUser] = React.useState<MeUser>(null);
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);

  React.useEffect(() => {
    if (isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meJson = await meRes.json();
        if (!cancelled && meJson.ok && meJson.data?.user) {
          const u = meJson.data.user;
          setUser({
            name: u.displayName || u.name || u.email,
            email: u.email,
            image: u.avatarUrl ?? undefined,
          });

          const needsFace = Boolean(meJson.data.requiresFaceVerification);
          const onFacePage = pathname?.startsWith("/login/face");
          if (needsFace && !onFacePage) {
            const next =
              pathname &&
              pathname !== "/" &&
              !pathname.startsWith("/login") &&
              !pathname.startsWith("/register")
                ? pathname
                : "/dashboard";
            router.replace(`/login/face?next=${encodeURIComponent(next)}`);
            return;
          }

          const notifRes = await fetch("/api/notifications");
          if (notifRes.ok) {
            const nJson = await notifRes.json();
            if (!cancelled && nJson.ok) {
              setUnreadNotifications(nJson.data?.unreadCount ?? 0);
            }
          }
        }
      } catch {
        // public pages work without auth
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, pathname, router]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh pb-16 md:pb-0">
      <Navbar user={user} unreadNotifications={unreadNotifications} />
      <main>{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
