'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Profile } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, LogOut, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [profile, setProfile] = useState<Profile | null>(null)
    const [newCatName, setNewCatName] = useState('')
    const [newCatColor, setNewCatColor] = useState('#3b82f6')
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const [{ data: cats }, { data: prof }] = await Promise.all([
                supabase.from('categories').select('*').order('name'),
                supabase.from('profiles').select('*').eq('id', user.id).single()
            ])

            if (cats) setCategories(cats)
            if (prof) setProfile(prof)
            setLoading(false)
        }
        fetchData()
    }, [supabase])

    const addCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCatName) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('categories')
            .insert({
                name: newCatName,
                color: newCatColor,
                user_id: user.id
            })
            .select()
            .single()

        if (error) {
            toast.error("Error al crear la categoria")
        } else {
            setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)))
            setNewCatName('')
            toast.success("Categoria creada")
        }
    }

    const deleteCategory = async (id: string) => {
        if (!confirm('Segur? Això pot afectar les tasques i blocs associats.')) return

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error("Error al eliminar la categoria")
        } else {
            setCategories(categories.filter(c => c.id !== id))
            toast.success("Categoria eliminada")
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">Configuració</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Perfil</CardTitle>
                            <CardDescription>La teva informació personal</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nom complet</Label>
                                <div className="flex gap-2">
                                    <Input defaultValue={profile?.full_name || ''} readOnly />
                                </div>
                            </div>
                            <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Tancar Sessió
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Categories</CardTitle>
                            <CardDescription>Gestiona les etiquetes dels teus blocs i tasques</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <form onSubmit={addCategory} className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="catName">Nom de la categoria</Label>
                                        <Input id="catName" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Ex: Feina, Gimnàs..." />
                                    </div>
                                    <div className="w-20 space-y-2">
                                        <Label htmlFor="catColor">Color</Label>
                                        <Input id="catColor" type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="h-10 p-1" />
                                    </div>
                                </div>
                                <Button type="submit" disabled={!newCatName}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Afegir
                                </Button>
                            </form>

                            <div className="space-y-2 border-t pt-4">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: cat.color }} />
                                            <span className="font-medium text-sm">{cat.name}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteCategory(cat.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    )
}
