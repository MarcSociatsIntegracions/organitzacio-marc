'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, Square, Pause, RotateCcw, Clock } from 'lucide-react'
import { formatDuration } from 'date-fns'
import { ca } from 'date-fns/locale'
import { toast } from 'sonner'
import { Task, Category } from '@/types/database'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function Timer() {
    const [isActive, setIsActive] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [time, setTime] = useState(0)
    const [tasks, setTasks] = useState<Task[]>([])
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCatId, setSelectedCatId] = useState<string | null>(null)

    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            const [{ data: tsks }, { data: cats }] = await Promise.all([
                supabase.from('tasks').select('*').eq('status', 'todo'),
                supabase.from('categories').select('*'),
            ])
            if (tsks) setTasks(tsks)
            if (cats) setCategories(cats)
        }
        fetchData()
    }, [supabase])

    useEffect(() => {
        if (isActive && !isPaused) {
            timerRef.current = setInterval(() => {
                setTime((time) => time + 1)
            }, 1000)
        } else {
            if (timerRef.current) clearInterval(timerRef.current)
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [isActive, isPaused])

    const handleStart = () => {
        setIsActive(true)
        setIsPaused(false)
    }

    const handlePause = () => {
        setIsPaused(!isPaused)
    }

    const handleStop = async () => {
        if (!isActive) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Usuari no trobat")

            const durationMinutes = Math.floor(time / 60)

            const { error } = await supabase
                .from('time_entries')
                .insert({
                    user_id: user.id,
                    task_id: selectedTaskId,
                    category_id: selectedCatId,
                    start_time: new Date(Date.now() - time * 1000).toISOString(),
                    end_time: new Date().toISOString(),
                    duration: durationMinutes
                })

            if (error) throw error

            toast.success(`Timer desat: ${durationMinutes} minuts`)
            setIsActive(false)
            setTime(0)
        } catch (err: any) {
            toast.error("Error al desar el temps")
        } finally {
            setLoading(false)
        }
    }

    const [loading, setLoading] = useState(false)

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <Card className="bg-primary text-primary-foreground shadow-lg border-none overflow-hidden">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-full animate-pulse-slow">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Cronòmetre</p>
                            <h2 className="text-4xl font-mono font-bold">{formatTime(time)}</h2>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
                        {!isActive ? (
                            <>
                                <Select onValueChange={setSelectedTaskId}>
                                    <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-white/60">
                                        <SelectValue placeholder="Vincular a tasca..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tasks.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="secondary" className="w-full font-bold" onClick={handleStart}>
                                    <Play className="w-4 h-4 mr-2" /> COMENCAR
                                </Button>
                            </>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="secondary" className="flex-1" onClick={handlePause}>
                                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                </Button>
                                <Button variant="destructive" className="flex-1 bg-red-500 hover:bg-red-600 border-none" onClick={handleStop} disabled={loading}>
                                    <Square className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
