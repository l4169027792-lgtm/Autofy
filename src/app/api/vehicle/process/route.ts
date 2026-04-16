// API Route: POST /api/vehicle/process
// Receives VIN and files, initiates AI processing

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing environment variables:', { 
        hasUrl: !!SUPABASE_URL, 
        hasKey: !!SUPABASE_ANON_KEY 
      })
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { vin, files, photos } = body

    if (!vin) {
      return NextResponse.json(
        { error: 'VIN is required' },
        { status: 400 }
      )
    }

    // Create a new processing job
    const jobResponse = await fetch(`${SUPABASE_URL}/rest/v1/vehicle_processing_jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        vin: vin,
        status: 'pending',
        uploaded_files: files || [],
        uploaded_photos: photos || [],
        created_at: new Date().toISOString()
      })
    })

    if (!jobResponse.ok) {
      const errorData = await jobResponse.json()
      return NextResponse.json(
        { error: 'Failed to create job', details: errorData },
        { status: 500 }
      )
    }

    const jobData = await jobResponse.json()
    const job = jobData[0]

    // Create audit log entry
    await fetch(`${SUPABASE_URL}/rest/v1/vehicle_audit_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        job_id: job.id,
        action_type: 'created',
        changes_summary: 'Vehicle processing job created',
        created_at: new Date().toISOString()
      })
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      vin: vin,
      status: 'pending'
    })

  } catch (error) {
    console.error('Error creating processing job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Retrieve processing job status
export async function GET(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const vin = searchParams.get('vin')

    if (!jobId && !vin) {
      return NextResponse.json(
        { error: 'jobId or vin is required' },
        { status: 400 }
      )
    }

    let url = `${SUPABASE_URL}/rest/v1/vehicle_processing_jobs?`
    if (jobId) url += `id=eq.${jobId}`
    if (vin) url += `vin=eq.${vin}`

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch job')
    }

    const data = await response.json()

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data[0])

  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
