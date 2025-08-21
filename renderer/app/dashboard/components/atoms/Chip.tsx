// app/dashboard/components/atoms/Chip.tsx
export function Chip({ label, tone='slate' }:{label:string; tone?: 'indigo'|'sky'|'rose'|'slate'}) {
    const map = {
        indigo: 'bg-indigo-500/15 text-indigo-200 ring-indigo-400/25',
        sky:    'bg-sky-500/15 text-sky-200 ring-sky-400/25',
        rose:   'bg-rose-500/15 text-rose-200 ring-rose-400/25',
        slate:  'bg-white/10 text-white/70 ring-white/15',
    }
    return (
        <span className={`px-2 py-0.5 rounded-md text-[11px] ring-1 ${map[tone]}`}>{label}</span>
    )
}
