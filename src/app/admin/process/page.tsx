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
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0])
    }
  }

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setPhotos(files)
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

      // Convert files to base64
      let pdfBase64 = null
      const photoBase64Array: string[] = []

      if (pdfFile) {
        pdfBase64 = await fileToBase64(pdfFile)
      }

      for (const photo of photos) {
        photoBase64Array.push(await fileToBase64(photo))
      }

      // Call generate API
      const generateResponse = await fetch('/api/vehicle/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          vin,
          pdfBase64,
          photoBase64Array
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
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Process New Vehicle</h1>
          <p className="text-gray-600 mt-2">Upload Carfax and photos to generate OMVIC-compliant disclosure</p>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-transparent font-mono"
            />
            <p className="text-gray-500 text-sm mt-1">
              {vin.length}/17 characters
            </p>
          </div>

          {/* PDF Upload */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Carfax / Vehicle History Report (PDF)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#C8102E] transition">
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfChange}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  {pdfFile ? pdfFile.name : 'Click to upload PDF'}
                </p>
                <p className="text-xs text-gray-500 mt-1">PDF files only</p>
              </label>
            </div>
          </div>

          {/* Photos Upload */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Vehicle Photos
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#C8102E] transition">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotosChange}
                className="hidden"
                id="photos-upload"
              />
              <label htmlFor="photos-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  {photos.length > 0 ? `${photos.length} photos selected` : 'Click to upload photos'}
                </p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG - Multiple files allowed</p>
              </label>
            </div>
            
            {/* Photo Preview */}
            {photos.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-500">{index + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || vin.length !== 17}
            className="w-full bg-[#C8102E] hover:bg-[#a00d26] disabled:bg-gray-300 text-white font-semibold py-4 rounded-lg transition"
          >
            {uploading ? (
              <span>Processing with AI...</span>
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
            <li>1. Our AI analyzes your Carfax and photos</li>
            <li>2. Generates an OMVIC-compliant disclosure narrative</li>
            <li>3. You review and edit (some fields are locked for compliance)</li>
            <li>4. Publish to make it live on your website</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
