'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ReserveModal from '@/components/ReserveModal'

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
  damage_description: string | null
  repair_summary: string | null
  auction_price: number | null
  repair_cost_total: number | null
  our_margin: number | null
  image_url: string | null
  status_message: string | null
}

export default function VehicleDetail({ params }: { params: { vin: string } }) {
  const [activeTab, setActiveTab] = useState('story')
  const [activePhoto, setActivePhoto] = useState(0)
  const [isReserveOpen, setIsReserveOpen] = useState(false)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState<{url: string, badge: string}[]>([])

  // Fetch vehicle from Supabase
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/vehicles?vin=eq.${params.vin}`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
            }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.length > 0) {
            const v = data[0]
            setVehicle(v)
            
            // Set photos (use main image + placeholders for demo)
            const photoList = [
              { url: v.image_url || 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop', badge: 'Exterior' },
              { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop', badge: 'Interior' },
              { url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop', badge: 'Details' },
            ]
            setPhotos(photoList)
          }
        }
      } catch (error) {
        console.error('Error fetching vehicle:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicle()
  }, [params.vin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-2">Loading vehicle...</p>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="font-serif text-3xl mb-4">Vehicle Not Found</h1>
        <Link href="/inventory" className="text-red font-semibold hover:underline">
          ← Back to Inventory
        </Link>
      </div>
    )
  }

  const tabs = [
    { id: 'story', label: 'The Story' },
    { id: 'damage', label: 'The Damage' },
    { id: 'repair', label: 'The Repair' },
    { id: 'numbers', label: 'The Numbers' },
    { id: 'car', label: 'The Car' },
  ]

  return (
    <div className="animate-fadeIn">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-10 pt-6 text-sm">
        <Link href="/" className="text-text-3 hover:text-red transition-colors">Home</Link>
        <span className="text-text-3 mx-2">/</span>
        <Link href="/inventory" className="text-text-3 hover:text-red transition-colors">Inventory</Link>
        <span className="text-text-3 mx-2">/</span>
        <span className="text-text">{vehicle.year} {vehicle.make} {vehicle.model}</span>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-10 py-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column */}
        <div className="lg:col-span-2">
          {/* Gallery */}
          <div className="mb-6">
            <div className="relative aspect-video bg-charcoal rounded-2xl overflow-hidden cursor-pointer mb-3">
              <Image
                src={photos[activePhoto]?.url || vehicle.image_url || 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop'}
                alt={`${vehicle.make} ${vehicle.model}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/75 backdrop-blur-sm text-white text-xs font-bold tracking-wider uppercase rounded-full border border-white/10">
                {photos[activePhoto]?.badge || 'Photo'}
              </div>
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setActivePhoto(index)}
                  className={`relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    activePhoto === index ? 'border-red' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.badge}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="text-xs text-text-3 font-bold tracking-widest uppercase mb-2">
              Stock #{vehicle.stock_number}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl mb-3">
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
            </h1>
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {vehicle.title_status && (
                <span className="px-3 py-1.5 bg-green-light border border-green/20 text-green text-xs font-bold rounded-full">{vehicle.title_status}</span>
              )}
              {vehicle.service_records > 0 && (
                <span className="px-3 py-1.5 bg-green-light border border-green/20 text-green text-xs font-bold rounded-full">{vehicle.service_records} Service Records</span>
              )}
              {vehicle.damage_level && (
                <span className={`px-3 py-1.5 border text-xs font-bold rounded-full ${
                  vehicle.damage_level === 'Minor' 
                    ? 'bg-green-light border-green/20 text-green' 
                    : 'bg-gold-light border-gold/30 text-gold'
                }`}>
                  {vehicle.damage_level} — Repaired
                </span>
              )}
              {!vehicle.has_recalls && (
                <span className="px-3 py-1.5 bg-warm border border-border text-text-3 text-xs font-semibold rounded-full">No Recalls</span>
              )}
            </div>
          </div>

          {/* Specs Strip */}
          <div className="grid grid-cols-5 bg-white rounded-xl p-4 border border-border mb-6">
            {[
              { icon: '📏', value: `${vehicle.odometer_km?.toLocaleString() || 'N/A'} km`, label: 'Odometer' },
              { icon: '⚙️', value: vehicle.engine || 'N/A', label: 'Engine' },
              { icon: '🔄', value: vehicle.transmission || 'N/A', label: 'Transmission' },
              { icon: '🚙', value: vehicle.drivetrain || 'N/A', label: 'Drivetrain' },
              { icon: '🎨', value: vehicle.colour || 'N/A', label: 'Exterior' },
            ].map((spec, index) => (
              <div key={index} className={`text-center ${index > 0 ? 'border-l border-border' : ''}`}>
                <div className="text-lg mb-1">{spec.icon}</div>
                <div className="text-xs font-bold">{spec.value}</div>
                <div className="text-[10px] text-text-3 font-bold tracking-wider uppercase">{spec.label}</div>
              </div>
            ))}
          </div>

          {/* Disclosure Tabs */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
            {/* Tab Headers */}
            <div className="flex border-b border-border overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-red border-b-2 border-red'
                      : 'text-text-2 hover:text-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* The Story */}
              {activeTab === 'story' && (
                <div>
                  <h2 className="font-serif text-xl mb-4">The Story</h2>
                  <p className="text-text-2 leading-relaxed mb-4">
                    {vehicle.story || 'No story available for this vehicle.'}
                  </p>
                  <div className="bg-warm rounded-xl p-4 border border-border mt-4">
                    <p className="text-sm text-text-2 leading-relaxed">
                      <strong>Disclosure Path:</strong> {vehicle.disclosure_path === 'A' ? 'Full Carfax history available, professional repairs documented.' : 'Standard disclosure provided.'}
                    </p>
                  </div>
                </div>
              )}

              {/* The Damage */}
              {activeTab === 'damage' && (
                <div>
                  <h2 className="font-serif text-xl mb-4">The Damage</h2>
                  <p className="text-text-2 leading-relaxed mb-4">
                    {vehicle.damage_description || 'Damage information available upon request.'}
                  </p>
                  {vehicle.damage_type && (
                    <div className="mt-4">
                      <h3 className="font-bold text-sm mb-2">Damage Type</h3>
                      <span className={`px-3 py-1.5 text-xs font-bold rounded ${
                        vehicle.damage_level === 'Minor' 
                          ? 'bg-green-light text-green' 
                          : 'bg-gold-light text-gold'
                      }`}>
                        {vehicle.damage_type}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* The Repair */}
              {activeTab === 'repair' && (
                <div>
                  <h2 className="font-serif text-xl mb-4">The Repair</h2>
                  <p className="text-text-2 leading-relaxed mb-4">
                    {vehicle.repair_summary || 'Professional repairs completed. Full documentation available.'}
                  </p>
                </div>
              )}

              {/* The Numbers */}
              {activeTab === 'numbers' && (
                <div>
                  <h2 className="font-serif text-xl mb-4">The Numbers</h2>
                  <div className="space-y-3">
                    {vehicle.auction_price && (
                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-text-2">Auction Purchase Price</span>
                        <span className="font-mono font-semibold">${vehicle.auction_price.toLocaleString()}</span>
                      </div>
                    )}
                    {vehicle.repair_cost_total && (
                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-text-2">Total Repair Costs</span>
                        <span className="font-mono font-semibold">${vehicle.repair_cost_total.toLocaleString()}</span>
                      </div>
                    )}
                    {vehicle.our_margin && (
                      <div className="flex justify-between py-3 border-b border-border">
                        <span className="text-text-2">Our Margin</span>
                        <span className="font-mono font-semibold">${vehicle.our_margin.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-4 bg-warm rounded-xl px-4 mt-4">
                      <span className="font-bold">List Price</span>
                      <span className="font-serif text-2xl">${vehicle.price.toLocaleString()}</span>
                    </div>
                    {vehicle.clean_equivalent_price && (
                      <div className="flex justify-between py-4 bg-green-light border border-green/20 rounded-xl px-4">
                        <span className="text-green font-bold">You Save vs Clean</span>
                        <span className="font-serif text-2xl text-green">${(vehicle.clean_equivalent_price - vehicle.price).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* The Car */}
              {activeTab === 'car' && (
                <div>
                  <h2 className="font-serif text-xl mb-4">Features & Equipment</h2>
                  {vehicle.features && vehicle.features.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {vehicle.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-2.5 bg-warm rounded-lg border border-border text-xs text-text-2 font-medium">
                          <span className="text-green">✓</span>
                          {feature}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-2">Feature information available upon request.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sticky Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {/* Purchase Card */}
            <div className="bg-white rounded-3xl border border-border shadow-lg overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="font-serif text-4xl">${vehicle.price.toLocaleString()}</span>
                  {vehicle.clean_equivalent_price && (
                    <span className="px-2.5 py-1 bg-green-light text-green text-xs font-bold rounded-md">
                      Save ${(vehicle.clean_equivalent_price - vehicle.price).toLocaleString()}
                    </span>
                  )}
                </div>
                {vehicle.clean_equivalent_price && (
                  <div className="text-sm text-text-3">Clean equivalent: <s>${vehicle.clean_equivalent_price.toLocaleString()}</s></div>
                )}
              </div>

              {/* CFX Row */}
              <div className="p-5 bg-warm border-b border-border">
                <div className="text-xs text-text-3 font-bold tracking-wider uppercase mb-2">Price Includes</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs"><span>Vehicle price</span><span className="text-green font-bold">Included</span></div>
                  <div className="flex justify-between text-xs"><span>Ontario Safety Cert</span><span className="text-green font-bold">Included</span></div>
                  <div className="flex justify-between text-xs"><span>Full disclosure docs</span><span className="text-green font-bold">Included</span></div>
                </div>
              </div>

              {/* Warranty */}
              <div className="p-5 bg-green-light border-b border-green/20 flex items-start gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <strong className="text-green text-sm">90-Day Mechanical Warranty</strong>
                  <p className="text-xs text-green/70 mt-0.5">Covers engine, transmission, and major electrical</p>
                </div>
              </div>

              {/* Quick Facts */}
              <div className="p-5">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">📋</span>
                    <div>
                      <strong className="text-sm block">Full Disclosure Package</strong>
                      <span className="text-xs text-text-3">Carfax, repair invoices, auction receipt</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">📍</span>
                    <div>
                      <strong className="text-sm block">199 Guelph St</strong>
                      <span className="text-xs text-text-3">Georgetown, Ontario</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="p-5 space-y-3">
                <button 
                  onClick={() => setIsReserveOpen(true)}
                  className="w-full py-3.5 bg-red text-white rounded-xl font-bold text-sm hover:bg-red-dark transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-red/25"
                >
                  🔒 Reserve for $100
                </button>
                <button className="w-full py-3 bg-transparent text-text border-2 border-border-2 rounded-xl font-bold text-sm hover:border-red hover:text-red transition-all">
                  📞 Call (905) 702-6777
                </button>
                <button className="w-full py-2.5 text-text-3 font-semibold text-xs hover:text-red transition-colors">
                  Download Full Report ↓
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reserve Modal */}
      <ReserveModal 
        isOpen={isReserveOpen} 
        onClose={() => setIsReserveOpen(false)}
        vehicle={vehicle}
      />
    </div>
  )
}
