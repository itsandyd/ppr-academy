import { UrlMediaForm } from "./UrlMediaForm";


interface UrlMediaCreatePageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ step?: string }>;
}

export default async function UrlMediaCreatePage({ 
  params, 
  searchParams 
}: UrlMediaCreatePageProps) {
  const { storeId } = await params;
  const { step = "url" } = await searchParams;

  const renderStep = () => {
    switch (step) {
      case "customize":
        return <div>Customization Step - Coming Soon</div>;
      case "style":
        return <div>Styling Step - Coming Soon</div>;
      default:
        return <UrlMediaForm />;
    }
  };

  return renderStep();
}
