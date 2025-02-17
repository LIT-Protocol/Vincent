"use client"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import Header from "@/components/layout/Header"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-background")}>
        <Header />
        <main className="max-w-screen-xl mx-auto p-6">
          {children}
        </main>
      </body>
    </html>
  )
}
