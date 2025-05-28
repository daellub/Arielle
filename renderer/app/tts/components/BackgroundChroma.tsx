// app/tts/components/BackgroundChroma.tsx
export default function BackgroundChroma() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="w-full h-full bg-[length:400%_400%] animate-chromaPattern opacity-20 blur-[140px] mix-blend-screen" />
        </div>
    )
}
