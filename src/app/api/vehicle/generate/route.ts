// API Route: POST /api/vehicle/generate
// Calls Claude API to analyze documents and generate disclosure

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!

// System prompt for Claude (from Vehicle Story Engine spec)
const SYSTEM_PROMPT = `You are the Autofy Vehicle Disclosure Specialist – an AI trained to analyze automotive documents and photos, extract accurate vehicle data, and write honest, buyer-first disclosure narratives for Canadian used car listings.

You work exclusively for Autofy – a transparency-first used vehicle platform operating under OMVIC (Ontario Motor Vehicle Industry Council) regulations. Every vehicle you process gets its own complete, standalone disclosure story. You never blend data across multiple vehicles.

YOUR ROLE

You will receive a set of files for a single vehicle. These may include:
- Carfax PDF reports
- Damage assessment documents
- Repair estimates
- Auction reports
- Photos of the vehicle

TASK

Analyze all provided documents and photos, then extract and generate:

1. VEHICLE IDENTITY
- VIN (Vehicle Identification Number)
- Year, Make, Model, Trim
- Odometer reading
- Title status
- Source document reference

2. DISCLOSURE PATH
- Path A: History issues present (accident damage, total loss, structural damage, airbag deployment, rebuilt title, etc.)
- Path B: Clean vehicle with no significant history issues

3. HISTORY FLAGS (All extracted from documents, never invented)
- has_total_loss
- has_structural_damage
- has_airbag_deployment
- has_flood_damage
- has_rebuilt_title
- has_accident_damage
- has_odometer_rollback

4. DAMAGE ASSESSMENT
- Each damaged panel with description
- Damage severity (minor/moderate/major/severe)
- Repair status and quality notes

5. PHOTO ANALYSIS
- Description of visible damage in each photo
- Damage severity visible
- Repair quality assessment

6. UNDISCLOSED DAMAGE FLAGS
- Any damage visible in photos but not documented

7. LISTING HEADLINE
- Short OMVIC-safe headline, max 12 words

8. STORY NARRATIVE
- Full 500-800 word buyer disclosure narrative
- Honest, buyer-first tone
- All history flags clearly disclosed
- Professional but accessible language

9. CONFIDENCE SCORE
- 0-100 based on completeness of data extracted

10. CONFIDENCE NOTES
- What data was missing or ambiguous

BANNED PHRASES
Never use these phrases:
- "not a write-off"
- "not salvage"
- "not a total loss"
- "was never in an accident"
- "good condition" without qualification
- "like new"

Always say what something IS, never deny what it is not.

OMVIC COMPLIANCE
Every disclosure must include:
- Clear statement of total loss history if applicable
- Structural damage disclosure if present
- Airbag deployment disclosure if confirmed
- All visible damage described
- VIN verification

Return ONLY valid JSON. No preamble. No explanation. No markdown fences.

Format:
{
"vehicle_identity": { VIN, year, make, model, trim, odometer, title_status },
"disclosure_path": "A" or "B",
"history_flags": {
  "has_total_loss": boolean,
  "has_structural_damage": boolean,
  "has_airbag_deployment": boolean,
  "has_flood_damage": boolean,
  "has_rebuilt_title": boolean,
  "has_accident_damage": boolean,
  "has_odometer_rollback": boolean
},
"damage_assessment": [
  {
    "panel": "string",
    "description": "string",
    "severity": "minor/moderate/major/severe",
    "repair_completed": boolean,
    "repair_quality": "string"
  }
],
"photo_analysis": [
  {
    "photo_description": "string",
    "visible_damage": "string",
    "severity": "string"
  }
],
"undisclosed_damage_flags": ["array of damage visible in photos but not on documents"],
"listing_headline": "string – short OMVIC-safe headline, max 12 words",
"story_narrative": "string – full 500-800 word buyer disclosure narrative",
"confidence_score": "number 0-100 – completeness of data extracted",
"confidence_notes": "string – what data was missing or ambiguous"
}

If a field cannot be determined from the documents, set it to null.
Never invent or assume data that is not present in the uploaded files.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, vin, pdfBase64, photoBase64Array } = body

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
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

    // Add PDF if provided
    if (pdfBase64) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64
            }
          },
          {
            type: 'text',
            text: 'Please analyze this Carfax/vehicle history document and extract all relevant information about the vehicle history, damage, and disclosures.'
          }
        ]
      })
    }

    // Add photos if provided
    if (photoBase64Array && photoBase64Array.length > 0) {
      const photoMessages = photoBase64Array.map((photoData: string, index: number) => ({
        role: 'user' as const,
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: photoData
            }
          },
          {
            type: 'text',
            text: `Please analyze this photo (${index + 1} of ${photoBase64Array.length}) and describe any visible damage, condition issues, or notable features.`
          }
        ]
      }))
      messages.push(...photoMessages)
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
        messages: messages.length > 0 ? messages : [{ role: 'user', content: 'Process this vehicle with no documents provided. Note this in your response.' }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', errorText)
      
      // Update job status to failed
      await fetch(`${SUPABASE_URL}/rest/v1/vehicle_processing_jobs?id=eq.${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
      })

      return NextResponse.json(
        { error: 'Claude API error', details: errorText },
        { status: 500 }
      )
    }

    const claudeData = await claudeResponse.json()
    const rawOutput = claudeData.content?.[0]?.text || '{}'

    // Parse the JSON output
    let aiOutput;
    try {
      aiOutput = JSON.parse(rawOutput)
    } catch (parseError) {
      // Try to extract JSON from the text
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiOutput = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse Claude response')
      }
    }

    // Save the draft output
    const draftResponse = await fetch(`${SUPABASE_URL}/rest/v1/vehicle_ai_outputs`, {
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
        confidence_notes: aiOutput.confidence_notes,
        has_total_loss: aiOutput.history_flags?.has_total_loss || false,
        has_structural_damage: aiOutput.history_flags?.has_structural_damage || false,
        has_airbag_deployment: aiOutput.history_flags?.has_airbag_deployment || false,
        has_flood_damage: aiOutput.history_flags?.has_flood_damage || false,
        has_rebuilt_title: aiOutput.history_flags?.has_rebuilt_title || false,
        damage_summary: aiOutput.damage_assessment ? JSON.stringify(aiOutput.damage_assessment) : null,
        undisclosed_damage_flags: aiOutput.undisclosed_damage_flags || [],
        created_at: new Date().toISOString()
      })
    })

    // Update job status to draft/review
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
        processing_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

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
        action_type: 'draft_generated',
        changes_summary: 'AI draft generated successfully',
        snapshot_data: aiOutput,
        created_at: new Date().toISOString()
      })
    })

    return NextResponse.json({
      success: true,
      jobId: jobId,
      status: 'draft',
      disclosurePath: aiOutput.disclosure_path,
      confidenceScore: aiOutput.confidence_score,
      output: aiOutput
    })

  } catch (error) {
    console.error('Error generating disclosure:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
