'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function ProcessVehicle() {
  const router = useRouter()
  const [vin, setVin] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === 'application/pdf') {
        setPdfFile(file)
        setError('')
      } else {
        setError('Please upload a PDF file only')
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf') {
        setPdfFile(file)
        setError('')
      } else {
        setError('Please upload a PDF file only')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploading(true)

    try {
      // Create processing job first
      const jobResponse = await fetch('/api/vehicle/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin })
      })

      const jobData = await jobResponse.json()

      if (!jobData.success) {
        throw new Error(jobData.error || 'Failed to create job')
      }

      const jobId = jobData.jobId

      // Convert PDF to base64 if present
      let pdfBase64 = null
      if (pdfFile) {
        pdfBase64 = await fileToBase64(pdfFile)
      }

      // Call generate API
      const generateResponse = await fetch('/api/vehicle/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          vin,
          pdfBase64,
          photoBase64Array: []
        })
      })

      const generateData = await generateResponse.json()

      if (!generateData.success) {
        throw new Error(generateData.error || 'Failed to generate disclosure')
      }

      // Redirect to review page
      router.push(`/admin/review/${jobId}`)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setUploading(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Process New Vehicle</h1>
          <p className="text-gray-600 mt-2">Enter VIN and upload Carfax PDF</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {/* VIN Input */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Vehicle VIN *
            </label>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-transparent font-mono text-lg tracking-wider"
            />
            <p className="text-gray-500 text-sm mt-1">
              {vin.length}/17 characters
            </p>
          </div>

          {/* PDF Upload - Single File Only */}
          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-2">
              Carfax / Vehicle History Report (PDF)
            </label>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                dragActive 
                  ? 'border-[#C8102E] bg-red-50' 
                  : pdfFile 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-[#C8102E]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfChange}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                {pdfFile ? (
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-700 font-medium">{pdfFile.name}</p>
                    <p className="text-green-600 text-sm mt-1">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-green-600 text-xs mt-2">Click to change file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-700 font-medium">Click to upload PDF</p>
                    <p className="text-gray-500 text-sm mt-1">or drag and drop</p>
                    <p className="text-gray-400 text-xs mt-2">PDF files only</p>
                  </div>
                )}
              </label>
            </div>
            {pdfFile && (
              <button
                type="button"
                onClick={() => setPdfFile(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Remove file
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || vin.length !== 17}
            className="w-full bg-[#C8102E] hover:bg-[#a00d26] disabled:bg-gray-300 text-white font-semibold py-4 rounded-lg transition"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing with AI...
              </span>
            ) : (
              <span>Generate Disclosure</span>
            )}
          </button>

          {!uploading && vin.length !== 17 && (
            <p className="text-center text-gray-500 text-sm mt-2">
              Enter a complete 17-character VIN to continue
            </p>
          )}
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Our AI analyzes your Carfax PDF</li>
            <li>2. Generates an OMVIC-compliant disclosure narrative</li>
            <li>3. You review and edit (some fields are locked for compliance)</li>
            <li>4. Publish to make it live on your website</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
