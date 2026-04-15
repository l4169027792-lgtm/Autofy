'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
  damage_level: string | null
  colour: string | null
  image_url: string | null
  status_message: string | null
}

const damageLevels = ['All', 'Minor', 'Moderate', 'Severe']
const priceRanges = ['All Prices', 'Under $15K', '$15K - $25K', '$Over 25K']
const bodyTypes = ['All Types', 'SUV', 'Sedan', 'Hatchback']

export default function Inventory() {
  const [filter, setFilter] = useState('All')
  const [priceFilter, setPriceFilter] = useState('All Prices')
  const [bodyFilter, setBodyFilter] = useState('All Types')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch vehicles from Supabase
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/vehicles?status=eq.available&order=created_at.desc`,
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
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    // Damage level filter
    if (filter !== 'All' && vehicle.damage_level !== filter) {
      return false
    }
    // Price filter
    if (priceFilter === 'Under $15K' && vehicle.price >= 15000) {
      return false
    }
    if (priceFilter === '$15K - $25K' && (vehicle.price < 15000 || vehicle.price > 25000)) {
      return false
    }
    if (priceFilter === '$Over 25K' && vehicle.price <= 25000) {
      return false
    }
    return true
  })

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <section className="py-12 px-10 bg-warm">
        <div className="max-w-6xl mx-auto">
          <span className="text-xs font-bold text-red tracking-widest uppercase">Browse</span>
          <h1 className="font-serif text-3xl md:text-4xl mt-2">Our Inventory</h1>
          <p className="text-text-2 mt-2 max-w-lg">Every vehicle has been professionally inspected and comes with full disclosure documentation.</p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-5 px-10 border-b border-border bg-white sticky top-16 z-30">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3">
          {/* Damage Level */}
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border-2 bg-off-white text-sm font-semibold outline-none focus:border-red cursor-pointer"
          >
            {damageLevels.map((level) => (
              <option key={level} value={level}>{level === 'All' ? 'All Damage Levels' : level}</option>
            ))}
          </select>

          {/* Price Range */}
          <select 
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border-2 bg-off-white text-sm font-semibold outline-none focus:border-red cursor-pointer"
          >
            {priceRanges.map((range) => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>

          {/* Body Type */}
          <select 
            value={bodyFilter}
            onChange={(e) => setBodyFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border-2 bg-off-white text-sm font-semibold outline-none focus:border-red cursor-pointer"
          >
            {bodyTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <span className="ml-auto text-sm text-text-3 self-center">{filteredVehicles.length} vehicles</span>
        </div>
      </section>

      {/* Vehicle Grid */}
      <section className="py-10 px-10">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-text-2">Loading vehicles...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <Link 
                  key={vehicle.vin} 
                  href={`/vehicles/${vehicle.vin}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      {vehicle.image_url ? (
                        <Image
                          src={vehicle.image_url}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Image
                          src="https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&h=400&fit=crop"
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold tracking-wider uppercase rounded-full">
                        {vehicle.status === 'available' ? (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green rounded-full"></span>
                            Available
                          </span>
                        ) : (
                          <span>Coming Soon</span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      {/* KM Label */}
                      <div className="text-[11px] text-text-3 font-bold tracking-wider uppercase mb-1.5">
                        {vehicle.odometer_km?.toLocaleString() || 'N/A'} km
                      </div>

                      {/* Title */}
                      <h3 className="font-serif text-lg mb-0.5">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-text-3 text-xs mb-4">{vehicle.trim || ''} • {vehicle.colour || ''}</p>

                      {/* Price Row */}
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="font-serif text-2xl">${vehicle.price.toLocaleString()}</span>
                        {vehicle.damage_level && (
                          <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                            vehicle.damage_level === 'Minor' 
                              ? 'bg-green-light text-green' 
                              : vehicle.damage_level === 'Moderate'
                              ? 'bg-gold-light text-gold'
                              : 'bg-red-light text-red'
                          }`}>
                            {vehicle.damage_level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Coming Soon Card */}
              <div className="bg-warm rounded-2xl overflow-hidden border-2 border-dashed border-border-2 flex flex-col items-center justify-center p-12 text-center min-h-[340px]">
                <div className="text-4xl mb-3">🚗</div>
                <h3 className="font-semibold text-text mb-2">More Coming Soon</h3>
                <p className="text-text-3 text-sm">New vehicles arriving weekly from auction.</p>
              </div>
            </div>
          )}
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
    </div>
  )
}
