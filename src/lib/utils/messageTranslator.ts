import successMessages from '../../messages/successMessages.json';
import errorMessages from '../../messages/errorMessages.json';
import warningMessages from '../../messages/warningMessages.json';
import { getLocaleFromNavigator } from 'svelte-i18n';

export function translateMessage(
    type: string,
    code: string,
    variables: Record<string, any> = {},
    locale: string = getLocaleFromNavigator() || 'en'
): string {
    let messages: Record<string, { variables: string[]; translations: Record<string, string> }>;

    switch (type) {
        case 'SUCCESS':
            messages = successMessages as Record<string, { variables: string[]; translations: Record<string, string> }>;
            break;
        case 'ERR':
            messages = errorMessages as Record<string, { variables: string[]; translations: Record<string, string> }>;
            break;
        case 'WARN':
            messages = warningMessages as Record<string, { variables: string[]; translations: Record<string, string> }>;
            break;
        default:
            return `Unknown type: ${type}`;
    }
    const message = messages[code];
    if (!message) {
        return `Unknown code: ${code}`;
    }
    const translationTemplate = message.translations[locale] || message.translations['en'];

    if (!translationTemplate) {
        return `Translation not found for code: ${code} and locale: ${locale}`;
    }
    const translatedMessage = translationTemplate.replace(/{(\w+)}/g, (_, key) => variables[key] || `{${key}}`);

    return translatedMessage;
}