// app/tts/api/synthesize.ts

export async function synthesizeTTS(text: string): Promise<string> {
    const res = await fetch("http://localhost:8000/tts/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            text,
            model_id: 0,
            speaker_id: 0,
            style: "Neutral",
            language: "JP",
        }),
    });

    if (!res.ok) throw new Error("TTS 요청 실패");

    const blob = await res.blob();
    return URL.createObjectURL(blob);
}
