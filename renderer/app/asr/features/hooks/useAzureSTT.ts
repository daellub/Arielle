// app/asr/hooks/useAzureSTT.ts
export async function recognizeAzureSpeech(
    blob: Blob,
    apiKey: string,
    region?: string,
    endpoint?: string,
    language: string = 'ko-KR'
): Promise<string | null> {
    const apiEndpoint = endpoint?.trim()
        ? `${endpoint}/speech/recognition/conversation/cognitiveservices/v1?language=ko-KR`
        : `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=ko-KR`


    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Content-Type': 'audio/webm; codecs=opus',
            'Accept': 'application/json',
        },
        body: blob
    })

    if (!response.ok) {
        console.error('Azure STT 요청 실패:', await response.text())
        return null
    }

    const result = await response.json()
    return result.DisplayText ?? null
}
