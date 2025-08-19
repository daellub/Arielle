// app/fonts.ts
import localFont from 'next/font/local'

export const theCircle = localFont({
    src: [{ path: '../public/fonts/TheCircleM.ttf', weight: '500', style: 'normal' }],
    variable: '--font-thecircle',
    display: 'swap'
})

export const bmDohyeon = localFont({
    src: [{ path: '../public/fonts/BMDOHYEON_ttf.ttf', weight: '400', style: 'normal' }],
    variable: '--font-bmdohyeon',
    display: 'swap'
})