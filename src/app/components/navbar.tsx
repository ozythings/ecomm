'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, ShoppingBag, BarChart3, Database, 
  Command, History, LogOut, ChevronDown, User 
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { logout } from "../auth_actions";

export default function Navbar({ session }: { session: any }) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 border-b border-gray-200/50 supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-105 transition-transform duration-300">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-gray-900 tracking-tight">ecomm</span>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Admin</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-full border border-gray-200/50">
          <NavLink href="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Overview" active={pathname === '/'} />
          <NavLink href="/products" icon={<ShoppingBag className="w-4 h-4" />} label="Products" active={pathname.startsWith('/products')} />
          <NavLink href="/analytics" icon={<BarChart3 className="w-4 h-4" />} label="Analytics" active={pathname.startsWith('/analytics')} />
          <NavLink href="/action" icon={<History className="w-4 h-4" />} label="Logs" active={pathname.startsWith('/action')} />
          
          <div className="h-4 w-px bg-gray-300 mx-2"></div>
          
          <div className="flex items-center gap-3 px-3">
             <Link href="/tables/users" className={`text-sm font-medium transition-colors ${pathname.includes('/tables/users') ? 'text-black font-semibold' : 'text-gray-500 hover:text-black'}`}>Users</Link>
             <Link href="/tables/orders" className={`text-sm font-medium transition-colors ${pathname.includes('/tables/orders') ? 'text-black font-semibold' : 'text-gray-500 hover:text-black'}`}>Orders</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">

          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100/80 transition-all border border-transparent hover:border-gray-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-inner flex items-center justify-center text-white text-xs font-bold">
                  {session.name ? session.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-gray-900 leading-none">{session.name}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{session.role}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 p-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{session.email || 'admin@ecomm.com'}</p>
                  </div>
                  
                  <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                    <User className="w-4 h-4" /> Profile Settings
                  </Link>
                  
                  <div className="h-px bg-gray-100 my-1"></div>
                  
                  <form action={logout}>
                    <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-sm font-semibold text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/20">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-white text-black shadow-sm' 
          : 'text-gray-500 hover:text-black hover:bg-white/60'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
