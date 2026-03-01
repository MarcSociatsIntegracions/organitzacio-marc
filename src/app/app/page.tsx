import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Target, Clock, TrendingUp } from 'lucide-react'
import Timer from '@/components/timer/Timer'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // In a real app, we would fetch counts here
    const stats = [
        { name: 'Tasques pendents', value: '0', icon: CheckSquare, color: 'text-blue-500' },
        { name: 'Objectius actius', value: '0', icon: Target, color: 'text-green-500' },
        { name: 'Hores aquesta setmana', value: '0h', icon: Clock, color: 'text-amber-500' },
        { name: 'Productivitat', value: '0%', icon: TrendingUp, color: 'text-purple-500' },
    ]

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Hola! 👋</h1>
                    <p className="text-muted-foreground mt-1 text-sm italic">
                        Última actualització: {new Date().toLocaleTimeString('ca-ES')}
                    </p>
                </div>
            </div>

            <Timer />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.name}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="min-h-[300px]">
                    <CardHeader>
                        <CardTitle>Tasques per avui</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center text-muted-foreground">
                        No tens tasques programades per avui.
                    </CardContent>
                </Card>

                <Card className="min-h-[300px]">
                    <CardHeader>
                        <CardTitle>Calendari proper</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center text-muted-foreground">
                        No hi ha esdeveniments propers.
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
