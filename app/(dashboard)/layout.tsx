import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { AutoRefreshOnFocus } from "@/components/AutoRefreshOnFocus";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  return (
    <div className="flex min-h-screen bg-cream-50">
      <AutoRefreshOnFocus />
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar usuario={usuario} />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
