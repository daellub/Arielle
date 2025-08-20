// app/llm/hooks/useToneLabel.ts

export function useToneLabel(tone?: string): string {
    const toneMap: Record<string, string> = {
        formal: '📘 격식체',
        casual: '🧢 캐주얼',
        poetic: '📜 시적',
        gentle: '🍃 부드러움',
        assertive: '📣 단호함',
        playful: '🎈 장난기',
        introspective: '🔍 내성적',
        hesitant: '⏳ 머뭇거림',
        respectful: '🙇 정중함',
        intense: '🔥 강렬함',
        humorous: '😂 유머',
        sincere: '💎 진심',
        dreamy: '🌙 몽환',
        admiring: '👏 감탄',
        affectionate: '🤗 다정함',
        bitter: '😒 씁쓸함',
        apologetic: '🙏 사과',
        teasing: '😜 놀림'
    }

    return tone ? (toneMap[tone] ?? '중립') : '중립'
}
