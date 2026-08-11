import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-background-muted">
      <AdminSidebar className="hidden md:flex" />
      <div className="min-w-0 flex-1">
        <div className="border-b border-border bg-white px-6 py-4 md:hidden">
          <p className="font-display text-sm font-semibold">FairPrice Admin</p>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
