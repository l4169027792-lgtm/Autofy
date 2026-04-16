// API Route: /api/vehicle/regenerate
// Regenerate specific sections using Claude AI

import { NextRequest, NextResponse } from 'next/server'

// Regeneration prompts for each section
const REGENERATION_PROMPTS: Record<string, string> = {
  headline: 'Rewrite the listing headline. Keep it under 12 words, OMVIC-compliant, and engaging.',
  narrative: 'Rewrite the full disclosure narrative. Keep it 500-800 words, honest, buyer-first.',
  caption: 'Rewrite this photo caption. Be descriptive but concise.',
  damage: 'Rewrite this damage description. Be accurate but professional.'
}

export async function POST(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const { jobId, section, instruction, context, userId } = body

    if (!jobId || !section) {
      return NextResponse.json(
        { error: 'Job ID and section are required' },
        { status: 400 }
      )
    }

    // Get current draft
    const draftResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicle_ai_outputs?job_id=eq.${jobId}&version_type=eq.draft`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )
    const draftData = await draftResponse.json()

    if (draftData.length === 0) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    const draft = draftData[0]

    // Build regeneration prompt
    let prompt = REGENERATION_PROMPTS[section] || 'Regenerate this section.'
    
    if (instruction) {
      prompt += ` Additional instructions: ${instruction}`
    }

    // Add context based on section
    const sectionContext = getSectionContext(section, draft, context)
    
    const fullPrompt = `${prompt}

CONTEXT:
${sectionContext}

Return ONLY the regenerated text for the ${section} section. No explanation. No preamble.`

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
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      return NextResponse.json(
        { error: 'Claude API error', details: errorText },
        { status: 500 }
      )
    }

    const claudeData = await claudeResponse.json()
    const regeneratedText = claudeData.content?.[0]?.text?.trim() || ''

    // Update the draft with regenerated content
    const updateField = getUpdateField(section)
    const updates: any = {}
    updates[updateField] = regeneratedText

    await fetch(
      `${SUPABASE_URL}/rest/v1/vehicle_ai_outputs?id=eq.${draft.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(updates)
      }
    )

    // Create audit log
    await fetch(`${SUPABASE_URL}/rest/v1/vehicle_audit_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        job_id: jobId,
        action_type: 'section_regenerated',
        performed_by: userId,
        changes_summary: `Regenerated ${section}`,
        previous_value: getPreviousValue(section, draft),
        new_value: regeneratedText,
        created_at: new Date().toISOString()
      })
    })

    return NextResponse.json({
      success: true,
      section: section,
      regeneratedText: regeneratedText
    })

  } catch (error) {
    console.error('Error regenerating section:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getSectionContext(section: string, draft: any, extraContext?: string): string {
  const baseContext = {
    headline: `Current headline: ${draft.listing_headline || 'N/A'}\nVIN: ${draft.output_data?.vehicle_identity?.vin || 'N/A'}\nVehicle: ${draft.output_data?.vehicle_identity?.year || ''} ${draft.output_data?.vehicle_identity?.make || ''} ${draft.output_data?.vehicle_identity?.model || ''}`,
    narrative: `Current narrative:\n${draft.story_narrative || 'N/A'}\n\nDisclosure path: ${draft.output_data?.disclosure_path || 'N/A'}\nHistory flags: ${JSON.stringify(draft.output_data?.history_flags || {})}`,
    caption: `Current caption:\n${extraContext || 'N/A'}\n\nVehicle: ${draft.output_data?.vehicle_identity?.year || ''} ${draft.output_data?.vehicle_identity?.make || ''} ${draft.output_data?.vehicle_identity?.model || ''}`,
    damage: `Current damage description:\n${extraContext || 'N/A'}\n\nVehicle history: ${draft.output_data?.disclosure_path || 'N/A'}`
  }
  
  return baseContext[section as keyof typeof baseContext] || JSON.stringify(draft.output_data || {})
}

function getUpdateField(section: string): string {
  const fields: Record<string, string> = {
    headline: 'listing_headline',
    narrative: 'story_narrative',
    caption: 'caption_text',
    damage: 'damage_description'
  }
  return fields[section] || section
}

function getPreviousValue(section: string, draft: any): string {
  const values: Record<string, string> = {
    headline: draft.listing_headline,
    narrative: draft.story_narrative
  }
  return values[section] || 'N/A'
}
