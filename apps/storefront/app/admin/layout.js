import { AdminAuthProvider } from "@/lib/admin-auth-context";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = {
  title: "Admin Portal | House of Laado",
  description: "E-Commerce Management Dashboard for store owner.",
};

export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
