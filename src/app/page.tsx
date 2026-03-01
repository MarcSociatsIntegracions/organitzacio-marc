import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, LayoutDashboard } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border text-center">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-primary/10 rounded-full mb-4">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">ORGANITZA'T</h1>
          <p className="text-muted-foreground mt-2">Accedeix al teu espai personal d'organització.</p>
        </div>

        <div className="grid gap-4 pt-4">
          <Link href="/login" className="w-full">
            <Button size="lg" className="w-full text-lg font-semibold h-12">
              Iniciar Sessió
            </Button>
          </Link>
          <Link href="/register" className="w-full">
            <Button variant="outline" size="lg" className="w-full text-lg font-medium h-12">
              Crear un compte
            </Button>
          </Link>
        </div>

        <div className="pt-8 border-t">
          <p className="text-xs text-muted-foreground italic">
            "Simplificant el dia a dia."
          </p>
        </div>
      </div>
    </div>
  )
}
// Verificació de build per al deploy a Vercel
