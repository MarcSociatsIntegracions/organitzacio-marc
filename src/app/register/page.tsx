import AuthForm from '@/components/auth/AuthForm'

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
            <AuthForm view="register" />
        </div>
    )
}
