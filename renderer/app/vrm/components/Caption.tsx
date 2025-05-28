// app/vrm/components/Caption.tsx
'use client'

import styles from './Caption.module.css'
import { motion } from 'framer-motion'

interface Props {
    type: 'intro' | 'scene'
}

const textMap = {
    intro: '「 彼女の記憶をデジタルに再構築しています。 」',
    scene: '「 記録の断片が浮かび上がっています... 」',
}

export default function Caption({ type }: Props) {
    const text = textMap[type]

    return type === 'intro' ? (
        <motion.div
            className={styles.caption}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1.5 }}
        >
            {text}
        </motion.div>
    ) : (
        <p className={styles.caption}>{text}</p>
    )
}
