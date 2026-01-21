import { useState, useEffect } from 'react'
import { Music, Download, MousePointer2, Settings, ChevronRight, X } from 'lucide-react'

interface OnboardingStep {
  icon: React.ReactNode
  title: string
  description: string
}

const steps: OnboardingStep[] = [
  {
    icon: <Music className="h-12 w-12" />,
    title: 'Browse & Preview',
    description: 'Explore thousands of samples. Click any sample to preview it instantly.'
  },
  {
    icon: <Download className="h-12 w-12" />,
    title: 'Purchase with Credits',
    description: 'Use your credits to purchase samples. They download automatically to your library.'
  },
  {
    icon: <MousePointer2 className="h-12 w-12" />,
    title: 'Drag to DAW',
    description: 'Drag any owned sample directly into your DAW. Just click and drag!'
  },
  {
    icon: <Settings className="h-12 w-12" />,
    title: 'Customize',
    description: 'Set your download folder and preferences in Settings.'
  }
]

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const step = steps[currentStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step indicator */}
        <div className="mb-8 flex justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-primary'
                  : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 rounded-full bg-primary/10 p-4 text-primary">
            {step.icon}
          </div>
          <h2 className="mb-3 text-2xl font-bold">{step.title}</h2>
          <p className="mb-8 text-muted-foreground">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip tour
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              'Get Started'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    window.electron.storeGet('onboardingComplete').then((complete) => {
      setShowOnboarding(!complete)
      setIsLoading(false)
    })
  }, [])

  const completeOnboarding = () => {
    window.electron.storeSet('onboardingComplete', true)
    setShowOnboarding(false)
  }

  return {
    showOnboarding,
    isLoading,
    completeOnboarding
  }
}
