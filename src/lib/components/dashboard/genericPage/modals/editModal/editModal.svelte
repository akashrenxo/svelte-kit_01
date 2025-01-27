<script lang="ts">
    import countryList from "$lib/components/dashboard/countryList/countryList.json";
    import { entityStore } from "$lib/stores/apiStores/entityStores";
    import { onMount, tick } from "svelte";

    interface EntityAttribute {
        name: string;
        data_type: string;
    }

    interface Country {
        name: string;
        states: string[];
    }

    interface Address {
        line1: string;
        line2: string;
        line3: string;
        city: string;
        state: string;
        country: string;
        zip: string;
    }

    interface FormFields {
        [key: string]: any;
    }

    export let selectedEntity: Record<string, any>;
    export let isEditModalOpen: boolean;
    export let selectedPrimaryKeyName: string;
    export let entityName: string;
    export let selectedEntityId: string;

    const entity_address = `${entityName}_address`;
    const countries: Country[] = countryList.countries;

    let formFields: FormFields = {};
    let originalValues: Record<string, any> = {};
    let address: Address = {
        line1: "",
        line2: "",
        line3: "",
        city: "",
        state: "",
        country: "",
        zip: "",
    };

    let states: string[] = [];

    const { attributes, isConnected, updateEntity, fetchEntityAttributes } =
        entityStore(entityName);

    $: sortedAttributes = [...$attributes].sort((a, b) =>
        a.name === "name" ? -1 : b.name === "name" ? 1 : 0,
    );

    $: {
        states = address.country
            ? countries.find((country) => country.name === address.country)
                  ?.states || []
            : [];
    }

    $: {
        if ($attributes) {
            const attributesArray = $attributes as unknown as EntityAttribute[];
            initializeFormFields(attributesArray);
        }
    }

    const initializeFormFields = (attrs: EntityAttribute[]) => {
        attrs.forEach((attr) => {
            if (
                attr.name !== selectedPrimaryKeyName &&
                attr.data_type !== "address"
            ) {
                if (!(attr.name in formFields)) {
                    formFields[attr.name] =
                        attr.data_type === "toggle" ? false : "";
                }
            }
        });
    };

    const populateEditForm = (entity: Record<string, any>) => {
        if (!entity || !$attributes || $attributes.length === 0) {
            console.log("Missing required data for form population");
            return;
        }

        formFields = {};
        originalValues = {};

        $attributes.forEach((attr) => {
            if (
                attr.name !== selectedPrimaryKeyName &&
                attr.data_type !== "address"
            ) {
                const entityValue = entity[attr.name];
                formFields[attr.name] =
                    entityValue ?? (attr.data_type === "toggle" ? false : "");
                originalValues[attr.name] =
                    entityValue ?? (attr.data_type === "toggle" ? false : "");
            }
        });

        if (entity[entity_address]) {
            const entityAddress = entity[entity_address];
            const parts = entityAddress.line
                .split(",")
                .map((part: string) => part.trim());

            const line1 = parts[0];
            const line2 = parts[1];
            const line3 = parts[2];
            address = {
                line1: line1 || "",
                line2: line2 || "",
                line3: line3 || "",
                city: entityAddress.city || "",
                state: entityAddress.state || "",
                country: entityAddress.country || "",
                zip: entityAddress.zip || "",
            };
            formFields[entity_address] = { ...address };
            originalValues[entity_address] = { ...address };
        } else {
            address = {
                line1: "",
                line2: "",
                line3: "",
                city: "",
                state: "",
                country: "",
                zip: "",
            };
        }
    };

    async function handleEdit(event: Event) {
        event.preventDefault();
        if (!selectedEntity) return;

        try {
            const changedData: FormFields = {};
            let hasChanges = false;

            $attributes.forEach((attr) => {
                if (
                    attr.name !== selectedPrimaryKeyName &&
                    attr.data_type !== "address"
                ) {
                    const currentValue = formFields[attr.name];
                    if (
                        JSON.stringify(currentValue) !==
                        JSON.stringify(originalValues[attr.name])
                    ) {
                        changedData[attr.name] = currentValue;
                        hasChanges = true;
                    }
                }
            });

            const originalAddress = originalValues[entity_address] || {};

            Object.entries(address).forEach(([key, value]) => {
                if (
                    value !== originalAddress[key] &&
                    key !== "line1" &&
                    key !== "line2" &&
                    key !== "line3"
                ) {
                    changedData[key] = value;
                    hasChanges = true;
                } else if (
                    key === "line1" ||
                    key === "line2" ||
                    key === "line3"
                ) {
                    if (!changedData["line"]) {
                        changedData["line"] = value || "";
                    } else {
                        changedData["line"] += value ? `, ${value}` : "";
                    }
                }
            });

            if (!hasChanges) {
                console.log("No changes detected");
                closeModal();
                return;
            }
            console.log("changedData", changedData);
            await updateEntity(selectedEntityId, changedData);
            closeModal();
        } catch (error) {
            console.error("Error updating entity:", error);
        }
    }

    const closeModal = () => {
        isEditModalOpen = false;
        formFields = {};
        address = {
            line1: "",
            line2: "",
            line3: "",
            city: "",
            state: "",
            country: "",
            zip: "",
        };
        originalValues = {};
    };

    onMount(() => {
        if ($isConnected) {
            try {
                fetchEntityAttributes();
                tick();
                populateEditForm(selectedEntity);
                console.log("Data fetched and form populated successfully");
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }
        return () => {
            console.log("Component unmounted. Cleaning up...");
        };
    });

    $: {
        if (selectedEntity && $attributes && $attributes.length > 0) {
            populateEditForm(selectedEntity);
        }
    }
</script>

<div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
>
    <div
        class="bg-white rounded-lg shadow-lg p-6 w-3/5 max-h-[550px] mx-auto border border-gray-200 scrollbar-hidden overflow-y-auto"
    >
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold">Edit {entityName}</h2>
            <button
                type="button"
                aria-label="Close"
                class="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                on:click={closeModal}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>

        <form on:submit={handleEdit} class="text-sm">
            {#each sortedAttributes as attr (attr.name)}
                {#if attr.name !== "location" && attr.name !== selectedPrimaryKeyName}
                    <div class="mb-4">
                        <label
                            for={attr.name}
                            class="block text-sm font-medium text-gray-700 mb-1"
                        >
                            {attr.name.replace(/_/g, " ").toUpperCase()}
                        </label>

                        {#if attr.data_type === "toggle"}
                            <select
                                id={attr.name}
                                bind:value={formFields[attr.name]}
                                class="w-full p-2 border rounded-lg shadow-sm"
                            >
                                <option value={true}>Yes</option>
                                <option value={false}>No</option>
                            </select>
                        {:else if attr.data_type === "address"}
                            <div class="space-y-2">
                                <div class="flex flex-row gap-6">
                                    <input
                                        type="text"
                                        placeholder="Address Line 1"
                                        bind:value={address.line1}
                                        class="w-full p-2 border rounded-lg shadow-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Address Line 2"
                                        bind:value={address.line2}
                                        class="w-full p-2 border rounded-lg shadow-sm"
                                    />
                                </div>

                                <div class="flex flex-row gap-6">
                                    <input
                                        type="text"
                                        placeholder="Address Line 3"
                                        bind:value={address.line3}
                                        class="w-full p-2 border rounded-lg shadow-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="City"
                                        bind:value={address.city}
                                        class="w-full p-2 border rounded-lg shadow-sm"
                                    />
                                </div>

                                <div class="flex flex-row gap-6">
                                    <select
                                        bind:value={address.country}
                                        class="w-full p-2 border rounded-lg shadow-sm"
                                        on:change={() => (address.state = "")}
                                    >
                                        <option value="">Select Country</option>
                                        {#each countries as country}
                                            <option value={country.name}>
                                                {country.name}
                                            </option>
                                        {/each}
                                    </select>

                                    <select
                                        bind:value={address.state}
                                        class="w-full p-2 border rounded-lg shadow-sm"
                                        disabled={!states.length}
                                    >
                                        <option value="">
                                            {states.length
                                                ? "Select State"
                                                : "No states available"}
                                        </option>
                                        {#each states as state}
                                            <option value={state}>
                                                {state}
                                            </option>
                                        {/each}
                                    </select>
                                </div>

                                <input
                                    type="text"
                                    placeholder="ZIP Code"
                                    bind:value={address.zip}
                                    class="w-full p-2 border rounded-lg shadow-sm"
                                />
                            </div>
                        {:else}
                            <input
                                id={attr.name}
                                type={attr.data_type === "number"
                                    ? "number"
                                    : "text"}
                                bind:value={formFields[attr.name]}
                                class="w-full p-2 border rounded-lg shadow-sm"
                                placeholder={attr.name === "name"
                                    ? `Enter ${entityName} name`
                                    : attr.name.replace(/_/g, " ")}
                            />
                        {/if}
                    </div>
                {/if}
            {/each}

            <div class="flex justify-end space-x-4 mt-6">
                <button
                    type="button"
                    class="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition duration-150 ease-in-out"
                    on:click={closeModal}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    class="px-4 py-2 bg-[#00B894] text-white rounded-lg hover:bg-[#008B72] transition duration-150 ease-in-out"
                >
                    Save
                </button>
            </div>
        </form>
    </div>
</div>

<style>
    .scrollbar-hidden::-webkit-scrollbar {
        display: none;
    }

    .scrollbar-hidden {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
