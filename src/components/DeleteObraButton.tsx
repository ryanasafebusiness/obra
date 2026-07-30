'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function DeleteObraButton({ id, nome }: { id: string, nome: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm(`Tem a certeza que deseja apagar a obra "${nome}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
      
      router.push('/obras')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Erro ao apagar obra')
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="w-full mt-8 py-4 rounded-2xl bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-5 h-5" />
      {deleting ? 'A apagar...' : 'Apagar Obra'}
    </button>
  )
}
