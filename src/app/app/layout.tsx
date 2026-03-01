import { Sidebar, MobileNav } from '@/components/layout/Navigation'

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-muted/20">
            <Sidebar />
            <main className="flex-1 pb-16 md:pb-0 overflow-x-hidden">
                <div className="container mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
            <MobileNav />
        </div>
    )
}
