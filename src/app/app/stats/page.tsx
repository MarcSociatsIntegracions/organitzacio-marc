'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { Category, Task, TimeEntry, TaskSchedule, Template } from '@/types/database'
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns'
import { ca } from 'date-fns/locale'

export default function StatsPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
    const [schedules, setSchedules] = useState<TaskSchedule[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
            const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

            const [
                { data: cats },
                { data: tsks },
                { data: entries },
                { data: scheds }
            ] = await Promise.all([
                supabase.from('categories').select('*'),
                supabase.from('tasks').select('*'),
                supabase.from('time_entries').select('*').gte('start_time', weekStart.toISOString()).lte('start_time', weekEnd.toISOString()),
                supabase.from('task_schedule').select('*').gte('start_time', weekStart.toISOString()).lte('start_time', weekEnd.toISOString()),
            ])

            if (cats) setCategories(cats)
            if (tsks) setTasks(tsks)
            if (entries) setTimeEntries(entries)
            if (scheds) setSchedules(scheds)
            setLoading(false)
        }
        fetchData()
    }, [supabase])

    const categoryData = categories.map(cat => {
        const plannedMinutes = schedules
            .filter(s => {
                const task = tasks.find(t => t.id === s.task_id)
                return task?.category_id === cat.id
            })
            .reduce((acc, s) => acc + s.duration, 0)

        const realMinutes = timeEntries
            .filter(e => e.category_id === cat.id)
            .reduce((acc, e) => acc + (e.duration || 0), 0)

        return {
            name: cat.name,
            planificat: Math.round(plannedMinutes / 60 * 10) / 10,
            real: Math.round(realMinutes / 60 * 10) / 10,
            color: cat.color
        }
    }).filter(d => d.planificat > 0 || d.real > 0)

    const taskStats = [
        { name: 'Fetes', value: tasks.filter(t => t.status === 'done').length },
        { name: 'Pendents', value: tasks.filter(t => t.status === 'todo').length },
        { name: 'Backlog', value: tasks.filter(t => t.status === 'backlog').length },
    ]

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444']

    return (
        <div className="space-y-8 pb-8">
            <div>
                <h1 className="text-3xl font-bold">Estadístiques</h1>
                <p className="text-muted-foreground">Resum de la teva activitat aquesta setmana.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="min-h-[450px]">
                    <CardHeader>
                        <CardTitle>Hores per Categoria</CardTitle>
                        <CardDescription>Comparativa entre hores planificades i reals</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {loading ? (
                            <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
                        ) : categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis unit="h" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="planificat" fill="#3b82f6" name="Planificat (h)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="real" fill="#10b981" name="Real (h)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No hi ha dades per mostrar aquesta setmana.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="min-h-[450px]">
                    <CardHeader>
                        <CardTitle>Estat de les Tasques</CardTitle>
                        <CardDescription>Distribució per estat</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {loading ? (
                            <div className="w-full h-full bg-muted animate-pulse rounded-lg" />
                        ) : tasks.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={taskStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {taskStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Encara no tens tasques.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
