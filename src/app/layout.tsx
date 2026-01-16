import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import Navbar from "./components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-Comm DB Manager",
  description: "Modern Database Management Dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('admin_session')?.value;
  let session = null;

  if (sessionVal) {
    try {
      session = JSON.parse(sessionVal);
    } catch {}
  }

  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F5F5F7] text-[#1d1d1f] antialiased`}>
        <div className="min-h-screen flex flex-col">
          
          <Navbar session={session} />

          <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 lg:p-10">
            {children}
          </main>
          
        </div>
      </body>
    </html>
  );
}
