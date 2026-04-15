'use client'

import { useState, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function Modal({ isOpen, onClose }: ModalProps) {
  const [selectedType, setSelectedType] = useState('test-drive')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const inquiryTypes = [
    { id: 'test-drive', label: '🚗 Test Drive' },
    { id: 'vehicle', label: '🚙 Vehicle Inquiry' },
    { id: 'financing', label: '💰 Financing' },
    { id: 'trade-in', label: '🔄 Trade-In' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Thank you! We will respond within 2 hours.')
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 z-[600] flex items-center justify-center p-5"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md"></div>
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl animate-fadeUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-warm border border-border flex items-center justify-center text-text-2 hover:bg-border-2 transition-all"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="font-serif text-2xl mb-1.5">Book a Test Drive</h2>
        <p className="text-text-2 text-sm mb-6">Fill out the form below and we will get back to you within 2 hours.</p>

        {/* Inquiry Type */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {inquiryTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                selectedType === type.id
                  ? 'bg-red-light border-red/30 text-red'
                  : 'border-border-2 text-text-2 hover:bg-warm'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full Name"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors"
            />
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors"
            />
            <textarea
              placeholder="Any questions or preferred dates/times?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-5 px-4 py-3.5 bg-red text-white rounded-xl text-sm font-bold hover:bg-red-dark transition-all"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  )
}
