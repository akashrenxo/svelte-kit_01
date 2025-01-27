import { register, init,getLocaleFromNavigator } from 'svelte-i18n';
init({ 
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator(),
});
register('en', () => import('../src/locales/en.json'));
register('fr', () => import('../src/locales/fr.json'));
