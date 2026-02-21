import { cookies } from "next/headers"
import { jwtDecode } from "jwt-decode"

const DEBUG = process.env.NODE_ENV !== 'production';

export type AuthUser = {
  id: string
  name: string
  email: string
  is_admin: boolean
  department: string
  exp: number
}

export async function getAuthUser(): Promise<AuthUser | null> {
    const requestCookies = await cookies();
    const token = requestCookies.get("session_access_token")?.value

    if (!token) return null

    try {
        const decoded: any = jwtDecode(token)

        console.log('Decoded department:', decoded.department)

        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) return null

        // Check if token is valid
        if (!decoded.sub || !decoded.name || !decoded.email) {
        return null
        }

        return {
            id: decoded.sub,
            name: decoded.name,
            email: decoded.email,
            is_admin: decoded.is_admin,
            department: decoded.department,
            exp: decoded.exp,
        }
    } catch {
        return null
    }
}