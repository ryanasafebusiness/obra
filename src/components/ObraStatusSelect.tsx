'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PROJECT_STATUS } from '@/lib/constants'
import type { Project } from '@/types/database'

export function ObraStatusSelect({ projectId, status }: { projectId: string; status: Project['status'] }) {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = async (value: Project['status']) => {
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('projects')
      .update({ status: value })
      .eq('id', projectId)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <select
        value={status}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as Project['status'])}
        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none disabled:opacity-50"
      >
        {Object.entries(PROJECT_STATUS).map(([value, info]) => (
          <option key={value} value={value}>{info.emoji} {info.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
