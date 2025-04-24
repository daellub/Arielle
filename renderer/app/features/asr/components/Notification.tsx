// app/components/Notification.tsx
'use client'

import { motion, AnimatePresence} from 'motion/react'
import { useEffect } from 'react'
import clsx from 'clsx'

interface Props {
    message: string
    type?: 'success' | 'error' | 'info'
    onClose: () => void
}

export default function Notification({ message, type = 'info', onClose }: Props) {
    useEffect(() => {
        const timeout = setTimeout(() => {
            onClose()
        }, 1500)

        return () => clearTimeout(timeout)
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={clsx(
                'fixed left-1/2 bottom-8 transform -translate-x-1/2 px-4 py-3 rounded-xl shadow-xl z-50 w-fit min-w-[200px] text-center text-white font-semibold text-sm',
                {
                    'bg-green-500': type === 'success',
                    'bg-red-500': type === 'error',
                    'bg-blue-500': type === 'info',
                }
            )}
        >
            {message}
        </motion.div>
    )
}