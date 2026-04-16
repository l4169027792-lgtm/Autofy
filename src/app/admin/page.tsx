'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

interface VehicleJob {
  id: string
  vin: string
  status: string
  disclosure_path: string
  created_at: string
  updated_at: string
  published_at: string
}

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<VehicleJob[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    draft: 0,
    published: 0
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/processing_jobs_with_latest`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY || ''}`
          }
        }
      )
      const data = await response.json()
      setJobs(data || [])

      // Calculate stats
      const statsData = {
        total: data?.length || 0,
        processing: data?.filter((j: any) => j.status === 'processing').length || 0,
        draft: data?.filter((j: any) => j.status === 'draft' || j.status === 'review').length || 0,
        published: data?.filter((j: any) => j.status === 'published').length || 0
      }
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
      draft: 'bg-yellow-100 text-yellow-800',
      review: 'bg-orange-100 text-orange-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-600',
      failed: 'bg-red-100 text-red-800'
    }
    return colors[status] || colors.pending
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Story Engine</h1>
          <p className="text-gray-600 mt-2">AI-powered OMVIC-compliant vehicle disclosures</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-gray-600">Total Vehicles</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.processing}</div>
            <div className="text-gray-600">Processing</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-yellow-600">{stats.draft}</div>
            <div className="text-gray-600">In Review</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">{stats.published}</div>
            <div className="text-gray-600">Published</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Vehicle Jobs</h2>
          <Link
            href="/admin/process"
            className="bg-[#C8102E] hover:bg-[#a00d26] text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + Process New Vehicle
          </Link>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No vehicles processed yet.
              <br />
              <Link href="/admin/process" className="text-[#C8102E] hover:underline">
                Process your first vehicle
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VIN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm">{job.vin}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {job.disclosure_path ? (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          job.disclosure_path === 'A' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          Path {job.disclosure_path}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/review/${job.id}`}
                        className="text-[#C8102E] hover:underline text-sm font-medium"
                      >
                        {job.status === 'published' ? 'View' : 'Review'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
