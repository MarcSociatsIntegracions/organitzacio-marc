'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AuthForm({ view = 'login' }: { view?: 'login' | 'register' }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()
    const [mode, setMode] = useState<'login' | 'register'>(view)

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (mode === 'register') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                })
                if (error) throw error
                toast.success("Registre correcte! Revisa el teu correu.")
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.push('/app')
                router.refresh()
            }
        } catch (error: any) {
            toast.error(error.message || "S'ha produït un error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>{mode === 'register' ? 'Crea un compte' : 'Inicia sessió'}</CardTitle>
                <CardDescription>
                    {mode === 'register'
                        ? "Registra't per començar a organitzar-te"
                        : "Benvingut de nou a la teva app d'organització"}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleAuth}>
                <CardContent className="space-y-4">
                    {mode === 'register' && (
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nom complet</Label>
                            <Input
                                id="fullName"
                                placeholder="Ex: Joan Pere"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Correu electrònic</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="hola@exemple.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Contrasenya</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Carregant...' : mode === 'register' ? 'Registrar-se' : 'Entrar'}
                    </Button>
                    <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    >
                        {mode === 'login'
                            ? "No tens compte? Registra't"
                            : "Ja tens compte? Inicia sessió"}
                    </button>
                </CardFooter>
            </form>
        </Card>
    )
}
