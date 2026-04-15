import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-black py-8 px-10 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-red rounded-md flex items-center justify-center font-black text-xs text-white tracking-tight">
          A
        </div>
        <span className="font-serif text-lg text-white">Auto<span className="text-red">fy</span></span>
      </div>

      {/* Links */}
      <div className="flex gap-6 text-xs">
        <Link href="/inventory" className="text-white/40 hover:text-white transition-colors">Inventory</Link>
        <Link href="/about" className="text-white/40 hover:text-white transition-colors">About</Link>
        <Link href="/how-it-works" className="text-white/40 hover:text-white transition-colors">How It Works</Link>
        <Link href="/contact" className="text-white/40 hover:text-white transition-colors">Contact</Link>
      </div>

      {/* Copyright */}
      <div className="text-xs text-white/30">
        © 2026 Autofy. Georgetown Superstore Used Cars.
      </div>
    </footer>
  )
}
