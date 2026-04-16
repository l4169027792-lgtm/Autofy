'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/inventory', label: 'Inventory' },
    { href: '/about', label: 'About Us' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/contact', label: 'Contact' },
    { href: '/admin/login', label: 'Admin', admin: true },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-10 transition-all duration-300 ${
      isScrolled 
        ? 'bg-off-white/95 backdrop-blur-xl shadow-sm' 
        : 'bg-off-white/93 backdrop-blur-xl border-b border-border'
    }`}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
        <div className="w-8 h-8 bg-red rounded-lg flex items-center justify-center font-black text-sm text-white tracking-tight">
          A
        </div>
        <span className="font-bold text-lg text-text">Auto<span className="text-red">fy</span></span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-1.5 ml-10">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              link.admin
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : pathname === link.href
                  ? 'text-red bg-red-light'
                  : 'text-text-2 hover:text-red hover:bg-red-light'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* CTA Button */}
      <div className="ml-auto">
        <Link 
          href="/contact"
          className="px-5 py-2.5 bg-red text-white rounded-lg text-sm font-bold hover:bg-red-dark transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-red/25"
        >
          Book a Test Drive
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden ml-auto p-1 text-text">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </nav>
  )
}
