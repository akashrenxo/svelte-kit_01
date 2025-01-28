import { goto } from "$app/navigation";
import Cookies from "js-cookie";

// const API_BASE_URL = "http://192.168.31.245:8087";
const API_BASE_URL = "http://localhost:8086";

interface AuthResponse {
    token: string;
    url: string;
}

export async function login(username: string, password: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error("Login failed");
        }

        const data: AuthResponse = await response.json();

        Cookies.set("access_token", data.token, {
            expires: 0.0208333,
            secure: true,
            sameSite: "Strict",
        });

        Cookies.set("refresh_token", data.token, {
            expires: 1,
            secure: true,
            sameSite: "Strict",
        });

        Cookies.set("url", data.url, {
            expires: 1,
            secure: true,
            sameSite: "Strict",
        });

        Cookies.set("userId", username, {
            expires: 1,
            secure: true,
            sameSite: "Strict",
        });

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function refreshAccessToken(): Promise<boolean> {
    const refreshToken = Cookies.get("refresh_token");

    if (!refreshToken) {
        await goto("/login");
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/refresh-token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: refreshToken }),
        });

        const data: { token: string } = await response.json();
        Cookies.set("access_token", data.token, { expires: 1 });

        return true;
    } catch (err) {
        console.error(err);
        await goto("/login");
        return false;
    }
}


let inactivityTimeout: ReturnType<typeof setTimeout>;
const INACTIVITY_PERIOD = 30 * 60 * 1000;


export function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        logout();
    }, INACTIVITY_PERIOD);
}


export function logout() {
    const allCookies = Cookies.get();

    for (const cookieName in allCookies) {
        Cookies.remove(cookieName, { path: '/' }); // Ensure path matches
    }
    goto('/login');
}


export function setupInactivityTracker() {
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));
    resetInactivityTimer();
}


export function cleanupInactivityTracker() {
    if (typeof window !== 'undefined') {
        clearTimeout(inactivityTimeout);

        const events = ['mousemove', 'keydown', 'scroll', 'click'];
        events.forEach((event) => {
            window.removeEventListener(event, resetInactivityTimer);
        });
    }
}



