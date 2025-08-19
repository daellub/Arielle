// app/layout.tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { theCircle, bmDohyeon } from './fonts'
import './globals.css'
import Providers from './providers'
import ToastContainer from '@/app/common/toast/ToastContainer'

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Arielle",
    description: "Arielle Desktop Companion",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} ${theCircle.variable} ${bmDohyeon.variable}`}>
            <body className="bg-white min-h-screen">
                <Providers>{children}</Providers>
                <ToastContainer />
            </body>
        </html>
    );
}
