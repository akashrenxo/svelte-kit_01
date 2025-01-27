import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const publicRoutes = ['/login'];

export const handle: Handle = async ({ event, resolve }) => {
    const path = event.url.pathname;

    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
    const accessToken = event.cookies.get('access_token');

    if (!isPublicRoute && !accessToken) {
        console.log('No access token found, redirecting to login');
        throw redirect(303, '/login');
    }

    return await resolve(event);
};
