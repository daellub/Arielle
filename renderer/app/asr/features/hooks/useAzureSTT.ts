// app/asr/hooks/useAzureSTT.ts
export async function recognizeAzureSpeech(
    blob: Blob,
    apiKey: string,
    region?: string,
    endpoint?: string,
    language: string = 'ko-KR'
): Promise<string | null> {
    const base =
        endpoint?.trim()
            ? endpoint.replace(/\/+$/, '')
            : `https://${region}.stt.speech.microsoft.com`

    const url = new URL(
        '/speech/recognition/conversation/cognitiveservices/v1',
        base
    )
    url.searchParams.set('language', language)
    url.searchParams.set('format', 'simple')
    // url.searchParams.set('profanity', 'masked')

    let contentType = blob.type || 'audio/wav'
    if (/wav/i.test(contentType)) {
        contentType = 'audio/wav; codecs=audio/pcm'
    }

    try {
        const res = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': contentType,
                Accept: 'application/json',
            },
            body: blob,
        })

        if (!res.ok) {
            const t = await res.text().catch(() => '')
            console.error('Azure STT 요청 실패: ', res.status, t)
            return null
        }

        const data: any = await res.json().catch(() => ({}))

        const text =
            data?.DisplayText ??
            data?.NBest?.[0]?.Display ??
            data?.NBest?.[0]?.Lexical ??
            null

        return typeof text === 'string' && text.trim().length > 0 ? text : null
    } catch (e) {
        console.error('Azure STT 요청 중 오류 발생: ', e)
        return null
    }
}
