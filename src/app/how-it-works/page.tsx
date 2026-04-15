'use client'

import { useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/Modal'

export default function HowItWorks() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: "What does 'accident-history vehicle' mean?",
      answer: "It means the car was previously in an accident significant enough to trigger an insurance claim. This doesn't mean the car is damaged — it means the damage was repaired. We only sell vehicles that have been professionally repaired to pre-accident condition."
    },
    {
      question: "How do you determine the right price?",
      answer: "We show you everything: what we paid at auction, every repair cost, and our margin. The price is the auction price plus repair costs plus a standard margin. You can compare our price to clean equivalent values (same make/model/year with no accident history) and see exactly what you're saving."
    },
    {
      question: "Is this vehicle safe to drive?",
      answer: "Yes. Every vehicle undergoes a 150-point inspection and receives an Ontario Safety Standards Certificate before being listed. We also offer a 90-day mechanical warranty covering major components."
    },
    {
      question: "What if I want to see the car in person?",
      answer: "Book a test drive at our Georgetown location (199 Guelph St). You'll meet our team, inspect the vehicle yourself, and see all the documentation — Carfax report, repair invoices, and our inspection results."
    },
    {
      question: "Can I get financing?",
      answer: "Yes, we work with several financial partners who specialize in used vehicle financing. Your credit score and history will affect approval and rates. Ask us about financing when you book your test drive."
    },
    {
      question: "What is your return policy?",
      answer: "Your $100 reservation deposit is fully refundable. Once you've completed the purchase and taken delivery, we offer a 3-day exchange policy on the vehicle (conditions apply)."
    },
  ]

  const steps = [
    {
      num: 1,
      title: "Browse & Research",
      description: "Start with our online inventory. Every listing shows the full accident history, repair details, and complete cost breakdown. Compare prices to clean equivalents.",
      icon: "🔍"
    },
    {
      num: 2,
      title: "Book a Visit",
      description: "Schedule a test drive at our Georgetown location. See the car in person, inspect the repairs, and review all documentation with our team.",
      icon: "📅"
    },
    {
      num: 3,
      title: "Reserve & Inspect",
      description: "Put down a $100 refundable deposit to hold the vehicle. We complete a final inspection and send you the full report before proceeding.",
      icon: "🔒"
    },
    {
      num: 4,
      title: "Complete Purchase",
      description: "Sign the disclosure acknowledgement, finalize payment, and take delivery. We handle all OMVIC documentation and provide a free 90-day warranty.",
      icon: "🎉"
    },
  ]

  const damageTypes = [
    {
      level: 'Minor',
      color: 'green',
      bgColor: 'bg-green-light',
      borderColor: 'border-green/25',
      textColor: 'text-green',
      description: 'Small dents, bumper damage, cosmetic issues. Typically under $2,000 to repair.',
      example: 'Parking lot bump, minor fender crease, small paint scratch'
    },
    {
      level: 'Moderate',
      color: 'gold',
      bgColor: 'bg-gold-light',
      borderColor: 'border-gold/25',
      textColor: 'text-gold',
      description: 'Body panel damage requiring replacement or significant repair. $2,000 - $5,000 to repair.',
      example: 'Front bumper + hood damage, side panel damage, door replacement'
    },
    {
      level: 'Severe',
      color: 'red',
      bgColor: 'bg-red-light',
      borderColor: 'border-red/20',
      textColor: 'text-red',
      description: 'Significant structural damage that was professionally repaired. Over $5,000 to repair.',
      example: 'Frame damage (properly repaired), major front-end collision'
    },
  ]

  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <section className="bg-black py-20 px-10 text-center">
        <span className="text-xs font-bold text-red tracking-widest uppercase">How It Works</span>
        <h1 className="font-serif text-4xl md:text-5xl text-white mt-3">We show you everything.<br />You drive with confidence.</h1>
        <p className="text-white/45 text-lg mt-5 max-w-xl mx-auto">
          Every car at Autofy has accident history. We believe in complete transparency so you can make an informed decision with all the facts.
        </p>
      </section>

      {/* Process Steps */}
      <section className="py-20 px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl">The 4-Step Process</h2>
            <p className="text-text-2 mt-3 max-w-lg mx-auto">Buying a disclosed-history vehicle is simple when you know what you're getting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, index) => (
              <div key={step.num} className="bg-white rounded-2xl p-7 border border-border shadow-sm relative">
                <div className="absolute -top-3 left-7 text-4xl">{step.icon}</div>
                <div className="w-10 h-10 bg-red-light rounded-xl flex items-center justify-center mb-4 mt-6">
                  <span className="font-serif text-xl text-red">{step.num}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 -right-2.5 w-5 h-5 bg-warm border border-border rounded-full z-10">
                    <svg className="w-2.5 h-2.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-text-2 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Damage Types Explained */}
      <section className="py-20 px-10 bg-warm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-red tracking-widest uppercase">Disclosure</span>
            <h2 className="font-serif text-3xl md:text-4xl mt-3">Understanding damage levels</h2>
            <p className="text-text-2 mt-3">Every vehicle is categorized by damage severity. Here's what each level means.</p>
          </div>

          <div className="space-y-4">
            {damageTypes.map((damage, index) => (
              <div 
                key={index}
                className={`${damage.bgColor} border-2 ${damage.borderColor} rounded-2xl p-6`}
              >
                <div className={`text-xs font-bold tracking-widest uppercase ${damage.textColor} mb-2`}>
                  {damage.level} Damage
                </div>
                <h3 className="font-bold text-lg mb-2">{damage.description}</h3>
                <p className="text-sm text-text-2">
                  <strong>Example:</strong> {damage.example}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white border border-border rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-3">💡 What we don't sell</h3>
            <p className="text-text-2 text-sm leading-relaxed">
              We never sell vehicles with flood damage, fire damage, or salvage titles. We also won't list any vehicle where structural integrity is in question — every car must pass a thorough inspection before being offered for sale.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-red tracking-widest uppercase">FAQ</span>
            <h2 className="font-serif text-3xl md:text-4xl mt-3">Common questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between font-semibold hover:text-red transition-colors"
                >
                  <span>{faq.question}</span>
                  <span className={`text-red transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 text-text-2 text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-16 px-10 text-center">
        <h2 className="font-serif text-3xl text-white">Ready to find your next car?</h2>
        <p className="text-white/50 mt-3 max-w-md mx-auto">Browse our current inventory or book a test drive to see the Autofy difference.</p>
        <div className="flex gap-4 justify-center mt-8 flex-wrap">
          <Link href="/inventory" className="px-6 py-3.5 bg-red text-white rounded-xl font-bold text-sm hover:bg-red-dark transition-all">
            Browse Inventory →
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 bg-transparent text-white border-2 border-white/20 rounded-xl font-bold text-sm hover:border-white/40 transition-all"
          >
            Book a Test Drive
          </button>
        </div>
      </section>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
