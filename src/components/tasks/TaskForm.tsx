'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Category, Objective, Task } from '@/types/database'

const taskSchema = z.object({
    title: z.string().min(1, 'El títol és obligatori'),
    description: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']),
    status: z.enum(['backlog', 'todo', 'done']),
    objective_id: z.string().nullable().optional(),
    category_id: z.string().nullable().optional(),
    due_date: z.string().nullable().optional(),
    estimated_duration: z.number().min(0),
})

type TaskFormValues = z.infer<typeof taskSchema>

export default function TaskForm({
    initialData,
    onSuccess
}: {
    initialData?: Partial<Task>,
    onSuccess?: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [objectives, setObjectives] = useState<Objective[]>([])
    const supabase = createClient()

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            priority: initialData?.priority || 'medium',
            status: initialData?.status || 'todo',
            objective_id: initialData?.objective_id || null,
            category_id: initialData?.category_id || null,
            due_date: initialData?.due_date || null,
            estimated_duration: initialData?.estimated_duration || 30,
        },
    })

    useEffect(() => {
        async function fetchData() {
            const [{ data: cats }, { data: objs }] = await Promise.all([
                supabase.from('categories').select('*'),
                supabase.from('objectives').select('*').eq('status', 'active'),
            ])
            if (cats) setCategories(cats)
            if (objs) setObjectives(objs)
        }
        fetchData()
    }, [supabase])

    const onSubmit = async (values: TaskFormValues) => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No hi ha usuari')

            const taskData = {
                ...values,
                user_id: user.id,
            }

            let error
            if (initialData?.id) {
                ({ error } = await supabase
                    .from('tasks')
                    .update(taskData)
                    .eq('id', initialData.id))
            } else {
                ({ error } = await supabase
                    .from('tasks')
                    .insert(taskData))
            }

            if (error) throw error
            toast.success(initialData?.id ? 'Tasca actualitzada' : 'Tasca creada correctament')
            if (onSuccess) onSuccess()
        } catch (error: any) {
            toast.error(error.message || "Error al guardar la tasca")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="title">Títol</Label>
                <Input id="title" {...form.register('title')} placeholder="Què has de fer?" />
                {form.formState.errors.title && (
                    <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Descripció</Label>
                <Textarea id="description" {...form.register('description')} placeholder="Detalls de la tasca..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Prioritat</Label>
                    <Select
                        value={form.watch('priority')}
                        onValueChange={(val) => form.setValue('priority', val as any)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Prioritat" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="medium">Mitja</SelectItem>
                            <SelectItem value="low">Baixa</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Estat</Label>
                    <Select
                        value={form.watch('status')}
                        onValueChange={(val) => form.setValue('status', val as any)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Estat" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="backlog">Backlog</SelectItem>
                            <SelectItem value="todo">Pendent</SelectItem>
                            <SelectItem value="done">Feta</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                        value={form.watch('category_id') || 'none'}
                        onValueChange={(val) => form.setValue('category_id', val === 'none' ? null : val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Cap" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Cap</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Objectiu</Label>
                    <Select
                        value={form.watch('objective_id') || 'none'}
                        onValueChange={(val) => form.setValue('objective_id', val === 'none' ? null : val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Cap" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Cap</SelectItem>
                            {objectives.map((obj) => (
                                <SelectItem key={obj.id} value={obj.id}>{obj.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="due_date">Data límit</Label>
                    <Input id="due_date" type="date" {...form.register('due_date')} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="estimated_duration">Durada (min)</Label>
                    <Input
                        id="estimated_duration"
                        type="number"
                        {...form.register('estimated_duration', { valueAsNumber: true })}
                    />
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Guardant...' : initialData?.id ? 'Actualitzar Tasca' : 'Crear Tasca'}
            </Button>
        </form>
    )
}
