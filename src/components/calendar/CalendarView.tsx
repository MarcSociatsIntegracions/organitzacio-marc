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
    subDays
} from 'date-fns'
import { ca } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Template, Override, TaskSchedule, Task, Category } from '@/types/database'
import { getBaseEventsForDate, CalendarEvent } from '@/lib/calendar-logic'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus, MoreVertical, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'

export default function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [templates, setTemplates] = useState<Template[]>([])
    const [overrides, setOverrides] = useState<Override[]>([])
    const [taskSchedules, setTaskSchedules] = useState<(TaskSchedule & { tasks: Task })[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
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
        fetchData()
    }, [supabase, currentDate])

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    const eventsByDay = useMemo(() => {
        return days.map(day => ({
            date: day,
            events: getBaseEventsForDate(day, templates, overrides, taskSchedules)
        }))
    }, [days, templates, overrides, taskSchedules])

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

    return (
        <div className="flex flex-col h-full bg-background rounded-xl border shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: ca })}
                    </h2>
                    <div className="flex items-center border rounded-lg overflow-hidden">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 border-x rounded-none" onClick={() => setCurrentDate(new Date())}>
                            Avui
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Nou bloc
                    </Button>
                </div>
            </div>

            {/* Week View */}
            <div className="flex-1 overflow-auto">
                <div className="flex min-w-[800px] h-[1200px] relative">
                    {/* Time scale */}
                    <div className="w-16 border-r sticky left-0 bg-background z-10 py-1">
                        {hours.map(hour => (
                            <div key={hour} className="h-[50px] text-[10px] text-muted-foreground flex items-center justify-center -translate-y-[25px]">
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="flex flex-1">
                        {eventsByDay.map(({ date, events }, i) => {
                            const isToday = isTodayFn(date)
                            return (
                                <div key={i} className={cn(
                                    "flex-1 border-r last:border-r-0 relative group",
                                    isToday && "bg-primary/5"
                                )}>
                                    {/* Day Header */}
                                    <div className={cn(
                                        "sticky top-0 bg-background/95 backdrop-blur-sm z-20 border-b p-2 text-center transition-colors",
                                        isToday && "text-primary bg-primary/10"
                                    )}>
                                        <p className="text-xs uppercase font-medium">{format(date, 'EEE', { locale: ca })}</p>
                                        <p className="text-lg font-bold">{format(date, 'd')}</p>
                                    </div>

                                    {/* Hour grid lines */}
                                    {hours.map(hour => (
                                        <div key={hour} className="h-[50px] border-b border-muted/50 last:border-0" />
                                    ))}

                                    {/* Events */}
                                    {events.map((event) => (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                "absolute left-1 right-1 rounded-md p-1.5 text-[10px] text-white shadow-sm overflow-hidden select-none cursor-pointer hover:brightness-110 transition-all z-10 border border-white/20",
                                                event.type === 'task' && "ring-2 ring-white/50 ring-inset"
                                            )}
                                            style={getEventStyle(event)}
                                        >
                                            <p className="font-bold leading-none truncate">{event.title}</p>
                                            <p className="opacity-80 mt-0.5 leading-none">
                                                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                                            </p>
                                            {event.type === 'task' && event.status === 'done' && (
                                                <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full" />
                                            )}
                                        </div>
                                    ))}

                                    {/* Current time indicator */}
                                    {isToday && (
                                        <div
                                            className="absolute left-0 right-0 h-0.5 bg-red-500 z-30 pointer-events-none after:content-[''] after:absolute after:left-0 after:-top-1 after:w-2 after:h-2 after:bg-red-500 after:rounded-full"
                                            style={{ top: `${(differenceInMinutes(new Date(), startOfDay(new Date())) / 1440) * 100}%` }}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
