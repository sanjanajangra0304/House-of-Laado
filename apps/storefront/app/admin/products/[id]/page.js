import { ProductEditClient } from "@/components/admin/ProductEditClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Product | Admin Portal",
};

export default function AdminEditProductPage({ params }) {
  return <ProductEditClient productId={params.id} />;
}
