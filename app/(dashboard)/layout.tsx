import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar usuario={usuario} />
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
