export const routes = {
  public: [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
  ],
  protected: [

  ],
  admin: [

  ]
} as const

export type RouteConfig = typeof routes

export function isPublicRoute(path: string): boolean {
  return routes.public.some(route => path.startsWith(route))
}

export function isProtectedRoute(path: string): boolean {
  return routes.protected.some(route => path.startsWith(route))
}

export function isAdminRoute(path: string): boolean {
  return routes.admin.some(route => path.startsWith(route))
} 