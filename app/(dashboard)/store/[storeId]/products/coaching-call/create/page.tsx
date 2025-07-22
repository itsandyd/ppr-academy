'use client';

import { useSearchParams } from 'next/navigation';
import ThumbnailForm from './steps/thumbnail/ThumbnailForm';
import CheckoutForm from './steps/checkout/CheckoutForm';
import { AvailabilityForm } from './steps/availability/AvailabilityForm';
import { OptionsForm } from './steps/options/OptionsForm';

interface CoachingCallCreatePageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ step?: string }>;
}

export default function CoachingCallWizardPage() {
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'thumbnail';
  
  if (step === 'thumbnail') return <ThumbnailForm />;
  if (step === 'checkout') return <CheckoutForm />;
  if (step === 'availability') return <AvailabilityForm />;
  if (step === 'options') return <OptionsForm />;
  return <ThumbnailForm />;
} 