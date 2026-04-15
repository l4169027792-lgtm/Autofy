'use client'

import { useState } from 'react'

export default function Contact() {
  const [inquiryType, setInquiryType] = useState('general')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const inquiryTypes = [
    { id: 'general', label: '💬 General Inquiry' },
    { id: 'test_drive', label: '🚗 Test Drive' },
    { id: 'vehicle', label: '🚙 Specific Vehicle' },
    { id: 'financing', label: '💰 Financing' },
  ]

  const contactInfo = [
    { icon: '📍', title: 'Location', value: '199 Guelph St, Georgetown, ON' },
    { icon: '📞', title: 'Phone', value: '(905) 702-6777' },
    { icon: '📧', title: 'Email', value: 'sales@gtsuperstore.ca' },
    { icon: '🕐', title: 'Hours', value: 'Mon-Sat 9AM-6PM' },
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    
    const leadData = {
      first_name: formData.get('firstName') as string,
      last_name: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      city: formData.get('city') as string,
      inquiry_type: inquiryType,
      message: formData.get('message') as string,
      source: 'organic',
      status: 'new'
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/leads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(leadData)
        }
      )

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        alert('There was an error. Please try calling us directly.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('There was an error. Please try calling us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <section className="py-12 px-10 bg-warm">
        <div className="max-w-6xl mx-auto">
          <span className="text-xs font-bold text-red tracking-widest uppercase">Contact</span>
          <h1 className="font-serif text-3xl md:text-4xl mt-2">Get in Touch</h1>
          <p className="text-text-2 mt-2 max-w-lg">Have questions? Want to schedule a visit? We'd love to hear from you.</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Left - Contact Info */}
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl mb-6">Contact Information</h2>
            
            <div className="space-y-4">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start gap-4 py-4 border-b border-border">
                  <div className="w-11 h-11 rounded-xl bg-warm border border-border flex items-center justify-center text-xl flex-shrink-0">
                    {info.icon}
                  </div>
                  <div>
                    <strong className="text-sm font-bold block mb-0.5">{info.title}</strong>
                    <span className="text-text-3 text-sm">{info.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="mt-8 bg-warm rounded-2xl border border-border p-6 text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-sm text-text-2">199 Guelph St, Georgetown, Ontario</p>
              <a 
                href="https://maps.google.com/?q=199+Guelph+St+Georgetown+ON" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-sm text-red font-semibold hover:underline"
              >
                Open in Maps →
              </a>
            </div>
          </div>

          {/* Right - Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-8 lg:p-10 border border-border shadow-lg">
              {!isSubmitted ? (
                <>
                  <h2 className="font-serif text-2xl mb-2">Send Us a Message</h2>
                  <p className="text-text-2 text-sm mb-6">Fill out the form below and we'll get back to you within 2 hours.</p>

                  {/* Inquiry Type */}
                  <div className="mb-6">
                    <label className="text-xs font-bold text-text block mb-2">What are you interested in?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {inquiryTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setInquiryType(type.id)}
                          className={`p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                            inquiryType === type.id
                              ? 'bg-red-light border-red/30 text-red'
: 'border-border-2 text-text-2 hover:bg-warm'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-text block mb-1.5">First Name</label>
                        <input 
                          type="text" 
                          name="firstName"
                          required
                          placeholder="John"
                          className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text block mb-1.5">Last Name</label>
                        <input 
                          type="text" 
                          name="lastName"
                          required
                          placeholder="Smith"
                          className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text block mb-1.5">Email</label>
                      <input 
                        type="email" 
                        name="email"
                        required
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text block mb-1.5">Phone</label>
                      <input 
                        type="tel" 
                        name="phone"
                        required
                        placeholder="(905) 555-0123"
                        className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text block mb-1.5">City</label>
                      <input 
                        type="text" 
                        name="city"
                        placeholder="Toronto"
                        className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text block mb-1.5">Message</label>
                      <textarea 
                        name="message"
                        rows={5}
                        required
                        placeholder="Tell us what you're looking for..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-3.5 bg-red text-white rounded-xl text-sm font-bold hover:bg-red-dark transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-red/25 disabled:bg-text-3 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message →'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-light border-2 border-green/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
                    ✓
                  </div>
                  <h3 className="font-serif text-2xl mb-2">Message Sent!</h3>
                  <p className="text-text-2 text-sm mb-6">We'll get back to you within 2 hours during business hours.</p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-sm text-red font-semibold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
