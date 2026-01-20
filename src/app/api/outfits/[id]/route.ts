import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: {
    id: string
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = createClient()

  const id = Number(context.params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid outfit id' }, { status: 400 })
  }

  let payload: Record<string, unknown> | null = null
  try {
    payload = await request.json()
  } catch {
    payload = null
  }

  if (!payload || Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Empty update payload' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('outfits')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
