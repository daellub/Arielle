// app/asr/features/components/Notification.tsx
'use client'

import { motion, AnimatePresence} from 'motion/react'
import clsx from 'clsx'
import { useNotificationStore } from '@/app/store/useNotificationStore'


export default function Notification() {
    const { message, type, visible } = useNotificationStore()

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={clsx(
                        'fixed left-1/2 bottom-8 transform -translate-x-1/2 px-4 py-3 rounded-xl shadow-xl z-[9999] w-fit min-w-[200px] text-center text-white font-semibold text-sm',
                        {
                            'bg-green-500': type === 'success',
                            'bg-red-500': type === 'error',
                            'bg-blue-500': type === 'info',
                        }
                    )}
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    )
}