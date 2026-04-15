'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ReserveModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: {
    id?: string
    vin: string
    year: number
    make: string
    model: string
    trim?: string
    price: number
    image_url?: string
  }
}

export default function ReserveModal({ isOpen, onClose, vehicle }: ReserveModalProps) {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [reservationNumber, setReservationNumber] = useState('')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setStep(1)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handlePayment = async () => {
    setIsProcessing(true)

    // Get form values
    const form = document.getElementById('reserve-form') as HTMLFormElement
    const formData = new FormData(form)
    
    // Generate reservation number
    const resNum = `AUT-RES-${Math.floor(1000 + Math.random() * 9000)}`
    setReservationNumber(resNum)

    // Prepare reservation data
    const reservationData = {
      vehicle_id: vehicle.id || null,
      reservation_number: resNum,
      first_name: formData.get('firstName') as string,
      last_name: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      city: formData.get('city') as string,
      source: formData.get('source') as string,
      deposit_amount: 100,
      deposit_paid: true,
      status: 'confirmed'
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/reservations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(reservationData)
        }
      )

      if (response.ok) {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500))
        setStep(3)
      } else {
        alert('There was an error processing your reservation. Please try again.')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Error submitting reservation:', error)
      alert('There was an error. Please call us directly.')
      setIsProcessing(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[700] flex items-center justify-center p-5"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
        >
          ✕
        </button>

        {/* Header */}
        <div className="bg-black p-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-red/20"></div>
          <div className="text-[10px] text-white/30 font-bold tracking-widest uppercase mb-2">Reserve This Vehicle</div>
          <h2 className="font-serif text-2xl text-white mb-1">{vehicle.year} {vehicle.make} {vehicle.model}</h2>
          <p className="text-white/40 text-sm">{vehicle.trim}</p>
          
          {/* Car Preview */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
            <div className="relative w-16 h-11 rounded-lg overflow-hidden bg-charcoal">
              {vehicle.image_url && (
                <Image
                  src={vehicle.image_url}
                  alt={vehicle.model}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">{vehicle.year} {vehicle.make} {vehicle.model}</div>
              <div className="text-xs text-white/40">{vehicle.trim}</div>
            </div>
            <div className="text-right">
              <div className="font-serif text-xl text-white">${vehicle.price.toLocaleString()}</div>
              <div className="text-[10px] text-white/30 font-bold tracking-widest uppercase">List Price</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Step Indicators */}
          <div className="flex gap-0 mb-8">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`flex-1 text-center relative ${s < 3 ? 'after:content-[\'\'] after:absolute after:top-4 after:left-1/2 after:w-full after:h-0.5 after:bg-border after:-z-0' : ''}`}
              >
                <div 
className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto relative z-10 transition-all ${
                    step > s 
                      ? 'bg-green text-white' 
                      : step === s 
                      ? 'bg-red text-white' 
                      : 'bg-border text-text-3'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
                <div className={`text-[10px] font-bold tracking-wider uppercase mt-1 ${
                  step === s ? 'text-red' : step > s ? 'text-green' : 'text-text-3'
                }`}>
                  {s === 1 ? 'Contact' : s === 2 ? 'Payment' : 'Confirm'}
                </div>
              </div>
            ))}
          </div>

          {/* Step 1: Contact Info */}
          {step === 1 && (
            <form id="reserve-form" onSubmit={handleStep1Submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-xs font-bold text-text block mb-1.5">How did you find us?</label>
                  <select 
                    name="source"
                    className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors cursor-pointer"
                  >
                    <option value="google">Google</option>
                    <option value="cargurus">CarGurus</option>
                    <option value="autotrader">AutoTrader</option>
                    <option value="referral">Referral</option>
                    <option value="social">Social Media</option>
                  </select>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-green-light border border-green/20 rounded-xl p-4 flex gap-3">
                <span className="text-lg">ℹ️</span>
                <p className="text-green text-sm font-medium leading-relaxed">
                  Your $100 deposit is fully refundable if the vehicle doesn't pass our inspection or you change your mind.
                </p>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-red text-white rounded-xl font-bold text-sm hover:bg-red-dark transition-all mt-4"
              >
                Continue to Payment →
              </button>
            </form>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Fee Summary */}
              <div className="bg-warm border border-border rounded-xl p-4">
                <div className="text-xs text-text-3 font-bold tracking-wider uppercase mb-3">Deposit Summary</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Refundable Deposit</span><span className="font-semibold">$100.00</span></div>
                  <div className="flex justify-between"><span>Processing Fee</span><span className="font-semibold">$0.00</span></div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2 font-bold">
                    <span>Total Today</span>
                    <span className="font-serif text-xl">$100.00</span>
                  </div>
                </div>
              </div>

              {/* Card Form (UI only - no real processing) */}
              <div>
                <label className="text-xs font-bold text-text block mb-1.5">Card Number</label>
                <input 
                  type="text" 
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text block mb-1.5">Expiry</label>
                  <input 
                    type="text" 
                    placeholder="MM / YY"
                    maxLength={7}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text block mb-1.5">CVV</label>
                  <input 
                    type="text" 
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-border-2 bg-off-white text-sm outline-none focus:border-red transition-colors"
                  />
                </div>
              </div>

              <button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-3.5 bg-red text-white rounded-xl font-bold text-sm hover:bg-red-dark transition-all mt-4 disabled:bg-text-3 disabled:cursor-not-allowed"
              >
                {isProcessing ? '⏳ Processing...' : '🔒 Pay $100 & Reserve Now'}
              </button>

              <button 
                onClick={() => setStep(1)}
                className="w-full py-2 text-text-3 font-semibold text-sm hover:text-text transition-colors"
              >
                ← Back to Contact Info
              </button>

              <p className="text-center text-xs text-text-3 mt-2">
                🔒 Secured by Stripe • Your card info is encrypted
              </p>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-light border-2 border-green/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-5 animate-[popIn_0.4s_ease]">
                ✓
              </div>
              
              {/* Confetti */}
              <div className="flex justify-center gap-1.5 mb-5">
                {['bg-red', 'bg-green', 'bg-gold', 'bg-blue', 'bg-purple'].map((color, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${color}`}></div>
                ))}
              </div>

              <h3 className="font-serif text-2xl mb-2">You're Reserved!</h3>
              <p className="text-text-2 text-sm mb-4">
                We'll send you an email confirmation shortly.
              </p>

              <div className="bg-warm border border-border rounded-xl p-4 mb-5">
                <div className="text-xs text-text-3 font-bold tracking-wider uppercase mb-1">Reservation Number</div>
                <div className="font-mono font-bold text-lg">{reservationNumber}</div>
              </div>

              <div className="text-sm text-text-2 space-y-2 mb-6">
                <p>📍 199 Guelph St, Georgetown, Ontario</p>
                <p>📞 (905) 702-6777</p>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-3.5 bg-green text-white rounded-xl font-bold text-sm hover:bg-green/90 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes popIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
