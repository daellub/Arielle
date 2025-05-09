// app/translate/features/components/charts/PieChartClient.tsx
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface Props {
    llmRatio: number
}

const COLORS = ['#ec4899', '#e5e7eb']

export default function PieChartClient({ llmRatio }: Props) {
    const data = [
        { name: 'LLM', value: llmRatio },
        { name: 'Other', value: 100 - llmRatio },
    ]

    return (
        <div style={{ width: 60 }}>
            <ResponsiveContainer width="100%" aspect={1}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={12}
                        outerRadius={18}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={1}
                        dataKey="value"
                        isAnimationActive={true}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
