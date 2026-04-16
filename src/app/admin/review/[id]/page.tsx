'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

interface DraftData {
  id: string
  job_id: string
  listing_headline: string
  story_narrative: string
  confidence_score: number
  confidence_notes: string
  has_total_loss: boolean
  has_structural_damage: boolean
  has_airbag_deployment: boolean
  has_flood_damage: boolean
  has_rebuilt_title: boolean
  output_data: any
}

interface JobData {
  id: string
  vin: string
  status: string
  disclosure_path: string
  created_at: string
}

export default function ReviewVehicle() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<JobData | null>(null)
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Editable fields
  const [headline, setHeadline] = useState('')
  const [narrative, setNarrative] = useState('')

  useEffect(() => {
    fetchData()
  }, [jobId])

  const fetchData = async () => {
    try {
      // Fetch job
      const jobResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/vehicle_processing_jobs?id=eq.${jobId}`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY || ''}`
          }
        }
      )
      const jobData = await jobResponse.json()
      if (jobData.length > 0) {
        setJob(jobData[0])
      }

      // Fetch draft
      const draftResponse = await fetch(`/api/vehicle/draft?jobId=${jobId}`)
      const draftData = await draftResponse.json()
      if (draftData.draft) {
        setDraft(draftData.draft)
        setHeadline(draftData.draft.listing_headline || '')
        setNarrative(draftData.draft.story_narrative || '')
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/vehicle/draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          edits: {
            listing_headline: headline,
            story_narrative: narrative
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save')
      }

      setSuccess('Draft saved successfully!')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this disclosure? It will be live on your website.')) {
      return
    }

    setPublishing(true)
    setError('')

    try {
      const response = await fetch('/api/vehicle/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          userId: 'admin',
          finalOutput: {
            listing_headline: headline,
            story_narrative: narrative
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to publish')
      }

      setSuccess('Published successfully!')
      router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setPublishing(false)
    }
  }

  const handleRegenerate = async (section: string) => {
    try {
      const response = await fetch('/api/vehicle/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          section,
          instruction: ''
        })
      })

      const data = await response.json()

      if (data.success) {
        if (section === 'headline') setHeadline(data.regeneratedText)
        if (section === 'narrative') setNarrative(data.regeneratedText)
      }
    } catch (err) {
      console.error('Regenerate error:', err)
    }
  }

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review Disclosure</h1>
              <p className="text-gray-600 mt-1 font-mono">{job?.vin}</p>
            </div>
            <div className="flex items-center gap-3">
              {job?.disclosure_path && (
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  job.disclosure_path === 'A' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  Path {job.disclosure_path}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                job?.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {job?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Confidence Score */}
        {draft?.confidence_score && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-blue-900">AI Confidence Score</span>
                <p className="text-sm text-blue-700">{draft.confidence_notes}</p>
              </div>
              <div className="text-3xl font-bold text-blue-900">{draft.confidence_score}%</div>
            </div>
          </div>
        )}

        {/* LOCKED FIELDS - OMVIC Required */}
        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">LOCKED - OMVIC Required</h2>
          </div>

          {/* History Flags */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {draft?.has_total_loss && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-xs text-red-600 font-semibold uppercase">Total Loss</div>
                <div className="text-red-800 font-medium">Yes</div>
              </div>
            )}
            {draft?.has_structural_damage && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-xs text-red-600 font-semibold uppercase">Structural Damage</div>
                <div className="text-red-800 font-medium">Yes</div>
              </div>
            )}
            {draft?.has_airbag_deployment && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-xs text-red-600 font-semibold uppercase">Airbag Deployment</div>
                <div className="text-red-800 font-medium">Yes</div>
              </div>
            )}
            {draft?.has_flood_damage && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-xs text-red-600 font-semibold uppercase">Flood Damage</div>
                <div className="text-red-800 font-medium">Yes</div>
              </div>
            )}
            {draft?.has_rebuilt_title && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-xs text-red-600 font-semibold uppercase">Rebuilt Title</div>
                <div className="text-red-800 font-medium">Yes</div>
              </div>
            )}
          </div>

          {!(draft?.has_total_loss || draft?.has_structural_damage || draft?.has_airbag_deployment || draft?.has_flood_damage || draft?.has_rebuilt_title) && (
            <p className="text-gray-600 text-sm">No major history flags detected.</p>
          )}

          <p className="text-gray-600 text-xs mt-4">
            These fields are locked and cannot be modified. They are required for OMVIC compliance.
          </p>
        </div>

        {/* EDITABLE: Headline */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Listing Headline</h2>
            <button
              onClick={() => handleRegenerate('headline')}
              className="text-sm text-[#C8102E] hover:underline"
            >
              Regenerate
            </button>
          </div>
          <textarea
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
          />
          <p className="text-gray-500 text-sm mt-2">
            Max 12 words. Current: {headline.split(/\s+/).filter(Boolean).length} words
          </p>
        </div>

        {/* EDITABLE: Narrative */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Disclosure Narrative</h2>
            <button
              onClick={() => handleRegenerate('narrative')}
              className="text-sm text-[#C8102E] hover:underline"
            >
              Regenerate
            </button>
          </div>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-transparent"
          />
          <p className="text-gray-500 text-sm mt-2">
            Target: 500-800 words. Current: {getWordCount(narrative)} words
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-4 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || job?.status === 'published'}
            className="flex-1 bg-[#C8102E] hover:bg-[#a00d26] text-white font-semibold py-4 rounded-lg transition disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : job?.status === 'published' ? 'Already Published' : 'Publish Disclosure'}
          </button>
        </div>
      </div>
    </div>
  )
}
