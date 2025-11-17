'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ThumbnailForm from './steps/thumbnail/ThumbnailForm';
import CheckoutForm from './steps/checkout/CheckoutForm';
import { AvailabilityForm } from './steps/availability/AvailabilityForm';
import { OptionsForm } from './steps/options/OptionsForm';
import { PricingModelForm } from './steps/PricingModelForm';
import { FollowGateForm } from './steps/FollowGateForm';

function CoachingCallContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'details';

  switch (step) {
    case 'details':
    case 'thumbnail': // Legacy support
      return <ThumbnailForm />;
    case 'pricing':
      return <PricingModelForm />;
    case 'checkout':
      return <CheckoutForm />;
    case 'followGate':
      return <FollowGateForm />;
    case 'availability':
      return <AvailabilityForm />;
    case 'options':
      return <OptionsForm />;
    default:
      return <ThumbnailForm />;
  }
}

export default function CoachingCallWizardPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    }>
      <CoachingCallContent />
    </Suspense>
  );
} 