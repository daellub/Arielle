// app/vrm/components/MemoryLoadingBar.tsx
import { motion } from 'framer-motion'
import styles from './MemoryLoadingBar.module.css'

export default function MemoryLoadingBar({ trigger }: { trigger: number }) {
    return (
        <div className={styles.barContainer}>
            <motion.div
                key={trigger}
                className={styles.bar}
                initial={{ x: '0%' }}
                animate={{ x: ['-100%', '500%', '-100%'] }}
                transition={{
                    duration: 3.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </div>
    )
}