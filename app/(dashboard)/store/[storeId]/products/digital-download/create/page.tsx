import { StyleForm } from "./StyleForm";
import { CheckoutForm } from "./checkout/CheckoutForm";
import { OptionsForm } from "./options/OptionsForm";

interface DigitalDownloadCreatePageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ step?: string }>;
}

export default async function DigitalDownloadCreatePage({ 
  params, 
  searchParams 
}: DigitalDownloadCreatePageProps) {
  const { storeId } = await params;
  const { step = "thumbnail" } = await searchParams;

  const renderStep = () => {
    switch (step) {
      case "checkout":
        return <CheckoutForm />;
      case "options":
        return <OptionsForm />;
      default:
        return <StyleForm />;
    }
  };

  return renderStep();
} 