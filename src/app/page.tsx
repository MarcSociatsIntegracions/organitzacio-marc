import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Calendar, Target, Clock, BarChart2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-20 flex items-center border-b">
        <Link className="flex items-center justify-center gap-2" href="/">
          <CheckCircle2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold font-mono tracking-tighter">ORGANITZA'T</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Iniciar Sessió
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/register">
            Registrar-se
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  La teva vida, <span className="text-primary italic">finalment</span> sota control.
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Una eina tot-en-un per gestionar tasques, calendaris, objectius i el teu temps.
                  En català i pensada per a tu.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg" className="px-8 font-bold">Comença ara de franc</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center space-y-2 border p-6 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Calendari Intel·ligent</h3>
                <p className="text-sm text-muted-foreground text-center">Templates setmanals i excepcions per a una flexibilitat total.</p>
              </div>
              <div className="flex flex-col items-center space-y-2 border p-6 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Objectius a LP</h3>
                <p className="text-sm text-muted-foreground text-center">Defineix metes a llarg termini i vincula-hi les teves tasques.</p>
              </div>
              <div className="flex flex-col items-center space-y-2 border p-6 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Time Tracking</h3>
                <p className="text-sm text-muted-foreground text-center">Timer integrat per saber realment quant trigues en cada tasca.</p>
              </div>
              <div className="flex flex-col items-center space-y-2 border p-6 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full">
                  <BarChart2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Estadístiques</h3>
                <p className="text-sm text-muted-foreground text-center">Visualitza el teu progrés amb gràfics detallats i comparatives.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">© 2026 Organitza't. Tots els drets reservats.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacitat
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Termes de Servei
          </Link>
        </nav>
      </footer>
    </div>
  )
}
