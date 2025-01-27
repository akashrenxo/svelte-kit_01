import { locale } from 'svelte-i18n';
import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ params }) => {
    const { lang } = params;
    locale.set(lang);
    return {};
};
