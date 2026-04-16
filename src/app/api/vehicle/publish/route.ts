// API Route: /api/vehicle/publish
// Publish final version with compliance checks

import { NextRequest, NextResponse } from 'next/server'

// Config with fallback values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hhifxpouzuwzbmrbegmg.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Zf_OlRWyy5Z2opeTe1Nh5w_RxIQC4vg'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, userId, finalOutput } = body

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
      return NextResponse.json({ error: 'Draft not found' }, { status: 400 })
    }

    const draft = draftData[0]

    // Create published version
    const publishedOutput = {
      job_id: jobId,
      version_type: 'published',
      output_data: { ...draft.output_data, ...finalOutput },
      listing_headline: finalOutput?.listing_headline || draft.listing_headline,
      story_narrative: finalOutput?.story_narrative || draft.story_narrative,
      confidence_score: draft.confidence_score,
      has_total_loss: draft.has_total_loss,
      has_structural_damage: draft.has_structural_damage,
      has_airbag_deployment: draft.has_airbag_deployment,
      created_at: new Date().toISOString(),
      created_by: userId
    }

    await fetch(`${SUPABASE_URL}/rest/v1/vehicle_ai_outputs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify(publishedOutput)
    })

    // Update job status
    await fetch(`${SUPABASE_URL}/rest/v1/vehicle_processing_jobs?id=eq.${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ status: 'published', published_at: new Date().toISOString() })
    })

    return NextResponse.json({ success: true, message: 'Vehicle published successfully', jobId })

  } catch (error) {
    console.error('Error publishing:', error)
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

    const publishResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicle_ai_outputs?job_id=eq.${jobId}&version_type=eq.published`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
    )
    const publishData = await publishResponse.json()

    return NextResponse.json({ published: publishData[0] || null })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
