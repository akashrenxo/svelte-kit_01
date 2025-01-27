<script lang="ts">
    import { writable, derived } from "svelte/store";
    import { entityStore } from "$lib/stores/apiStores/entityStores";
    import countryList from "$lib/components/dashboard/countryList/countryList.json";
    import deleteButton from "$lib/../../src/assests/images/supplier/deleteButton.png";
    import { onMount } from "svelte";

    export let entityName: string;
    export let isAddModalOpen: boolean;
    export let limit: number;

    interface FormFields {
        [key: string]: any;
    }

    interface Country {
        name: string;
        states: string[];
    }

    let entity_address = entityName + "_address";
    const countries: Country[] = countryList.countries;
    let formData: FormFields = {};
    let formFields: FormFields = {};

    let line1 = "";
    let line2 = "";
    let line3 = "";
    let city = "";
    let zipCode = "";
    let states: string[] = [];
    let selectedState = "";
    let selectedCountry = "";

    const {
        attributes,
        isConnected,
        addEntity,
        fetchEntities,
        fetchEntityAttributes,
    } = entityStore(entityName);

    onMount(() => {
        const fetchData = async () => {
            if ($isConnected) {
                try {
                    await fetchEntityAttributes();
                    console.log("Data fetched successfully");
                    return true;
                } catch (error) {
                    console.error("Error fetching data:", error);
                    return false;
                }
            }
            return false;
        };
        fetchData();
        return () => {
            console.log("Component unmounted. Cleaning up...");
        };
    });

    const closeModal = () => {
        isAddModalOpen = false;
        Object.keys(formFields).forEach((key) => {
            formFields[key] = typeof formFields[key] === "boolean" ? false : "";
        });
        line1 = "";
        line2 = "";
        line3 = "";
        city = "";
        selectedState = "";
        selectedCountry = "";
        zipCode = "";
    };

    type InputField = {
        id: number;
        value: string;
    };

    const fields = writable<InputField[]>([{ id: 1, value: "" }]);
    let listData: string[] = [];

    const add = () => {
        fields.update((curr) => [
            ...curr,
            {
                id: Math.max(...curr.map((f) => f.id)) + 1,
                value: "",
            },
        ]);
    };

    const remove = (id: number) => {
        fields.update((curr) => curr.filter((f) => f.id !== id));
    };

    const update = (id: number, value: string) => {
        fields.update((curr) =>
            curr.map((f) => (f.id === id ? { ...f, value } : f)),
        );
    };

    const values = derived(fields, ($fields) => $fields.map((f) => f.value));

    values.subscribe((currentValues) => {
        console.log("Current values:", currentValues);
        listData = currentValues;
    });

    $: sortedAttributes = [...$attributes].sort((a, b) => {
        if (a.name === "name") return -1;
        if (b.name === "name") return 1;
        return 0;
    });

    $: {
        states = selectedCountry
            ? countries.find((country) => country.name === selectedCountry)
                  ?.states || []
            : [];
    }

    const handleAdd = async (event: any) => {
        try {
            formData = {};
            $attributes.forEach((attr) => {
                if (attr.name !== "location") {
                    if (attr.data_type === "toggle") {
                        const select = document.getElementById(
                            attr.name,
                        ) as HTMLSelectElement;
                        formData[attr.name] = select?.value === "true";
                    } else if (attr.data_type === "number") {
                        const input = document.getElementById(
                            attr.name,
                        ) as HTMLInputElement;
                        formData[attr.name] = input?.value
                            ? Number(input.value)
                            : null;
                    } else if (attr.data_type === "address") {
                        formData[entity_address] = {
                            line: line1 + ", " + line2 + ", " + line3,
                            city,
                            state: selectedState,
                            country: selectedCountry,
                            zip: zipCode,
                        };
                    } else if (attr.data_type === "list") {
                        formData[attr.name] = listData;
                    } else {
                        const input = document.getElementById(
                            attr.name,
                        ) as HTMLInputElement;
                        formData[attr.name] = input?.value || "";
                    }
                }
            });

            console.log("Form Data:", formData);
            await addEntity(formData);
            fetchEntities(limit, 0, "");
            closeModal();
        } catch (error) {
            console.error("Error adding entity:", error);
        }
    };
</script>

<div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
>
    <div
        class="bg-white rounded-lg shadow-lg p-6 max-h-[550px] w-3/5 mx-auto border border-gray-200 scrollbar-hidden overflow-y-auto"
    >
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold">Add {entityName}</h2>
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
        <form on:submit|preventDefault={handleAdd} class="text-sm">
            {#each sortedAttributes as attr (attr.name)}
                {#if attr.name !== "location"}
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
                                        placeholder="line1"
                                        bind:value={line1}
                                        class="w-full p-2 border rounded-lg shadow-sm mb-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="line2"
                                        bind:value={line2}
                                        class="w-full p-2 border rounded-lg shadow-sm mb-2"
                                    />
                                </div>
                                <div class="flex flex-row gap-6">
                                    <input
                                        type="text"
                                        placeholder="line3"
                                        bind:value={line3}
                                        class="w-full p-2 border rounded-lg shadow-sm mb-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="City"
                                        bind:value={city}
                                        class="w-full p-2 border rounded-lg shadow-sm mb-2"
                                    />
                                </div>
                                <div class="flex flex-row gap-6">
                                    <select
                                        bind:value={selectedCountry}
                                        class="w-full p-2 border rounded-lg shadow-sm mb-2"
                                        on:change={() => (selectedState = "")}
                                    >
                                        <option value="" disabled
                                            >Select Country</option
                                        >
                                        {#each countries as country}
                                            <option value={country.name}>
                                                {country.name}
                                            </option>
                                        {/each}
                                    </select>

                                    <select
                                        bind:value={selectedState}
                                        class="w-full p-2 border rounded-lg shadow-sm mb-2"
                                        disabled={!states.length}
                                    >
                                        <option value="" disabled>
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
                                    placeholder="Zip Code"
                                    bind:value={zipCode}
                                    class="w-full p-2 border rounded-lg shadow-sm mb-2"
                                />
                            </div>
                        {:else if attr.data_type === "list"}
                            <div class="flex flex-col gap-4">
                                <div class="space-y-4">
                                    {#each $fields as field (field.id)}
                                        <div
                                            class="flex items-center space-x-4"
                                        >
                                            <input
                                                type="text"
                                                bind:value={field.value}
                                                placeholder="Enter text"
                                                on:input={(e) =>
                                                    update(
                                                        field.id,
                                                        (
                                                            e.target as HTMLInputElement
                                                        ).value,
                                                    )}
                                                class="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                class="inline-block text-red-500 hover:text-red-700 transition duration-150 ease-in-out mx-2"
                                                on:click={() =>
                                                    remove(field.id)}
                                                disabled={$fields.length === 1}
                                            >
                                                <img
                                                    src={deleteButton}
                                                    alt="Delete"
                                                    class="h-5 inline"
                                                />
                                            </button>
                                        </div>
                                    {/each}
                                    <button
                                        type="button"
                                        on:click={add}
                                        class="bg-[#34495E] text-white px-4 py-2 rounded hover:bg-[#34495E]"
                                    >
                                        Add {attr.name}
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <input
                                id={attr.name}
                                type={attr.data_type === "number"
                                    ? "number"
                                    : "text"}
                                bind:value={formFields[attr.name]}
                                class="w-full p-2 border rounded-lg shadow-sm"
                                placeholder={`${
                                    attr.name == "name"
                                        ? "Enter" +
                                          " " +
                                          entityName +
                                          " " +
                                          attr.name.replace(/_/g, " ")
                                        : attr.name.replace(/_/g, " ")
                                }`}
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
