import { HardHat } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 transform -rotate-6">
            <HardHat className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Mezzo</h1>
          <p className="text-slate-500 font-medium">O seu gestor de obras de bolso</p>
        </div>
        {children}
      </div>
    </div>
  )
}
