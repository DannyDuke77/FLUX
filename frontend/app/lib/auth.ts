import { cookies } from "next/headers"
import { jwtVerify } from "jose";


const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export type AuthUser = {
  id: string
  name: string
  email: string
  is_admin: boolean
  is_superuser: boolean
  department: string
  department_id: string
  company: string
  company_id: string
  company_logo?: string
  exp: number
}

export async function getAuthUser(): Promise<AuthUser | null> {
    const requestCookies = await cookies();
    const token = requestCookies.get("session_access_token")?.value

    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);

        const decoded = payload as any;

        // console.log('Verified department:', decoded.department)

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
            is_superuser: decoded.is_superuser,
            department: decoded.department,
            department_id: decoded.department_id,
            company: decoded.company,
            company_id: decoded.company_id,
            company_logo: decoded.company_logo,
            exp: decoded.exp,
        }
    } catch (error: any) {
        console.log('JWT error code:', error.code)
        console.log('JWT error message:', error)
        return null
    }
}