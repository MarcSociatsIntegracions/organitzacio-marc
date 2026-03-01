'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Task } from '@/types/database'
import { DialogFooter } from '@/components/ui/dialog'

export default function ScheduleTaskModal({
    task,
    onSuccess
}: {
    task: Task,
    onSuccess: () => void
}) {
    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('09:00')
    const [duration, setDuration] = useState(task.estimated_duration || 60)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!date || !startTime) return

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Usuari no trobat")

            const startDateTime = new Date(`${date}T${startTime}:00`)

            const { error } = await supabase
                .from('task_schedule')
                .insert({
                    user_id: user.id,
                    task_id: task.id,
                    start_time: startDateTime.toISOString(),
                    duration: duration
                })

            if (error) throw error

            toast.success("Tasca programada al calendari!")
            onSuccess()
        } catch (err: any) {
            toast.error("Error al programar la tasca")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSchedule} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="schedDate">Dia</Label>
                <Input id="schedDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="schedTime">Hora d'inici</Label>
                    <Input id="schedTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="schedDuration">Durada (minuts)</Label>
                    <Input id="schedDuration" type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} required />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={loading || !date}>
                    {loading ? 'Programant...' : 'Confirmar Programació'}
                </Button>
            </DialogFooter>
        </form>
    )
}
