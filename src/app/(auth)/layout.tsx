export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 mb-4 shadow-lg shadow-orange-500/20">
            <span className="text-4xl">🏗️</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">ObraCalc PT</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Cálculos e orçamentos para construção civil
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
