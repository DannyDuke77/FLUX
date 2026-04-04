'use server';

import { cookies } from "next/headers";

const DEBUG = process.env.NODE_ENV !== 'production';

const getCookieOptions = (maxAge: number) => ({
    httpOnly: true,
    secure: true, // <--- SET TO 'false' FOR HTTP / SET TO 'true' FOR HTTPS
    maxAge: maxAge,
    path: '/',
    sameSite: 'lax' as const,
});

export async function handleLogin(userId: string, accessToken: string, refreshToken: string) {
    const requestCookies = await cookies();

    // 7 Days for User ID and Refresh Token
    requestCookies.set('session_userid', userId, getCookieOptions(60 * 60 * 24 * 7));
    
    // 1 Hour for Access Token
    requestCookies.set('session_access_token', accessToken, getCookieOptions(60 * 60));

    // 7 Days for Refresh Token
    requestCookies.set('session_refresh_token', refreshToken, getCookieOptions(60 * 60 * 24 * 7));

    console.log('Current Access Token:', accessToken);
    console.log('Current Refresh Token:', refreshToken);
}

/** Clears all auth cookies */
export async function resetAuthCookies() {
    const requestCookies = await cookies();
    const deleteOptions = { path: '/', maxAge: 0 };
    
    requestCookies.set('session_userid', '', deleteOptions);
    requestCookies.set('session_access_token', '', deleteOptions);
    requestCookies.set('session_refresh_token', '', deleteOptions);
    
    if (DEBUG) console.log('Auth cookies reset');
}

/** Refresh access token using the refresh token */
export async function handleRefresh() {
    if (DEBUG) console.log('Refreshing tokens...');

    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
        if (DEBUG) console.log('No refresh token available, skipping refresh.');
        return null; 
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
        const response = await fetch(`${API_URL}/api/auth/token/refresh/`, {
            method: 'POST',
            body: JSON.stringify({ refresh: refreshToken }),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        const json = await response.json();

        if (json.access) {
            const requestCookies = await cookies();
            const accessToken = json.access;

            requestCookies.set('session_access_token', accessToken, getCookieOptions(60 * 60));

            return accessToken;
        } else {
            if (DEBUG) console.log('Refresh failed, resetting cookies');
            await resetAuthCookies();
            return null;
        }
    } catch (error) {
        if (DEBUG) console.error('Error in handleRefresh:', error);
        await resetAuthCookies();
        return null;
    }
}

/** Get access token; triggers refresh if missing */
export async function getAccessToken() {
    const requestCookies = await cookies();
    let accessToken = requestCookies.get('session_access_token')?.value;

    if (!accessToken) {
        accessToken = await handleRefresh();
    }

    return accessToken;
}

/** Get refresh token from cookies */
export async function getRefreshToken() {
    const requestCookies = await cookies();
    return requestCookies.get('session_refresh_token')?.value;
}