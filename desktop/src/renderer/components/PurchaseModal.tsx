import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { X, Coins, Check, AlertCircle, ExternalLink } from 'lucide-react'
import { Id } from '@convex/_generated/dataModel'

interface PurchaseModalProps {
  sample: {
    _id: string
    title: string
    creditPrice?: number
    coverImageUrl?: string
    bpm?: number
    key?: string
  }
  onClose: () => void
  onSuccess: () => void
}

export function PurchaseModal({ sample, onClose, onSuccess }: PurchaseModalProps) {
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const credits = useQuery(api.credits.getUserCredits)
  const purchaseSample = useMutation(api.samples.purchaseSample)

  const price = sample.creditPrice || 1
  const hasEnoughCredits = (credits?.balance || 0) >= price

  const handlePurchase = async () => {
    if (!hasEnoughCredits) {
      return
    }

    setIsPurchasing(true)
    setError(null)

    try {
      await purchaseSample({
        sampleId: sample._id as Id<"audioSamples">
      })
      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleBuyCredits = () => {
    window.electron.openExternal(
      'https://academy.pauseplayrepeat.com/credits/purchase'
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          // Success state
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold">Purchase Complete!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {sample.title} has been added to your library
            </p>
          </div>
        ) : (
          <>
            {/* Sample info */}
            <div className="mb-6 flex items-center gap-4">
              {sample.coverImageUrl ? (
                <img
                  src={sample.coverImageUrl}
                  alt={sample.title}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-secondary">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {sample.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold">{sample.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {sample.bpm && `${sample.bpm} BPM`}
                  {sample.key && ` • ${sample.key}`}
                </p>
              </div>
            </div>

            {/* Price and balance */}
            <div className="mb-6 rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="font-bold">{price}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="text-sm text-muted-foreground">Your Balance</span>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className={`font-bold ${!hasEnoughCredits ? 'text-destructive' : ''}`}>
                    {credits?.balance ?? 0}
                  </span>
                </div>
              </div>
              {!hasEnoughCredits && (
                <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Insufficient credits</span>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {hasEnoughCredits ? (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isPurchasing ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <Coins className="h-4 w-4" />
                        <span>Purchase for {price}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBuyCredits}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Buy Credits</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
