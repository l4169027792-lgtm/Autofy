'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Modal from '@/components/Modal'

// Types
interface Vehicle {
  id: string
  vin: string
  stock_number: string
  year: number
  make: string
  model: string
  trim: string | null
  odometer_km: number
  price: number
  clean_equivalent_price: number | null
  status: string
  source: string | null
  damage_type: string | null
  disclosure_path: string | null
  colour: string | null
  transmission: string | null
  drivetrain: string | null
  engine: string | null
  features: string[] | null
  service_records: number
  title_status: string | null
  has_recalls: boolean
  damage_level: string | null
  story: string | null
  image_url: string | null
  status_message: string | null
}

// Trust stats
const trustStats = [
  { value: '$8,600', label: 'Avg. Buyer Saves' },
  { value: '21', label: 'Service Records' },
  { value: '100%', label: 'Transparent' }
]

// Process steps
const processSteps = [
  {
    num: 1,
    title: 'We Buy at Auction',
    description: 'Sourced from IAAI, Copart, and Impact Auto auctions. Clean titles only — every receipt published.'
  },
  {
    num: 2,
    title: 'Professional Repair',
    description: 'Licensed body shops, OEM parts where possible, and structural integrity verified before resale.'
  },
  {
    num: 3,
    title: 'Safety Certified',
    description: 'Ontario Safety Standards Certificate issued. Full mechanical inspection completed before listing.'
  },
  {
    num: 4,
    title: 'Open Pricing',
    description: 'We publish the auction price, every repair cost, and our margin. No surprises at signing.'
  }
]

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [featuredVehicle, setFeaturedVehicle] = useState<Vehicle | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch vehicles from Supabase
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/vehicles?status=eq.available&order=created_at.desc&limit=4`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
            }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          setVehicles(data)
          if (data.length > 0) {
            setFeaturedVehicle(data[0])
          }
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Left - Content */}
        <div className="flex flex-col justify-center px-12 lg:px-20 py-20">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-red-light border border-red/15 rounded-full px-4 py-2 mb-6 w-fit">
            <div className="w-1.5 h-1.5 bg-red rounded-full"></div>
            <span className="text-xs font-bold text-red tracking-wider uppercase">Ontario's Honest Dealer</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
            Premium cars.<br />
            Real prices.<br />
            <span className="text-red italic">Zero secrets.</span>
          </h1>

          {/* Subtext */}
          <p className="text-text-2 text-lg leading-relaxed max-w-lg mb-8">
            We buy accident-history vehicles, restore them professionally, and show you every single dollar — the auction price, the repairs, the margin. You decide.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-3 flex-wrap mb-12">
            <Link href="/inventory" className="inline-flex items-center gap-2 px-6 py-3.5 bg-red text-white rounded-xl font-bold text-sm hover:bg-red-dark transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red/25">
              Browse Inventory →
            </Link>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 px-6 py-3.5 bg-transparent text-text border-2 border-border-2 rounded-xl font-bold text-sm hover:border-red hover:text-red transition-all">
              How It Works
            </Link>
          </div>

          {/* Trust Stats */}
          <div className="flex gap-10">
            {trustStats.map((stat, index) => (
              <div key={index}>
                <div className="font-serif text-3xl text-text">{stat.value}</div>
                <div className="text-xs text-text-3 font-bold tracking-wider uppercase mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Image */}
        <div className="relative hidden lg:block">
          {featuredVehicle?.image_url ? (
            <Image
              src={featuredVehicle.image_url}
              alt={`${featuredVehicle.year} ${featuredVehicle.make} ${featuredVehicle.model}`}
              fill
              className="object-cover object-center"
              priority
            />
          ) : (
            <Image
              src="https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&h=800&fit=crop"
              alt="Premium Car"
              fill
              className="object-cover object-center"
              priority
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-off-white via-off-white/80 to-transparent"></div>
          
          {/* Floating Price Card */}
          {featuredVehicle && (
            <div className="absolute bottom-9 left-9 bg-black/85 backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-white">
              <div className="text-[10px] text-white/40 font-bold tracking-widest uppercase mb-1">Listed Today</div>
              <div className="font-serif text-3xl">${featuredVehicle.price.toLocaleString()}</div>
              <div className="text-xs text-white/40 mt-0.5">{featuredVehicle.year} {featuredVehicle.make} {featuredVehicle.model}</div>
              {featuredVehicle.clean_equivalent_price && (
                <div className="text-sm text-green font-bold mt-1.5">Save ${(featuredVehicle.clean_equivalent_price - featuredVehicle.price).toLocaleString()}</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-10 bg-warm">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-red tracking-widest uppercase">The Process</span>
            <h2 className="font-serif text-3xl md:text-4xl mt-3">We show you everything.<br />You drive with confidence.</h2>
            <p className="text-text-2 mt-4 max-w-lg mx-auto">Every car goes through the same transparent process. No shortcuts, no hidden steps.</p>
          </div>

          {/* Steps Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {processSteps.map((step, index) => (
              <div key={step.num} className="bg-white rounded-2xl p-7 border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-red/20 relative">
                {/* Step Number */}
                <div className="w-10 h-10 bg-red-light rounded-xl flex items-center justify-center mb-4">
                  <span className="font-serif text-xl text-red">{step.num}</span>
                </div>
                {/* Connector Arrow */}
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-14 -right-2.5 w-5 h-5 bg-warm border border-border rounded-full z-10">
                    <svg className="w-2.5 h-2.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
                <h3 className="font-bold text-base mb-2">{step.title}</h3>
                <p className="text-text-2 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Learn More Link */}
          <div className="text-center mt-10">
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-text-2 font-semibold hover:text-red transition-colors">
              Learn more about our process →
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Vehicle Section */}
      <section className="py-20 px-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="mb-8">
            <span className="text-xs font-bold text-red tracking-widest uppercase">Now Available</span>
            <h2 className="font-serif text-3xl md:text-4xl mt-2">Featured Vehicle</h2>
          </div>

          {/* Featured Card */}
          <div className="bg-white rounded-3xl overflow-hidden border border-border shadow-lg hover:shadow-xl transition-shadow grid grid-cols-1 lg:grid-cols-2">
            {/* Image Side */}
            <div className="relative h-80 lg:h-auto">
              {featuredVehicle?.image_url ? (
                <Image
                  src={featuredVehicle.image_url}
                  alt={`${featuredVehicle.year} ${featuredVehicle.make} ${featuredVehicle.model}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <Image
                  src="https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop"
                  alt="Vehicle"
                  fill
                  className="object-cover"
                />
              )}
            </div>

            {/* Info Side */}
            <div className="p-10 lg:p-12 flex flex-col justify-center">
              {/* Status Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-light text-green rounded-lg text-xs font-bold w-fit mb-5">
                <span className="w-1.5 h-1.5 bg-green rounded-full"></span>
                {featuredVehicle?.status_message || 'Available Now'}
              </span>

              {/* Title */}
              <h3 className="font-serif text-2xl lg:text-3xl mb-2">
                {loading ? 'Loading...' : featuredVehicle 
                  ? `${featuredVehicle.year} ${featuredVehicle.make} ${featuredVehicle.model} ${featuredVehicle.trim || ''}`
                  : 'No vehicles available'}
              </h3>
              <p className="text-text-3 text-sm mb-5">
                {featuredVehicle ? `${featuredVehicle.odometer_km?.toLocaleString() || 'N/A'} km • ${featuredVehicle.engine || 'N/A'} • ${featuredVehicle.colour || 'Ontario'}` : ''}
              </p>

              {/* Price Row */}
              {featuredVehicle && (
                <>
                  <div className="flex items-baseline gap-4 mb-5">
                    <span className="font-serif text-4xl">${featuredVehicle.price.toLocaleString()}</span>
                    {featuredVehicle.clean_equivalent_price && (
                      <span className="px-2.5 py-1 bg-green-light text-green text-xs font-bold rounded-md">
                        Save ${(featuredVehicle.clean_equivalent_price - featuredVehicle.price).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {featuredVehicle.service_records > 0 && (
                      <span className="px-3 py-1.5 bg-warm border border-border rounded-full text-xs font-semibold">
                        {featuredVehicle.service_records} Service Records
                      </span>
                    )}
                    {featuredVehicle.title_status && (
                      <span className="px-3 py-1.5 bg-green-light border border-green/20 text-green text-xs font-bold rounded-full">
                        {featuredVehicle.title_status}
                      </span>
                    )}
                    {!featuredVehicle.has_recalls && (
                      <span className="px-3 py-1.5 bg-warm border border-border text-text-3 text-xs font-semibold rounded-full">
                        No Recalls
                      </span>
                    )}
                    {featuredVehicle.damage_level && (
                      <span className={`px-3 py-1.5 border text-xs font-bold rounded-full ${
                        featuredVehicle.damage_level === 'Minor' 
                          ? 'bg-green-light border-green/20 text-green' 
                          : 'bg-gold-light border-gold/30 text-gold'
                      }`}>
                        {featuredVehicle.damage_level} — Repaired
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* CTA */}
              <Link 
                href={featuredVehicle ? `/vehicles/${featuredVehicle.vin}` : '/inventory'} 
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red text-white rounded-xl font-bold text-sm hover:bg-red-dark transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red/25"
              >
                View Full Listing & Report →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-black py-10 px-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '🔒', value: '$0', label: 'Hidden Fees' },
            { icon: '📋', value: '1', label: 'Honest Price' },
            { icon: '📊', value: '100%', label: 'Disclosure' },
            { icon: '✅', value: 'OMVIC', label: 'Registered' }
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-serif text-2xl text-white">{item.value}</div>
              <div className="text-[10px] text-white/30 font-bold tracking-widest uppercase mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 px-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <span className="text-xs font-bold text-red tracking-widest uppercase">Our Story</span>
            <h2 className="font-serif text-3xl md:text-4xl mt-3 leading-tight">Built on the belief that honesty shouldn't be a luxury.</h2>
            <p className="text-text-2 mt-5 leading-relaxed">
              Most dealerships hide the history. We built Autofy to show it all — and let you decide with complete information. No pressure, no games, just transparent pricing on quality repaired vehicles.
            </p>
            <Link href="/about" className="inline-flex items-center gap-2 mt-6 text-text font-semibold hover:text-red transition-colors">
              Meet the founder →
            </Link>

            {/* Quote */}
            <blockquote className="mt-10 ml-4 pl-5 border-l-2 border-red bg-warm py-4 pr-6 rounded-r-xl">
              <p className="font-accent text-xl italic text-text">"We don't sell cars. We sell trust. And we back it up with paperwork."</p>
            </blockquote>
          </div>

          {/* Right - Values Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
              <div className="text-3xl mb-3">💰</div>
              <div className="font-serif text-xl">$0</div>
              <div className="text-xs text-text-3 font-semibold mt-1">Hidden Fees</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
              <div className="text-3xl mb-3">📈</div>
              <div className="font-serif text-xl">1</div>
              <div className="text-xs text-text-3 font-semibold mt-1">Honest Price</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
              <div className="text-3xl mb-3">📄</div>
              <div className="font-serif text-xl">Full</div>
              <div className="text-xs text-text-3 font-semibold mt-1">Disclosure</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
              <div className="text-3xl mb-3">🛡️</div>
              <div className="font-serif text-xl">Certified</div>
              <div className="text-xs text-text-3 font-semibold mt-1">Safety Inspected</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black py-16 px-10 text-center">
        <span className="text-xs font-bold text-red tracking-widest uppercase">Get In Touch</span>
        <h2 className="font-serif text-3xl md:text-4xl text-white mt-3">Ready to see this car in person?</h2>
        <p className="text-white/50 mt-3 max-w-md mx-auto">Book a test drive at our Georgetown location or reach out with any questions.</p>
        <div className="flex gap-4 justify-center mt-8 flex-wrap">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 bg-red text-white rounded-xl font-bold text-sm hover:bg-red-dark transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red/25"
          >
            Book a Test Drive
          </button>
          <Link href="/contact" className="px-6 py-3.5 bg-transparent text-white border-2 border-white/20 rounded-xl font-bold text-sm hover:border-white/40 transition-all">
            Contact Us
          </Link>
        </div>
      </section>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
