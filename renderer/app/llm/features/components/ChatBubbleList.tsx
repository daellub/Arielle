// app/features/llm/components/ChatBubbleList.tsx
'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import StreamingIndicator from './StreamingIndicator'
import ChatBubble from './ChatBubble'
import { useLLMStore } from '@/app/llm/features/store/useLLMStore'

interface Props {
    language: 'ko' | 'en'
}

export default function ChatBubbleList({ language }: Props) {
    const count = useLLMStore((s) => s.messages.length)
    const streaming = useLLMStore((s) => s.streaming)

    const parentRef = useRef<HTMLDivElement>(null)
    const stickToBottomRef = useRef(true)

    const rowVirtualizer = useVirtualizer({
        count,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 88,
        overscan: 6,
    })

    useEffect(() => {
        const el = parentRef.current
        if (!el) return
        const onScroll = () => {
            const gap = el.scrollHeight - el.scrollTop - el.clientHeight
            stickToBottomRef.current = gap < 40
        }
        el.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
        return () => el.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        if (!parentRef.current || !stickToBottomRef.current || count === 0) return
        rowVirtualizer.scrollToIndex(count - 1, { align: 'end' })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count, language])

    const virtualItems = rowVirtualizer.getVirtualItems()
    const totalSize = rowVirtualizer.getTotalSize()

    return (
        <div style={{ position: 'relative' }}>
            <div
                ref={parentRef}
                className="h-full overflow-y-auto flex flex-col space-y-5 px-2 py-2 pr-4"
            >
                <div
                    style={{
                        height: totalSize,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualItems.map((vi) => (
                        <div
                            key={vi.key}
                            data-index={vi.index}
                            ref={rowVirtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${vi.start}px)`,
                                paddingTop: vi.index === 0 ? 0 : 10,
                                paddingBottom: 10,
                            }}
                        >
                            <ChatBubble index={vi.index} lang={language} />
                        </div>
                    ))}
                </div>

                <div className="mt-2">
                    <StreamingIndicator visible={streaming} />
                </div>
            </div>
        </div>
    )
}
