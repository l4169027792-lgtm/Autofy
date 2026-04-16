// API Route: /api/vehicle/regenerate
// Regenerate sections using Claude AI

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Config with fallback values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hhifxpouzuwzbmrbegmg.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Zf_OlRWyy5Z2opeTe1Nh5w_RxIQC4vg'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, section, instruction } = body

    if (!jobId || !section) {
      return NextResponse.json({ error: 'Job ID and section required' }, { status: 400 })
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

    const draft = draftData[0]

    // Build prompt
    const sectionContext = {
      headline: `Current: ${draft.listing_headline}`,
      narrative: `Current: ${draft.story_narrative}`
    }

    const fullPrompt = `Rewrite the ${section}. ${instruction || ''}\n\n${sectionContext[section as keyof typeof sectionContext] || ''}`

    // Call Claude
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: fullPrompt }]
      })
    })

    if (!claudeResponse.ok) {
      return NextResponse.json({ error: 'Claude API error' }, { status: 500 })
    }

    const claudeData = await claudeResponse.json()
    const regeneratedText = claudeData.content?.[0]?.text?.trim() || ''

    // Update draft
    const updateField = section === 'headline' ? 'listing_headline' : 'story_narrative'
    await fetch(
      `${SUPABASE_URL}/rest/v1/vehicle_ai_outputs?id=eq.${draft.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ [updateField]: regeneratedText })
      }
    )

    return NextResponse.json({ success: true, section, regeneratedText })

  } catch (error) {
    console.error('Error regenerating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
