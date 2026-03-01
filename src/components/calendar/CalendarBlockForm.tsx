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
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarBlockFormProps {
    onSuccess: () => void
    initialDate?: Date
    editData?: {
        id: string
        type: 'template' | 'override'
        title: string
        category_id?: string | null
        start_time: string
        end_time: string
        day_of_week?: number
        date?: string
    }
}

export default function CalendarBlockForm({ onSuccess, initialDate, editData }: CalendarBlockFormProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [title, setTitle] = useState(editData?.title || '')
    const [categoryId, setCategoryId] = useState(editData?.category_id || '')
    const [type, setType] = useState<'template' | 'override'>(editData?.type || 'template')
    const [selectedDays, setSelectedDays] = useState<string[]>(editData?.day_of_week !== undefined ? [editData.day_of_week.toString()] : [])
    const [specificDate, setSpecificDate] = useState(editData?.date || (initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')))
    const [startTime, setStartTime] = useState(editData?.start_time?.substring(0, 5) || '09:00')
    const [endTime, setEndTime] = useState(editData?.end_time?.substring(0, 5) || '10:00')

    const days = [
        { label: 'dl', value: '1' },
        { label: 'dt', value: '2' },
        { label: 'dm', value: '3' },
        { label: 'dj', value: '4' },
        { label: 'dv', value: '5' },
        { label: 'ds', value: '6' },
        { label: 'dg', value: '0' },
    ]

    const toggleDay = (day: string) => {
        if (editData) {
            setSelectedDays([day]) // If editing, only one day allowed (to avoid confusion with existing ID)
        } else {
            setSelectedDays(prev =>
                prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
            )
        }
    }

    const supabase = createClient()

    useEffect(() => {
        // Auto-select initial day if creation mode and initialDate exists
        if (!editData && initialDate && selectedDays.length === 0) {
            const dayNum = initialDate.getDay()
            setSelectedDays([dayNum.toString()])
        }
    }, [initialDate, editData])

    useEffect(() => {
        async function fetchCategories() {
            const { data } = await supabase.from('categories').select('*')
            if (data) setCategories(data)
        }
        fetchCategories()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (type === 'template' && selectedDays.length === 0) {
            toast.error("Selecciona almenys un dia")
            return
        }
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Usuari no trobat")

            const payload: any = {
                user_id: user.id,
                title,
                category_id: categoryId || null,
                start_time: startTime,
                end_time: endTime,
            }

            if (editData) {
                if (editData.type === 'template') {
                    const { error } = await supabase.from('templates').update({
                        ...payload,
                        day_of_week: parseInt(selectedDays[0])
                    }).eq('id', editData.id)
                    if (error) throw error
                } else {
                    const { error } = await supabase.from('overrides').update({
                        ...payload,
                        date: specificDate
                    }).eq('id', editData.id)
                    if (error) throw error
                }
                toast.success("Bloc actualitzat")
            } else {
                if (type === 'template') {
                    // Create multiple records, one for each day
                    const inserts = selectedDays.map(day => ({
                        ...payload,
                        day_of_week: parseInt(day)
                    }))
                    const { error } = await supabase.from('templates').insert(inserts)
                    if (error) throw error
                } else {
                    const { error } = await supabase.from('overrides').insert({
                        ...payload,
                        date: specificDate,
                        type: 'add'
                    })
                    if (error) throw error
                }
                toast.success(type === 'template' && selectedDays.length > 1 ? "Blocs afegits" : "Bloc afegit")
            }

            onSuccess()
        } catch (err: any) {
            toast.error("Error al guardar")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!editData) return
        if (!confirm("Segur que vols eliminar aquest bloc? Segur?")) return
        setDeleting(true)
        try {
            const table = editData.type === 'template' ? 'templates' : 'overrides'
            const { error } = await supabase.from(table).delete().eq('id', editData.id)
            if (error) throw error
            toast.success("Bloc eliminat")
            onSuccess()
        } catch (err) {
            toast.error("Error al eliminar")
        } finally {
            setDeleting(false)
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
                    <Select value={type} onValueChange={(v: any) => setType(v)} disabled={!!editData}>
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
                    <Label>Dies de la setmana</Label>
                    <div className="flex gap-1.5 flex-wrap">
                        {days.map((day) => (
                            <Button
                                key={day.value}
                                type="button"
                                variant={selectedDays.includes(day.value) ? "default" : "outline"}
                                className={cn(
                                    "w-10 h-10 p-0 text-xs font-bold uppercase rounded-full",
                                    selectedDays.includes(day.value) ? "bg-primary" : "text-muted-foreground"
                                )}
                                onClick={() => toggleDay(day.value)}
                            >
                                {day.label}
                            </Button>
                        ))}
                    </div>
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

            <div className="flex gap-2">
                {editData && (
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting || loading}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
                <Button type="submit" className="flex-1" disabled={loading || deleting}>
                    {loading ? "Guardant..." : editData ? "Actualitzar" : "Afegir Bloc"}
                </Button>
            </div>
        </form>
    )
}
