// app/home/HandwriteAnim.tsx
'use client'

import Lottie from 'lottie-react'
import animationData from '@/public/assets/Arielle_Handwrite.json'

export default function HandwriteAnim() {
    return (
        <div className='w-[1400px] h-[800px]'>
            <Lottie 
                animationData={animationData}
                loop={true}
                autoPlay={true}
            />
        </div>
    )
}