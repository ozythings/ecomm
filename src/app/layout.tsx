import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, BarChart3, Database, Command } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-Comm DB Manager",
  description: "Modern Database Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F5F5F7] text-[#1d1d1f]`}>
        <div className="min-h-screen flex flex-col">

          {/* Apple-style Glass Navbar */}
          <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

              {/* Logo Area */}
              <div className="flex items-center gap-2 font-semibold text-gray-900 tracking-tight">
                <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <span>ecomm</span>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-1">
                <NavLink href="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
                <NavLink href="/products" icon={<ShoppingBag className="w-4 h-4" />} label="Products" />
                <NavLink href="/analytics" icon={<BarChart3 className="w-4 h-4" />} label="Analytics" />

                <div className="h-4 w-px bg-gray-300 mx-2"></div>

                {/* Minimal Dropdown/Group for Tables */}
                <div className="flex items-center gap-1 text-sm font-medium text-gray-500 px-3">
                  <span className="text-xs uppercase tracking-wider text-gray-400 mr-2">Data</span>
                  <Link href="/tables/users" className="hover:text-black transition-colors">Users</Link>
                  <span className="text-gray-300">•</span>
                  <Link href="/tables/orders" className="hover:text-black transition-colors">Orders</Link>
                </div>
              </div>

              {/* Right Side (Search placeholder or Profile) */}
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-500 hover:bg-gray-100/50 rounded-full transition-all">
                  <Command className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 shadow-inner"></div>
              </div>
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

// Helper component for cleaner nav links
function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-black hover:bg-white/50 transition-all duration-200"
    >
      {icon}
      {label}
    </Link>
  );
}
