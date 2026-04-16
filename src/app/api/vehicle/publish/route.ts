// API Route: /api/vehicle/publish
// Publish final version with compliance checks

import { NextRequest, NextResponse } from 'next/server'

// Locked fields that cannot be modified
const LOCKED_FLAGS = ['total_loss', 'structural_damage', 'airbag_deployment', 'flood_damage', 'rebuilt_title']

// Check for compliance issues before publishing
async function checkPublishCompliance(SUPABASE_URL: string, SUPABASE_ANON_KEY: string, jobId: string, narrative: string, historyFlags: any) {
  const warnings: { type: string, message: string }[] = []
  
  // Check if locked flags exist in draft
  if (historyFlags?.has_total_loss && !narrative?.toLowerCase().includes('total loss')) {
    warnings.push({
      type: 'compliance',
      message: 'Total loss history must be mentioned in the published narrative'
    })
  }
  
  if (historyFlags?.has_structural_damage && !narrative?.toLowerCase().includes('structural')) {
    warnings.push({
      type: 'compliance',
      message: 'Structural damage must be disclosed in the published narrative'
    })
  }
  
  if (historyFlags?.has_airbag_deployment && !narrative?.toLowerCase().includes('airbag')) {
    warnings.push({
      type: 'compliance',
      message: 'Airbag deployment must be mentioned in the published narrative'
    })
  }
  
  // Check for unresolved compliance warnings
  const warningsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/compliance_warnings?job_id=eq.${jobId}&is_resolved=eq.false`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  )
  const unresolvedWarnings = await warningsResponse.json()
  
  return {
    warnings,
    unresolvedWarnings
  }
}

// POST: Publish the vehicle
export async function POST(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const { jobId, userId, finalOutput } = body

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get current job
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

    const job = jobData[0]

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
        { error: 'Draft not found. Generate AI output first.' },
        { status: 400 }
      )
    }

    const draft = draftData[0]
    const narrative = finalOutput?.story_narrative || draft.story_narrative

    // Check compliance before publishing
    const compliance = await checkPublishCompliance(SUPABASE_URL, SUPABASE_ANON_KEY, jobId, narrative, draft)

    // Combine all warnings
    const allWarnings = [
      ...compliance.warnings,
      ...compliance.unresolvedWarnings.map((w: any) => ({
        type: w.warning_type,
        message: w.warning_message
      }))
    ]

    if (allWarnings.length > 0) {
      return NextResponse.json({
        success: false,
        complianceErrors: allWarnings,
        message: 'Cannot publish. Please resolve all compliance issues first.'
      }, { status: 400 })
    }

    // Create published version
    const publishedOutput = {
      job_id: jobId,
      version_type: 'published',
      output_data: {
        ...draft.output_data,
        ...finalOutput
      },
      listing_headline: finalOutput?.listing_headline || draft.listing_headline,
      story_narrative: finalOutput?.story_narrative || draft.story_narrative,
      confidence_score: draft.confidence_score,
      confidence_notes: draft.confidence_notes,
      has_total_loss: draft.has_total_loss,
      has_structural_damage: draft.has_structural_damage,
      has_airbag_deployment: draft.has_airbag_deployment,
      has_flood_damage: draft.has_flood_damage,
      has_rebuilt_title: draft.has_rebuilt_title,
      damage_summary: draft.damage_summary,
      undisclosed_damage_flags: draft.undisclosed_damage_flags,
      created_at: new Date().toISOString(),
      created_by: userId
    }

    // Insert published version
    const publishResponse = await fetch(`${SUPABASE_URL}/rest/v1/vehicle_ai_outputs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(publishedOutput)
    })

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json()
      return NextResponse.json(
        { error: 'Failed to publish', details: errorData },
        { status: 500 }
      )
    }

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
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    )

    // Create audit log entry
    await fetch(`${SUPABASE_URL}/rest/v1/vehicle_audit_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        job_id: jobId,
        action_type: 'published',
        performed_by: userId,
        changes_summary: 'Vehicle story published successfully',
        snapshot_data: publishedOutput,
        created_at: new Date().toISOString()
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Vehicle published successfully',
      jobId: jobId,
      vin: job.vin,
      disclosurePath: job.disclosure_path,
      publishedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error publishing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Get published version
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

    // Get published output
    const publishResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicle_ai_outputs?job_id=eq.${jobId}&version_type=eq.published`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )
    const publishData = await publishResponse.json()

    // Get job details
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

    return NextResponse.json({
      published: publishData[0] || null,
      job: jobData[0] || null
    })

  } catch (error) {
    console.error('Error fetching published:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
