'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    format,
    addDays,
    startOfWeek,
    addHours,
    startOfDay,
    differenceInMinutes,
    isSameDay,
    isToday as isTodayFn,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    endOfWeek as endOfWeekFn,
} from 'date-fns'
import { ca } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Template, Override, TaskSchedule, Task, Category } from '@/types/database'
import { getBaseEventsForDate, CalendarEvent } from '@/lib/calendar-logic'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import CalendarBlockForm from './CalendarBlockForm'

type ViewMode = 'day' | 'week' | 'month'

export default function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<ViewMode>('week')
    const [templates, setTemplates] = useState<Template[]>([])
    const [overrides, setOverrides] = useState<Override[]>([])
    const [taskSchedules, setTaskSchedules] = useState<(TaskSchedule & { tasks: Task })[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const supabase = createClient()

    const fetchData = async () => {
        setLoading(true)
        const [
            { data: templatesData },
            { data: overridesData },
            { data: schedulesData },
            { data: categoriesData }
        ] = await Promise.all([
            supabase.from('templates').select('*'),
            supabase.from('overrides').select('*'),
            supabase.from('task_schedule').select('*, tasks(*)'),
            supabase.from('categories').select('*'),
        ])

        if (templatesData) setTemplates(templatesData)
        if (overridesData) setOverrides(overridesData)
        if (schedulesData) setTaskSchedules(schedulesData as any)
        if (categoriesData) setCategories(categoriesData)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [supabase, currentDate])

    const hours = Array.from({ length: 24 }, (_, i) => i)

    const getEventStyle = (event: CalendarEvent) => {
        const startOfDayTime = startOfDay(event.start)
        const top = (differenceInMinutes(event.start, startOfDayTime) / 1440) * 100
        const height = (differenceInMinutes(event.end, event.start) / 1440) * 100
        const category = categories.find(c => c.id === event.category_id)

        return {
            top: `${top}%`,
            height: `${height}%`,
            backgroundColor: category?.color || '#3b82f6',
        }
    }

    const navigate = (direction: 'prev' | 'next') => {
        if (viewMode === 'day') setCurrentDate(d => direction === 'prev' ? addDays(d, -1) : addDays(d, 1))
        else if (viewMode === 'week') setCurrentDate(d => direction === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1))
        else setCurrentDate(d => direction === 'prev' ? subMonths(d, 1) : addMonths(d, 1))
    }

    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

        return (
            <div className="flex-1 overflow-auto">
                <div className="flex min-w-[600px] h-[1000px] relative">
                    <div className="w-12 border-r sticky left-0 bg-background z-10 py-1">
                        {hours.map(hour => (
                            <div key={hour} className="h-[40px] text-[10px] text-muted-foreground flex items-center justify-center -translate-y-[20px]">
                                {hour}:00
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-1">
                        {weekDays.map((day, i) => {
                            const isToday = isTodayFn(day)
                            const events = getBaseEventsForDate(day, templates, overrides, taskSchedules)
                            return (
                                <div key={i} className={cn("flex-1 border-r last:border-r-0 relative", isToday && "bg-primary/5")}>
                                    <div className={cn("sticky top-0 bg-background/95 backdrop-blur-sm z-20 border-b p-1 text-center font-bold text-xs", isToday && "text-primary bg-primary/10")}>
                                        {format(day, 'EEE d', { locale: ca })}
                                    </div>
                                    {hours.map(hour => <div key={hour} className="h-[40px] border-b border-muted/30 last:border-0" />)}
                                    {events.map((event) => (
                                        <div
                                            key={event.id}
                                            className={cn("absolute left-0.5 right-0.5 rounded p-1 text-[9px] text-white shadow-sm overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10 border border-black/10")}
                                            style={getEventStyle(event)}
                                            onClick={() => console.log('Event clicat:', event)}
                                        >
                                            <p className="font-bold truncate">{event.title}</p>
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    const renderDayView = () => {
        const events = getBaseEventsForDate(currentDate, templates, overrides, taskSchedules)
        return (
            <div className="flex-1 overflow-auto p-4">
                <div className="max-w-xl mx-auto h-[1000px] relative bg-white border rounded-xl shadow-sm">
                    <div className="flex h-full">
                        <div className="w-16 border-r sticky left-0 bg-background py-1">
                            {hours.map(hour => (
                                <div key={hour} className="h-[40px] text-[10px] text-muted-foreground flex items-center justify-center -translate-y-[20px]">
                                    {hour}:00
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 relative">
                            {hours.map(hour => <div key={hour} className="h-[40px] border-b border-muted/30 last:border-0" />)}
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className="absolute left-1 right-2 rounded-lg p-3 text-sm text-white shadow-md overflow-hidden cursor-pointer hover:scale-[1.01] transition-all z-10 border border-black/10"
                                    style={getEventStyle(event)}
                                >
                                    <p className="font-bold flex items-center gap-2">
                                        {event.title}
                                        {event.type === 'task' && <Badge variant="secondary" className="bg-white/20 text-white border-none text-[10px]">Tasca</Badge>}
                                    </p>
                                    <p className="text-xs opacity-90">{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
        const endDate = endOfWeekFn(monthEnd, { weekStartsOn: 1 })
        const monthDays = eachDayOfInterval({ start: startDate, end: endDate })

        return (
            <div className="flex-1 grid grid-cols-7 h-full">
                {['dl', 'dt', 'dm', 'dj', 'dv', 'ds', 'dg'].map(d => (
                    <div key={d} className="bg-muted/50 p-2 text-center text-xs font-bold uppercase border-b border-r last:border-r-0">{d}</div>
                ))}
                {monthDays.map((day, i) => {
                    const isToday = isTodayFn(day)
                    const isCurrentMonth = isSameDay(startOfMonth(day), monthStart)
                    const dayEvents = getBaseEventsForDate(day, templates, overrides, taskSchedules)
                    return (
                        <div key={i} className={cn(
                            "min-h-[100px] border-b border-r last:border-r-0 p-1 transition-colors hover:bg-muted/30 cursor-pointer",
                            !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                            isToday && "bg-primary/5 ring-1 ring-primary inset-0 z-10"
                        )} onClick={() => { setViewMode('day'); setCurrentDate(day); }}>
                            <p className={cn("text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full", isToday && "bg-primary text-white")}>
                                {format(day, 'd')}
                            </p>
                            <div className="space-y-0.5">
                                {dayEvents.slice(0, 3).map(e => (
                                    <div key={e.id} className="text-[9px] px-1 rounded truncate text-white" style={{ backgroundColor: categories.find(c => c.id === e.category_id)?.color || '#3b82f6' }}>
                                        {e.title}
                                    </div>
                                ))}
                                {dayEvents.length > 3 && <p className="text-[8px] text-muted-foreground ml-1">+{dayEvents.length - 3} més</p>}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-background rounded-xl border shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between p-3 border-b gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded-lg p-0.5 bg-muted/50">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('prev')}><ChevronLeft className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs font-bold" onClick={() => setCurrentDate(new Date())}>Avui</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('next')}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                    <h2 className="text-lg font-bold capitalize w-40">
                        {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'd MMM yyyy', { locale: ca })}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                        <TabsList className="h-9">
                            <TabsTrigger value="day" className="px-3 text-xs">Dia</TabsTrigger>
                            <TabsTrigger value="week" className="px-3 text-xs">Setm.</TabsTrigger>
                            <TabsTrigger value="month" className="px-3 text-xs">Mes</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-primary hover:bg-primary/90">
                                <Plus className="w-4 h-4 mr-1.5" /> Nou bloc
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader><DialogTitle>Crear bloc al calendari</DialogTitle></DialogHeader>
                            <CalendarBlockForm onSuccess={() => { setIsFormOpen(false); fetchData(); }} initialDate={currentDate} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-50/30">
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'month' && renderMonthView()}
            </div>
        </div>
    )
}
