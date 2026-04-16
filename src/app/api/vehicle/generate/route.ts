// API Route: POST /api/vehicle/generate
// Calls Claude API to analyze documents and generate disclosure

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Config with fallback values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hhifxpouzuwzbmrbegmg.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Zf_OlRWyy5Z2opeTe1Nh5w_RxIQC4vg'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

// System prompt for Claude (from Vehicle Story Engine spec)
const SYSTEM_PROMPT = `You are the Autofy Vehicle Disclosure Specialist...

[Same as before - truncated for brevity]

Return ONLY valid JSON. No preamble. No explanation. No markdown fences.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, vin, pdfBase64, photoBase64Array } = body

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Update job status to processing
    await fetch(`${SUPABASE_URL}/rest/v1/vehicle_processing_jobs?id=eq.${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        status: 'processing',
        processing_started_at: new Date().toISOString()
      })
    })

    // Build messages for Claude
    const messages: any[] = []
    if (pdfBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
          { type: 'text', text: 'Please analyze this Carfax/vehicle history document.' }
        ]
      })
    }

    if (photoBase64Array && photoBase64Array.length > 0) {
      messages.push(...photoBase64Array.map((photoData: string, index: number) => ({
        role: 'user' as const,
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photoData } },
          { type: 'text', text: `Analyze photo ${index + 1} of ${photoBase64Array.length}.` }
        ]
      })))
    }

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: messages.length > 0 ? messages : [{ role: 'user', content: 'Process this vehicle.' }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      return NextResponse.json({ error: 'Claude API error', details: errorText }, { status: 500 })
    }

    const claudeData = await claudeResponse.json()
    const rawOutput = claudeData.content?.[0]?.text || '{}'

    let aiOutput;
    try {
      aiOutput = JSON.parse(rawOutput)
    } catch {
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/)
      aiOutput = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    }

    // Save the draft output
    await fetch(`${SUPABASE_URL}/rest/v1/vehicle_ai_outputs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        job_id: jobId,
        version_type: 'draft',
        output_data: aiOutput,
        listing_headline: aiOutput.listing_headline,
        story_narrative: aiOutput.story_narrative,
        confidence_score: aiOutput.confidence_score,
        has_total_loss: aiOutput.history_flags?.has_total_loss || false,
        has_structural_damage: aiOutput.history_flags?.has_structural_damage || false,
        has_airbag_deployment: aiOutput.history_flags?.has_airbag_deployment || false,
        created_at: new Date().toISOString()
      })
    })

    // Update job status
    await fetch(`${SUPABASE_URL}/rest/v1/vehicle_processing_jobs?id=eq.${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        status: 'draft',
        disclosure_path: aiOutput.disclosure_path,
        updated_at: new Date().toISOString()
      })
    })

    return NextResponse.json({
      success: true,
      jobId: jobId,
      status: 'draft',
      output: aiOutput
    })

  } catch (error) {
    console.error('Error generating disclosure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
