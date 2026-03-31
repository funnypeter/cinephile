'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',        label: 'Home',   icon: 'home' },
  { href: '/search',  label: 'Search', icon: 'search' },
  { href: '/log',     label: '',       icon: 'add', isCta: true },
  { href: '/lists',   label: 'Lists',  icon: 'format_list_bulleted' },
  { href: '/profile', label: 'Profile',icon: 'person' },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 w-full z-50 glass border-t border-outline-variant/10">
      <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto">
        {NAV.map((item) => {
          const active = path === item.href
          if (item.isCta) return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center px-2">
              <div className="w-12 h-12 gradient-cta rounded-full flex items-center justify-center shadow-[0px_8px_20px_rgba(0,209,255,0.35)] active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-on-primary" style={{fontSize:24}}>add</span>
              </div>
            </Link>
          )
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 px-4 py-2">
              <span
                className={`material-symbols-outlined ${active ? 'fill-icon text-primary' : 'text-outline'} transition-colors`}
                style={{fontSize:22}}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold font-label uppercase tracking-wide ${active ? 'text-primary' : 'text-outline'} transition-colors`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
