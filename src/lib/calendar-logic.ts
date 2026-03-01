import { addDays, format, startOfWeek, isSameDay, parseISO, getDay, parse } from 'date-fns'
import { Template, Override, TaskSchedule, Task } from '@/types/database'

export type CalendarEvent = {
    id: string
    title: string
    start: Date
    end: Date
    type: 'template' | 'task' | 'override'
    category_id?: string | null
    task_id?: string | null
    status?: string // for tasks
    template_id?: string | null
}

export function getBaseEventsForDate(
    date: Date,
    templates: Template[],
    overrides: Override[],
    taskSchedules: (TaskSchedule & { tasks: Task })[]
): CalendarEvent[] {
    const dayOfWeek = getDay(date)
    const dateStr = format(date, 'yyyy-MM-dd')

    // 1. Get templates for this day of week
    let events: CalendarEvent[] = templates
        .filter(t => t.day_of_week === dayOfWeek)
        .map(t => {
            const start = parse(t.start_time, 'HH:mm:ss', date)
            const end = parse(t.end_time, 'HH:mm:ss', date)
            return {
                id: `template-${t.id}-${dateStr}`,
                template_id: t.id,
                title: t.title,
                start,
                end,
                type: 'template',
                category_id: t.category_id,
            }
        })

    // 2. Apply Overrides
    const dayOverrides = overrides.filter(o => o.date === dateStr)

    dayOverrides.forEach(o => {
        if (o.type === 'delete' && o.template_id) {
            events = events.filter(e => e.template_id !== o.template_id)
        } else if (o.type === 'modify' && o.template_id) {
            const index = events.findIndex(e => e.template_id === o.template_id)
            if (index !== -1 && o.start_time && o.end_time) {
                events[index] = {
                    ...events[index],
                    title: o.title || events[index].title,
                    start: parse(o.start_time, 'HH:mm:ss', date),
                    end: parse(o.end_time, 'HH:mm:ss', date),
                    category_id: o.category_id || events[index].category_id,
                    type: 'override',
                }
            }
        } else if (o.type === 'add' && o.start_time && o.end_time) {
            events.push({
                id: `override-${o.id}`,
                title: o.title || 'Esdeveniment',
                start: parse(o.start_time, 'HH:mm:ss', date),
                end: parse(o.end_time, 'HH:mm:ss', date),
                type: 'override',
                category_id: o.category_id,
            })
        }
    })

    // 3. Add Task Schedules
    taskSchedules.forEach(ts => {
        const tsStart = new Date(ts.start_time)
        if (isSameDay(tsStart, date)) {
            const start = tsStart
            const end = new Date(tsStart.getTime() + ts.duration * 60000)
            events.push({
                id: `task-schedule-${ts.id}`,
                title: ts.tasks.title,
                start,
                end,
                type: 'task',
                task_id: ts.task_id,
                status: ts.tasks.status,
                category_id: ts.tasks.category_id,
            })
        }
    })

    return events.sort((a, b) => a.start.getTime() - b.start.getTime())
}
