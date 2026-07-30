'use client'

import { useState, useEffect } from 'react'
import { X, Share, PlusSquare, Download } from 'lucide-react'

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true) // assume true to prevent flash
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if it's already installed
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true
    setIsStandalone(isPwa)

    if (isPwa) return // Don't show if already installed

    // Detect iOS
    const ua = window.navigator.userAgent
    const webkit = !!ua.match(/WebKit/i)
    const isIPad = !!ua.match(/iPad/i)
    const isIPhone = !!ua.match(/iPhone/i)
    const isIOSDevice = isIPad || isIPhone
    
    if (isIOSDevice && webkit && !ua.match(/CriOS/i)) {
      setIsIOS(true)
      // Check if we should show (don't pester every single time, maybe check localStorage)
      const hasDismissed = localStorage.getItem('installPromptDismissed')
      if (!hasDismissed) {
        // Show after a small delay
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    // Android/Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      const hasDismissed = localStorage.getItem('installPromptDismissed')
      if (!hasDismissed) {
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    localStorage.setItem('installPromptDismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl p-4 border border-slate-100 flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 mt-1">
          <Download className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-sm">Instalar Aplicação</h3>
          
          {isIOS ? (
            <p className="text-xs text-slate-500 mt-1 mb-2 leading-relaxed">
              Instale o Mezzo para um acesso mais rápido: toque em <Share className="w-3 h-3 inline text-blue-500 mx-0.5" /> abaixo e depois em <strong>Adicionar ao Ecrã Principal</strong> <PlusSquare className="w-3 h-3 inline text-slate-600 mx-0.5" />
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1 mb-2 leading-relaxed">
              Adicione o Mezzo ao ecrã inicial para uma experiência mais rápida.
            </p>
          )}

          <div className="flex gap-2">
            {!isIOS && deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="flex-1 btn-primary-gradient text-white text-xs font-bold py-2 rounded-lg shadow-sm"
              >
                Instalar agora
              </button>
            )}
            <button 
              onClick={dismissPrompt}
              className={`text-xs font-bold py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors ${(!isIOS && deferredPrompt) ? 'flex-1' : 'w-full'}`}
            >
              Agora não
            </button>
          </div>
        </div>
        <button onClick={dismissPrompt} className="text-slate-400 p-1 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
