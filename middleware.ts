import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Rutas protegidas que requieren autenticación
  const protectedRoutes = [
    '/disparo',
    '/controlDisparos',
    '/disparoCompleto',
    '/familias',
    '/secuenciasViperBoa',
    '/travelers',
    '/updateSchedule',
    '/varianzas'
  ];
  
  // Verificar si la ruta actual es protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    const numeroEmpleado = request.cookies.get('numeroEmpleado')?.value;
    
    if (!numeroEmpleado) {
      // Redirigir al login si no hay empleado autenticado
      console.log(`Acceso denegado a ${pathname}, redirigiendo al login`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/disparo/:path*',
    '/controlDisparos/:path*',
    '/disparoCompleto/:path*',
    '/familias/:path*',
    '/secuenciasViperBoa/:path*',
    '/travelers/:path*',
    '/updateSchedule/:path*',
    '/varianzas/:path*'
  ],
};
