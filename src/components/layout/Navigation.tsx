'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Calendar,
    CheckSquare,
    Target,
    BarChart2,
    Settings,
    LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
    { name: 'Tasques', href: '/app/tasks', icon: CheckSquare },
    { name: 'Calendari', href: '/app/calendar', icon: Calendar },
    { name: 'Objectius', href: '/app/objectives', icon: Target },
    { name: 'Estadístiques', href: '/app/stats', icon: BarChart2 },
    { name: 'Configuració', href: '/app/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="hidden md:flex flex-col w-64 bg-card border-r h-screen sticky top-0">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Organitza't
                </h1>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative",
                                isActive ? "text-primary font-medium bg-primary/10" : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                            {isActive && (
                                <motion.div
                                    layoutId="active-nav"
                                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}

export function MobileNav() {
    const pathname = usePathname()

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t h-16 flex items-center justify-around px-2 z-50">
            {navItems.slice(0, 5).map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center flex-1 py-1 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] mt-1">{item.name}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
