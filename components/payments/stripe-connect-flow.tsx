"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  Circle, 
  DollarSign, 
  CreditCard, 
  Building2, 
  FileText, 
  Calendar,
  Shield,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Info,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type StripeConnectStep = 
  | "not-started"
  | "info"
  | "connecting"
  | "verification"
  | "completed";

interface StripeConnectFlowProps {
  currentStep?: StripeConnectStep;
  onConnect?: () => void;
  stripeAccountId?: string;
  verificationStatus?: "pending" | "verified" | "requires_action";
  className?: string;
}

export function StripeConnectFlow({
  currentStep = "not-started",
  onConnect,
  stripeAccountId,
  verificationStatus = "pending",
  className
}: StripeConnectFlowProps) {
  const [step, setStep] = useState<StripeConnectStep>(currentStep);

  const steps = [
    {
      id: "info" as const,
      title: "Why Connect Stripe?",
      description: "Learn about payments and fees",
      icon: Info,
      completed: step !== "not-started"
    },
    {
      id: "connecting" as const,
      title: "Connect Account",
      description: "Link your Stripe account",
      icon: CreditCard,
      completed: step === "verification" || step === "completed"
    },
    {
      id: "verification" as const,
      title: "Verify Identity",
      description: "Complete verification",
      icon: Shield,
      completed: step === "completed"
    },
    {
      id: "completed" as const,
      title: "Start Earning",
      description: "Receive payments",
      icon: CheckCircle2,
      completed: step === "completed"
    }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Payment Setup
          </CardTitle>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {currentStepIndex + 1} of {steps.length} steps
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent>
          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.id;
              const isCompleted = stepItem.completed;
              const isLast = index === steps.length - 1;

              return (
                <div key={stepItem.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                        isCompleted
                          ? "bg-green-500 border-green-500"
                          : isActive
                          ? "bg-purple-500 border-purple-500"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isCompleted || isActive
                            ? "text-white"
                            : "text-slate-400"
                        )}
                      />
                    </div>
                    <p
                      className={cn(
                        "text-xs font-medium mt-2 text-center max-w-[80px]",
                        isActive
                          ? "text-purple-600 dark:text-purple-400"
                          : isCompleted
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {stepItem.title}
                    </p>
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2",
                        isCompleted
                          ? "bg-green-500"
                          : "bg-slate-200 dark:bg-slate-700"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === "not-started" && (
          <motion.div
            key="not-started"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StepNotStarted onStart={() => setStep("info")} />
          </motion.div>
        )}

        {step === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StepInfo onNext={() => setStep("connecting")} />
          </motion.div>
        )}

        {step === "connecting" && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StepConnecting 
              onConnect={() => {
                onConnect?.();
                setStep("verification");
              }} 
            />
          </motion.div>
        )}

        {step === "verification" && (
          <motion.div
            key="verification"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StepVerification 
              status={verificationStatus}
              onComplete={() => setStep("completed")}
            />
          </motion.div>
        )}

        {step === "completed" && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StepCompleted stripeAccountId={stripeAccountId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Step Components

function StepNotStarted({ onStart }: { onStart: () => void }) {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border-dashed">
      <CardContent className="p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <DollarSign className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Ready to Get Paid?</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Connect your Stripe account to start receiving payments from your products and courses.
        </p>
        <Button size="lg" onClick={onStart} className="gap-2">
          Get Started
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function StepInfo({ onNext }: { onNext: () => void }) {
  const features = [
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Industry-leading security with Stripe"
    },
    {
      icon: TrendingUp,
      title: "Instant Payouts",
      description: "Receive funds within 2-7 business days"
    },
    {
      icon: Building2,
      title: "Bank Integration",
      description: "Direct deposit to your bank account"
    },
    {
      icon: FileText,
      title: "Transaction History",
      description: "Detailed records for tax reporting"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Why Connect Stripe?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
              >
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fees Breakdown */}
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Fee Structure</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>Platform Fee: <strong>10%</strong> of each sale</li>
                <li>Stripe Processing: <strong>2.9% + $0.30</strong> per transaction</li>
                <li>You keep the rest! 💰</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Example */}
        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <h4 className="font-medium text-sm mb-3 text-green-900 dark:text-green-100">
            Example: $50 Product Sale
          </h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sale Price</span>
              <span className="font-medium">$50.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee (10%)</span>
              <span className="text-red-600">-$5.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stripe Fee (2.9% + $0.30)</span>
              <span className="text-red-600">-$1.76</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-800">
              <span className="font-semibold text-green-700 dark:text-green-300">
                You Receive
              </span>
              <span className="font-bold text-lg text-green-700 dark:text-green-300">
                $43.24
              </span>
            </div>
          </div>
        </div>

        <Button onClick={onNext} className="w-full gap-2" size="lg">
          Continue to Connection
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function StepConnecting({ onConnect }: { onConnect: () => void }) {
  const requirements = [
    "Valid government-issued ID",
    "Business or personal bank account",
    "Tax identification number (SSN or EIN)",
    "Business address (if applicable)"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Your Stripe Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Clock className="w-4 h-4" />
          <AlertDescription>
            Setup takes about <strong>5 minutes</strong>. Have your bank details and ID ready.
          </AlertDescription>
        </Alert>

        <div>
          <h4 className="font-medium mb-3">What You'll Need:</h4>
          <div className="space-y-2">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <span className="text-sm text-muted-foreground">{req}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Your data is secure
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Stripe uses bank-level encryption. We never see your full banking details.
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={onConnect} 
          className="w-full gap-2" 
          size="lg"
        >
          <CreditCard className="w-4 h-4" />
          Connect with Stripe
          <ExternalLink className="w-4 h-4" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          You'll be redirected to Stripe's secure platform
        </p>
      </CardContent>
    </Card>
  );
}

function StepVerification({ 
  status, 
  onComplete 
}: { 
  status: "pending" | "verified" | "requires_action";
  onComplete: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Your Identity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {status === "pending" && (
          <>
            <Alert>
              <Clock className="w-4 h-4" />
              <AlertDescription>
                Verification typically takes <strong>1-2 business days</strong>. We'll email you when it's complete.
              </AlertDescription>
            </Alert>

            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 animate-pulse" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Verification in Progress</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Stripe is reviewing your information
              </p>
              <Badge variant="secondary" className="text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
                Pending Review
              </Badge>
            </div>
          </>
        )}

        {status === "requires_action" && (
          <>
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Additional information needed to complete verification.
              </AlertDescription>
            </Alert>

            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Action Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please provide additional documentation
              </p>
              <Button>
                <ExternalLink className="w-4 h-4 mr-2" />
                Complete Verification
              </Button>
            </div>
          </>
        )}

        {status === "verified" && (
          <>
            <Alert className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Your account has been verified! You can now receive payments.
              </AlertDescription>
            </Alert>

            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Verification Complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You're all set to start earning
              </p>
              <Button onClick={onComplete} size="lg">
                Continue to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StepCompleted({ stripeAccountId }: { stripeAccountId?: string }) {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
      <CardContent className="p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-2">You're Ready to Earn! 🎉</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Your Stripe account is connected and verified. Start selling your products and courses!
        </p>

        {stripeAccountId && (
          <div className="bg-white dark:bg-black rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-xs text-muted-foreground mb-1">Connected Account</p>
            <p className="font-mono text-sm">{stripeAccountId}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="default" size="lg">
            Create First Product
          </Button>
          <Button variant="outline" size="lg">
            View Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

