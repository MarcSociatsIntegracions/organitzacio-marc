'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, Category, Objective } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
    Plus,
    Search,
    Calendar as CalendarIcon,
    Target,
    Edit2,
    Trash2,
    Clock,
    MoreVertical,
    CalendarPlus
} from 'lucide-react'
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
import TaskForm from './TaskForm'
import ScheduleTaskModal from './ScheduleTaskModal'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ca } from 'date-fns/locale'

export default function TaskList() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [objectives, setObjectives] = useState<Objective[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'backlog' | 'todo' | 'done'>('todo')
    const [search, setSearch] = useState('')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isScheduleOpen, setIsScheduleOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [schedulingTask, setSchedulingTask] = useState<Task | null>(null)

    const supabase = createClient()

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })
        if (filter !== 'all') query = query.eq('status', filter)

        const [{ data: tasksData }, { data: catsData }, { data: objsData }] = await Promise.all([
            query,
            supabase.from('categories').select('*'),
            supabase.from('objectives').select('*'),
        ])

        if (tasksData) setTasks(tasksData)
        if (catsData) setCategories(catsData)
        if (objsData) setObjectives(objsData)
        setLoading(false)
    }, [supabase, filter])

    useEffect(() => { fetchTasks() }, [fetchTasks])

    const toggleStatus = async (task: Task) => {
        const newStatus = task.status === 'done' ? 'todo' : 'done'
        const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
        if (error) toast.error("Error al canviar l'estat")
        else {
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
            toast.success(newStatus === 'done' ? "Tasca completada!" : "Tasca pendent")
        }
    }

    const deleteTask = async (id: string) => {
        if (!confirm('Segur que vols eliminar aquesta tasca?')) return
        const { error } = await supabase.from('tasks').delete().eq('id', id)
        if (error) toast.error("Error al eliminar la tasca")
        else {
            setTasks(tasks.filter(t => t.id !== id))
            toast.success("Tasca eliminada")
        }
    }

    const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200'
            case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'low': return 'bg-green-100 text-green-700 border-green-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
                <h1 className="text-3xl font-bold">Tasques</h1>
                <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingTask(null); }}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> Nova</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader><DialogTitle>{editingTask ? 'Editar Tasca' : 'Nova Tasca'}</DialogTitle></DialogHeader>
                        <TaskForm initialData={editingTask || {}} onSuccess={() => { setIsFormOpen(false); fetchTasks(); }} />
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Programar al calendari</DialogTitle></DialogHeader>
                    {schedulingTask && (
                        <ScheduleTaskModal task={schedulingTask} onSuccess={() => { setIsScheduleOpen(false); fetchTasks(); }} />
                    )}
                </DialogContent>
            </Dialog>

            <div className="flex flex-col sm:flex-row gap-4 px-1">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cerca tasques..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                    {(['todo', 'done', 'backlog', 'all'] as const).map((f) => (
                        <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                            {f === 'todo' ? 'Pendents' : f === 'done' ? 'Fetes' : f === 'backlog' ? 'Backlog' : 'Totes'}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid gap-3">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Carregant tasques...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed rounded-xl text-muted-foreground">No s'han trobat tasques.</div>
                ) : (
                    filteredTasks.map((task) => {
                        const category = categories.find(c => c.id === task.category_id)
                        const objective = objectives.find(o => o.id === task.objective_id)
                        return (
                            <Card key={task.id} className={cn("transition-all hover:border-primary/50 overflow-hidden", task.status === 'done' && "opacity-60 grayscale-[0.5]")}>
                                <CardContent className="p-4 flex gap-4">
                                    <div className="pt-0.5"><Checkbox checked={task.status === 'done'} onCheckedChange={() => toggleStatus(task)} /></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <h3 className={cn("font-semibold leading-tight", task.status === 'done' && "line-through")}>{task.title}</h3>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setSchedulingTask(task); setIsScheduleOpen(true); }}><CalendarPlus className="w-4 h-4 mr-2" /> Programar al calendari</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setEditingTask(task); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => deleteTask(task.id)}><Trash2 className="w-4 h-4 mr-2" /> Eliminar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="flex flex-wrap gap-2 items-center text-[10px] text-muted-foreground">
                                            <Badge variant="outline" className={cn("px-1.5 py-0 font-normal border shadow-none", getPriorityColor(task.priority))}>
                                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Mitja' : 'Baixa'}
                                            </Badge>
                                            {category && <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full border"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category.color }} /><span>{category.name}</span></div>}
                                            {objective && <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full shadow-sm"><Target className="w-3 h-3 text-primary" /><span>{objective.title}</span></div>}
                                            {task.due_date && <div className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /><span>{format(new Date(task.due_date), 'dd MMM', { locale: ca })}</span></div>}
                                            {task.estimated_duration && <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{task.estimated_duration}m</span></div>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
