// API Route: /api/vehicle/draft
// Save draft edits, check compliance

import { NextRequest, NextResponse } from 'next/server'

// Config with fallback values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hhifxpouzuwzbmrbegmg.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Zf_OlRWyy5Z2opeTe1Nh5w_RxIQC4vg'

// Banned phrases for OMVIC compliance
const BANNED_PHRASES = ['not a write-off', 'not salvage', 'not a total loss', 'was never in an accident']

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, edits, userId } = body

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Get current draft
    const draftResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicle_ai_outputs?job_id=eq.${jobId}&version_type=eq.draft`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
    )
    const draftData = await draftResponse.json()

    if (draftData.length === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    const currentDraft = draftData[0]

    // Check compliance
    if (edits.story_narrative) {
      const narrativeLower = edits.story_narrative.toLowerCase()
      for (const phrase of BANNED_PHRASES) {
        if (narrativeLower.includes(phrase)) {
          return NextResponse.json({
            success: false,
            complianceErrors: [`Banned phrase: "${phrase}"`],
            message: 'Compliance errors found.'
          }, { status: 400 })
        }
      }
    }

    // Merge and update
    const updatedDraft = { ...currentDraft, ...edits, updated_at: new Date().toISOString() }
    
    await fetch(
      `${SUPABASE_URL}/rest/v1/vehicle_ai_outputs?id=eq.${currentDraft.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify(updatedDraft)
      }
    )

    return NextResponse.json({ success: true, draft: updatedDraft })

  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const draftResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicle_ai_outputs?job_id=eq.${jobId}&version_type=eq.draft`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
    )
    const draftData = await draftResponse.json()

    return NextResponse.json({ draft: draftData[0] || null })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
