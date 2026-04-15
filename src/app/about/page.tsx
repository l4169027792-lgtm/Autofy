'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Modal from '@/components/Modal'

export default function About() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const values = [
    { icon: '💎', title: 'Quality First', description: 'Every vehicle is professionally inspected and repaired to meet our high standards before listing.' },
    { icon: '🔍', title: 'Full Transparency', description: 'We show you the auction price, every repair cost, and our margin. No surprises.' },
    { icon: '🤝', title: 'Honest Deal', description: 'No pressure tactics, no hidden fees, no games. Just straightforward pricing on honest vehicles.' },
    { icon: '🛡️', title: 'Protected Purchase', description: 'Every vehicle comes with a 90-day mechanical warranty and full disclosure documentation.' },
  ]

  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <section className="min-h-[60vh] grid grid-cols-1 lg:grid-cols-2">
        {/* Left */}
        <div className="flex flex-col justify-center px-12 lg:px-20 py-16">
          <span className="text-xs font-bold text-red tracking-widest uppercase">Our Story</span>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl mt-3 leading-tight">
            Built on the belief that honesty shouldn't be a luxury.
          </h1>
          <p className="text-text-2 text-lg leading-relaxed mt-6 max-w-lg">
            Most dealerships hide the history. We built Autofy to show it all — and let you decide with complete information. No pressure, no games, just transparent pricing on quality repaired vehicles.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 mt-6 text-text font-semibold hover:text-red transition-colors w-fit"
          >
            Book a test drive →
          </button>

          {/* Quote */}
          <blockquote className="mt-10 ml-4 pl-5 border-l-2 border-red bg-warm py-4 pr-6 rounded-r-xl max-w-md">
            <p className="font-accent text-xl italic text-text">"We don't sell cars. We sell trust. And we back it up with paperwork."</p>
            <cite className="text-sm text-text-3 mt-2 block not-italic">— Leo, Founder</cite>
          </blockquote>
        </div>

        {/* Right */}
        <div className="relative min-h-[400px] lg:min-h-full">
          <Image
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=600&fit=crop&crop=top"
            alt="Autofy team"
            fill
            className="object-cover"
          />
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-10 bg-warm">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold text-red tracking-widest uppercase">Our Mission</span>
          <h2 className="font-serif text-3xl md:text-4xl mt-3">Changing how Ontario buys used cars</h2>
          <p className="text-text-2 text-lg leading-relaxed mt-5 max-w-2xl mx-auto">
            The used car industry has a trust problem. Dealers hide accident history, inflate prices, and rely on customers not doing their research. We're here to change that.
          </p>
          <p className="text-text-2 text-lg leading-relaxed mt-4 max-w-2xl mx-auto">
            Every car at Autofy has been in an accident. That's not a secret — it's disclosed upfront. We believe customers deserve to know exactly what they're buying, at a fair price, with documentation to prove it.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-red tracking-widest uppercase">Our Values</span>
            <h2 className="font-serif text-3xl md:text-4xl mt-3">What we stand for</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-2xl p-7 border border-border shadow-sm">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                <p className="text-text-2 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-10 bg-black">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '100%', label: 'Transparency' },
            { value: '$0', label: 'Hidden Fees' },
            { value: 'OMVIC', label: 'Registered' },
          ].map((stat, index) => (
            <div key={index}>
              <div className="font-serif text-4xl text-white">{stat.value}</div>
              <div className="text-xs text-white/40 font-bold tracking-widest uppercase mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-10 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl">Ready to see the difference?</h2>
          <p className="text-text-2 mt-4">Browse our current inventory or book a test drive to experience the Autofy difference.</p>
          <div className="flex gap-4 justify-center mt-8 flex-wrap">
            <Link href="/inventory" className="px-6 py-3.5 bg-red text-white rounded-xl font-bold text-sm hover:bg-red-dark transition-all">
              Browse Inventory →
            </Link>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3.5 bg-transparent text-text border-2 border-border-2 rounded-xl font-bold text-sm hover:border-red hover:text-red transition-all"
            >
              Book a Test Drive
            </button>
          </div>
        </div>
      </section>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
