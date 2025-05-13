// app/llm/hooks/useEmotionLabel.ts

export function useEmotionLabel(emotion?: string): string {
    const emotionMap: Record<string, string> = {
        joyful: '😊 기쁨',
        hopeful: '🌈 희망',
        melancholic: '🌧️ 우울',
        romantic: '💖 로맨틱',
        peaceful: '🕊️ 평온',
        nervous: '😰 긴장',
        regretful: '😔 후회',
        admiring: '👏 감탄',
        tense: '😬 긴박',
        nostalgic: '📼 향수',
        whimsical: '🎠 기발',
        sarcastic: '😏 빈정',
        bitter: '😒 씁쓸',
        apologetic: '🙏 사과',
        affectionate: '🤗 다정',
        solemn: '🪦 엄숙',
        cheerful: '😁 쾌활',
        embarrassed: '😳 당황',
        contemplative: '🤔 사색'
    }

    return emotion ? (emotionMap[emotion] ?? '🙂 중립') : '🙂 중립'
}
