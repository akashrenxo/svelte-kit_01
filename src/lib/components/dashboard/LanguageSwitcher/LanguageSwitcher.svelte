<script lang="ts">
    import { locale, locales } from "svelte-i18n";
    import { languageStore } from "../../../stores/languageStore"; 
    import languageIcon from "../../../../assests/images/navbar/language.png";
    import { websocketStore } from '../../../stores/websocket';

    $: locale.set($languageStore);

    function changeLanguage(newLocale: string) {
        languageStore.set(newLocale);
        locale.set(newLocale);
        websocketStore.updateTranslations(newLocale);
    }
</script>

<div class="dropdown dropdown-end">
    <button
        tabIndex="0"
        class="btn btn-ghost btn-circle"
        aria-label="Select Language"
    >
        <img src={languageIcon} alt="" class="h-7 w-7" />
    </button>
    <ul
        tabIndex="0"
        class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40"
    >
    {#each ['en', 'fr'] as l}
            <li>
                <button
                    class="dropdown-item {$locale === l ? 'active' : ''}"
                    on:click={() => changeLanguage(l)}
                >
                    {l}
                </button>
            </li>
        {/each}
    </ul>
</div>
