'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface CalendarBlockFormProps {
    onSuccess: () => void
    initialDate?: Date
}

export default function CalendarBlockForm({ onSuccess, initialDate }: CalendarBlockFormProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)

    const [title, setTitle] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [type, setType] = useState<'template' | 'override'>('template')
    const [dayOfWeek, setDayOfWeek] = useState('1')
    const [specificDate, setSpecificDate] = useState(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('10:00')

    const supabase = createClient()

    useEffect(() => {
        async function fetchCategories() {
            const { data } = await supabase.from('categories').select('*')
            if (data) setCategories(data)
        }
        fetchCategories()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Usuari no trobat")

            if (type === 'template') {
                const { error } = await supabase.from('templates').insert({
                    user_id: user.id,
                    title,
                    category_id: categoryId || null,
                    day_of_week: parseInt(dayOfWeek),
                    start_time: startTime,
                    end_time: endTime
                })
                if (error) throw error
            } else {
                const { error } = await supabase.from('overrides').insert({
                    user_id: user.id,
                    title,
                    category_id: categoryId || null,
                    date: specificDate,
                    start_time: startTime,
                    end_time: endTime,
                    type: 'add'
                })
                if (error) throw error
            }

            toast.success("Bloc afegit correctament")
            onSuccess()
        } catch (err: any) {
            toast.error("Error al guardar el bloc")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="blockTitle">Títol</Label>
                <Input id="blockTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Gimnàs matinal" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Tipus de bloc</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="template">Repetició setmanal</SelectItem>
                            <SelectItem value="override">Dia puntual</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Social, Feina..." />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                        {cat.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {type === 'template' ? (
                <div className="space-y-2">
                    <Label>Dia de la setmana</Label>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Dilluns</SelectItem>
                            <SelectItem value="2">Dimarts</SelectItem>
                            <SelectItem value="3">Dimecres</SelectItem>
                            <SelectItem value="4">Dijous</SelectItem>
                            <SelectItem value="5">Divendres</SelectItem>
                            <SelectItem value="6">Dissabte</SelectItem>
                            <SelectItem value="0">Diumenge</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label>Data específica</Label>
                    <Input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} required />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Inici</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label>Final</Label>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardant..." : "Afegir Bloc"}
            </Button>
        </form>
    )
}
