import { BundleForm } from "./BundleForm";

interface BundleCreatePageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ step?: string }>;
}

export default async function BundleCreatePage({ 
  params, 
  searchParams 
}: BundleCreatePageProps) {
  const { storeId } = await params;
  const { step = "info" } = await searchParams;

  const renderStep = () => {
    switch (step) {
      case "products":
        return <div>Product Selection Step - Coming Soon</div>;
      case "pricing":
        return <div>Pricing Step - Coming Soon</div>;
      default:
        return <BundleForm />;
    }
  };

  return renderStep();
}
