'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Objective, Task } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, CheckCircle2, Circle, Target, Trash2, Edit2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function ObjectivesPage() {
    const [objectives, setObjectives] = useState<(Objective & { tasks: Task[] })[]>([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingObj, setEditingObj] = useState<Objective | null>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const supabase = createClient()

    const fetchObjectives = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('objectives')
            .select('*, tasks(*)')
            .order('created_at', { ascending: false })

        if (data) setObjectives(data as any)
        setLoading(false)
    }

    useEffect(() => {
        fetchObjectives()
    }, [supabase])

    const saveObjective = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const objData = { title, description, user_id: user.id }
        let error

        if (editingObj) {
            ({ error } = await supabase
                .from('objectives')
                .update(objData)
                .eq('id', editingObj.id))
        } else {
            ({ error } = await supabase
                .from('objectives')
                .insert(objData))
        }

        if (error) {
            toast.error("Error al guardar l'objectiu")
        } else {
            toast.success(editingObj ? "Objectiu actualitzat" : "Objectiu creat")
            setIsFormOpen(false)
            fetchObjectives()
            setTitle('')
            setDescription('')
            setEditingObj(null)
        }
    }

    const deleteObjective = async (id: string) => {
        if (!confirm('Segur que vols eliminar aquest objectiu? Les tasques quedaran sense vincle.')) return

        const { error } = await supabase.from('objectives').delete().eq('id', id)
        if (error) toast.error("Error al eliminar l'objectiu")
        else {
            toast.success("Objectiu eliminat")
            fetchObjectives()
        }
    }

    const toggleObjectiveStatus = async (obj: Objective) => {
        const newStatus = obj.status === 'active' ? 'archived' : 'active'
        const { error } = await supabase
            .from('objectives')
            .update({ status: newStatus })
            .eq('id', obj.id)

        if (error) toast.error("Error al canviar l'estat")
        else {
            toast.success(newStatus === 'active' ? "Objectiu reactivat" : "Objectiu arxivat")
            fetchObjectives()
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Objectius</h1>
                <Dialog open={isFormOpen} onOpenChange={(open) => {
                    setIsFormOpen(open)
                    if (!open) { setEditingObj(null); setTitle(''); setDescription(''); }
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Nou Objectiu
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingObj ? "Editar Objectiu" : "Nou Objectiu"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={saveObjective} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="objTitle">Títol</Label>
                                <Input id="objTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Aprendre Català fluïdament" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="objDesc">Descripció</Label>
                                <Textarea id="objDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Per què és important?" />
                            </div>
                            <DialogFooter>
                                <Button type="submit">{editingObj ? "Actualitzar" : "Crear"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
                    ))
                ) : objectives.length === 0 ? (
                    <p className="col-span-full text-center text-muted-foreground py-10">Encara no has creat cap objectiu.</p>
                ) : (
                    objectives.map((obj) => {
                        const completedTasks = obj.tasks.filter(t => t.status === 'done').length
                        const totalTasks = obj.tasks.length
                        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

                        return (
                            <Card key={obj.id} className={cn(
                                "group transition-all hover:ring-2 ring-primary ring-offset-2",
                                obj.status === 'archived' && "opacity-60 grayscale"
                            )}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-5 h-5 text-primary" />
                                            <Badge variant={obj.status === 'active' ? 'default' : 'secondary'}>
                                                {obj.status === 'active' ? 'Actiu' : 'Arxivat'}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                setEditingObj(obj);
                                                setTitle(obj.title);
                                                setDescription(obj.description || '');
                                                setIsFormOpen(true);
                                            }}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteObjective(obj.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardTitle className="mt-2 text-xl">{obj.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                        {obj.description || "Sense descripció"}
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span>Progrés</span>
                                            <span>{Math.round(progress)}% ({completedTasks}/{totalTasks})</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 flex justify-between">
                                    <Button variant="link" size="sm" className="px-0">
                                        Veure tasques <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggleObjectiveStatus(obj)}>
                                        {obj.status === 'active' ? 'Arxivar' : 'Reactivar'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
