import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Welcome section */}
      <div className="hidden lg:flex lg:w-1/2 bg-pink-500 items-center justify-center p-12">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-6">¡Bienvenida!</h1>
          <p className="text-xl">
            Entra a tu panel de administrador para poder gestionar el contenido de tu sitio.
          </p>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/images/xianna.png" 
              alt="Xianna Logo" 
              className="w-64 mx-auto mb-6"
            />
            <h2 className="text-2xl font-bold text-gray-900">Panel de Administración</h2>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
