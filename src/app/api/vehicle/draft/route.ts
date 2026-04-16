// API Route: /api/vehicle/draft
// Save draft edits, check compliance before publish

import { NextRequest, NextResponse } from 'next/server'

// Banned phrases for OMVIC compliance
const BANNED_PHRASES = [
  'not a write-off',
  'not salvage',
  'not a total loss',
  'was never in an accident',
  'never been in an accident'
]

// Locked fields that cannot be modified
const LOCKED_FLAGS = ['total_loss', 'structural_damage', 'airbag_deployment', 'flood_damage', 'rebuilt_title']

// Check for compliance issues
function checkCompliance(
  narrative: string,
  historyFlags: any,
  lockedFlags: any
): { valid: boolean, warnings: string[] } {
  const warnings: string[] = []
  
  // Check banned phrases
  const narrativeLower = narrative?.toLowerCase() || ''
  for (const phrase of BANNED_PHRASES) {
    if (narrativeLower.includes(phrase.toLowerCase())) {
      warnings.push(`Banned phrase detected: \"${phrase}\"`)
    }
  }
  
  // Check if locked flags are being removed from narrative
  if (lockedFlags?.has_total_loss && !narrativeLower.includes('total loss')) {
    warnings.push('Total loss history must be mentioned in the narrative')
  }
  
  if (lockedFlags?.has_structural_damage && !narrativeLower.includes('structural')) {
    warnings.push('Structural damage must be disclosed in the narrative')
  }
  
  if (lockedFlags?.has_airbag_deployment && !narrativeLower.includes('airbag')) {
    warnings.push('Airbag deployment must be mentioned in the narrative')
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  }
}

// PUT: Save draft edits
export async function PUT(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const { jobId, edits, userId } = body

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get current job data
    const jobResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicle_processing_jobs?id=eq.${jobId}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )
    const jobData = await jobResponse.json()
    
    if (jobData.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get current draft output
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

    const currentDraft = draftData[0]

    // Check compliance if narrative was edited
    if (edits.story_narrative) {
      const compliance = checkCompliance(
        edits.story_narrative,
        currentDraft,
        currentDraft
      )
      
      if (!compliance.valid) {
        // Save compliance warning
        for (const warning of compliance.warnings) {
          await fetch(`${SUPABASE_URL}/rest/v1/compliance_warnings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              job_id: jobId,
              warning_type: 'compliance',
              warning_message: warning,
              severity: 'error',
              created_at: new Date().toISOString()
            })
          })
        }
        
        return NextResponse.json({
          success: false,
          complianceErrors: compliance.warnings,
          message: 'Compliance errors found. Please fix before saving.'
        }, { status: 400 })
      }
    }

    // Merge edits with current draft
    const updatedDraft = {
      ...currentDraft,
      ...edits,
      updated_at: new Date().toISOString()
    }

    // Update draft output
    await fetch(
      `${SUPABASE_URL}/rest/v1/vehicle_ai_outputs?id=eq.${currentDraft.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(updatedDraft)
      }
    )

    // Update job status
    await fetch(
      `${SUPABASE_URL}/rest/v1/vehicle_processing_jobs?id=eq.${jobId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          status: 'review',
          updated_at: new Date().toISOString()
        })
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
        action_type: 'draft_edited',
        performed_by: userId,
        changes_summary: `Edited fields: ${Object.keys(edits).join(', ')}`,
        previous_value: JSON.stringify(currentDraft),
        new_value: JSON.stringify(updatedDraft),
        created_at: new Date().toISOString()
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Draft saved successfully',
      draft: updatedDraft
    })

  } catch (error) {
    console.error('Error saving draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Get draft output
export async function GET(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get draft output
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

    // Get compliance warnings
    const warningsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/compliance_warnings?job_id=eq.${jobId}&is_resolved=eq.false`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )
    const warningsData = await warningsResponse.json()

    return NextResponse.json({
      draft: draftData[0] || null,
      complianceWarnings: warningsData
    })

  } catch (error) {
    console.error('Error fetching draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
