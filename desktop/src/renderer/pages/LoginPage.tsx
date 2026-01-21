import { SignIn } from '@clerk/clerk-react'

export function LoginPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      {/* Logo and title */}
      <div className="mb-8 text-center">
        <div className="mb-4 text-4xl font-bold text-primary">PPR Samples</div>
        <p className="text-muted-foreground">
          Sign in to access your sample library
        </p>
      </div>

      {/* Clerk SignIn component */}
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-card border border-border shadow-lg',
            headerTitle: 'text-foreground',
            headerSubtitle: 'text-muted-foreground',
            formFieldLabel: 'text-foreground',
            formFieldInput: 'bg-background border-input text-foreground',
            formButtonPrimary: 'bg-primary hover:bg-primary/90',
            footerActionLink: 'text-primary hover:text-primary/90',
            identityPreviewText: 'text-foreground',
            identityPreviewEditButton: 'text-primary',
            formFieldInputShowPasswordButton: 'text-muted-foreground',
            dividerLine: 'bg-border',
            dividerText: 'text-muted-foreground',
            socialButtonsBlockButton: 'border-input bg-background text-foreground hover:bg-secondary',
            socialButtonsBlockButtonText: 'text-foreground',
          },
          variables: {
            colorPrimary: 'hsl(262, 83%, 58%)',
            colorBackground: 'hsl(0, 0%, 7%)',
            colorText: 'hsl(0, 0%, 98%)',
            colorInputBackground: 'hsl(0, 0%, 4%)',
            colorInputText: 'hsl(0, 0%, 98%)',
            borderRadius: '0.5rem',
          }
        }}
        redirectUrl="/"
      />

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>By signing in, you agree to our Terms of Service</p>
        <p className="mt-1">
          <button
            onClick={() => window.electron.openExternal('https://ppr-academy.com/privacy')}
            className="underline hover:text-foreground"
          >
            Privacy Policy
          </button>
          {' • '}
          <button
            onClick={() => window.electron.openExternal('https://ppr-academy.com/terms')}
            className="underline hover:text-foreground"
          >
            Terms of Service
          </button>
        </p>
      </div>
    </div>
  )
}
