<script lang="ts">
    import { writable, derived } from "svelte/store";
    import { entityStore } from "$lib/stores/apiStores/entityStores";
    import countryList from "$lib/components/dashboard/countryList/countryList.json";
    import { onMount } from "svelte";
    import { filterStore } from "$lib/stores/filterStore";

    export let isFilterModalOpen: boolean;
    export let entityName: string;

    interface Filters {
        [key: string]: string[];
    }

    interface Country {
        name: string;
        states: string[];
    }

    let filterValues: Filters = {};
    let tempFilterInput: { [key: string]: string | boolean | number } = {};
    const countries: Country[] = countryList.countries;

    let addressFields = {
        line1: "",
        line2: "",
        line3: "",
        city: "",
        zipCode: "",
        country: "",
        state: "",
    };
    let states: string[] = [];

    const { attributes, isConnected, fetchEntityAttributes } =
        entityStore(entityName);

    const addFilterValue = (attribute: string): void => {
        let value: string;

        const inputValue = tempFilterInput[attribute];

        if (typeof inputValue === "string") {
            value = inputValue.trim();
        } else if (typeof inputValue === "boolean") {
            value = inputValue ? "Yes" : "No";
        } else if (typeof inputValue === "number") {
            value = inputValue.toString();
        } else {
            return;
        }

        if (
            value &&
            (!filterValues[attribute] ||
                !filterValues[attribute].includes(value))
        ) {
            filterValues = {
                ...filterValues,
                [attribute]: [...(filterValues[attribute] || []), value],
            };
            tempFilterInput[attribute] = "";
        }
    };

    const removeFilterValue = (attribute: string, value: string): void => {
        if (filterValues[attribute]) {
            filterValues = {
                ...filterValues,
                [attribute]: filterValues[attribute].filter((v) => v !== value),
            };
        }
    };

    onMount(() => {
        const fetchData = async () => {
            if ($isConnected) {
                try {
                    await fetchEntityAttributes();
                    console.log("Data fetched successfully");
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            }
        };
        fetchData();
        return () => console.log("Component unmounted. Cleaning up...");
    });

    $: sortedAttributes = [...$attributes].sort((a, b) =>
        a.name === "name" ? -1 : b.name === "name" ? 1 : 0,
    );

    $: states = addressFields.country
        ? countries.find((country) => country.name === addressFields.country)
              ?.states || []
        : [];

    const handleCountryChange = (event: any) => {
        const selectedCountry = event.target.value;
        tempFilterInput["country"] = selectedCountry;
        addressFields.country = selectedCountry;
    };

    interface SelectedAttribute {
        name: string;
        selected: boolean;
    }

    const selectedAttributes = writable<SelectedAttribute[]>([]);
    const selectAllChecked = writable<boolean>(true);

    $: {
        if ($attributes.length && !$selectedAttributes.length) {
            selectedAttributes.set(
                $attributes.map((attr) => ({
                    name: attr.name,
                    selected: true,
                })),
            );
        }
    }

    const toggleSelectAll = () => {
        const newState = !$selectAllChecked;
        selectAllChecked.set(newState);
        selectedAttributes.update((attrs) =>
            attrs.map((attr) => ({ ...attr, selected: newState })),
        );
    };

    const toggleAttribute = (name: string) => {
        selectedAttributes.update((attrs) =>
            attrs.map((attr) =>
                attr.name === name
                    ? { ...attr, selected: !attr.selected }
                    : attr,
            ),
        );
        selectAllChecked.set(
            $selectedAttributes.every((attr) => attr.selected),
        );
    };

    const localFilter = localStorage.getItem("FilterData");

    const handleApplyFilters = (filterValues: any) => {
        let existingFilterData = localFilter ? JSON.parse(localFilter) : {};

        existingFilterData = {
            ...existingFilterData,
            [entityName]: filterValues,
        };

        localStorage.setItem("FilterData", JSON.stringify(existingFilterData));

        filterStore.update((state) => ({
            values: existingFilterData,
            visible: Object.values(existingFilterData).some((entityFilters) =>
                Object.values(entityFilters as object).some(
                    (values) => Array.isArray(values) && values.length > 0,
                ),
            ),
        }));

        isFilterModalOpen = false;
    };
</script>

<div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 font-poppins"
>
    <div
        class="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full max-h-[550px] overflow-y-auto scrollbar-hidden grid grid-cols-6"
    >
        <div class="col-span-2">
            <h2 class="text-sm font-semibold">Filter by Attributes</h2>
            <div class="flex gap-2 text-sm font-medium items-center my-3">
                <input
                    type="checkbox"
                    checked={$selectAllChecked}
                    on:change={toggleSelectAll}
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="font-medium">Select All</span>
            </div>

            {#each $selectedAttributes as attr}
                <div
                    class="flex flex-row gap-2 text-sm font-medium items-center mb-2"
                >
                    <input
                        type="checkbox"
                        checked={attr.selected}
                        on:change={() => toggleAttribute(attr.name)}
                        class="h-4 w-4 text-[#344] border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>{attr.name.replace(/_/g, " ")}</span>
                </div>
            {/each}
        </div>

        <div class="col-span-4">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-sm font-semibold">Filter by Value</h2>
                <button
                    class="text-gray-500 hover:text-gray-700 focus:outline-none"
                    on:click={() => (isFilterModalOpen = false)}
                >
                    ✕
                </button>
            </div>

            <div class="space-y-3 text-sm">
                {#each sortedAttributes as attr}
                    <div>
                        <label
                            for="filter-{attr}"
                            class="block text-sm font-medium text-gray-700"
                        >
                            {attr.name.replace(/_/g, " ")}
                        </label>

                        <div class="flex flex-wrap gap-2">
                            {#each filterValues[attr.name] || [] as value}
                                <span
                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                >
                                    {value}
                                    <button
                                        class="text-[#34495E]"
                                        on:click={() =>
                                            removeFilterValue(attr.name, value)}
                                    >
                                        ✕
                                    </button>
                                </span>
                            {/each}
                        </div>

                        <div class="flex gap-2 mt-2">
                            {#if attr.data_type === "toggle"}
                                <select
                                    id={attr.name}
                                    bind:value={tempFilterInput[attr.name]}
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                >
                                    <option value={true}>Yes</option>
                                    <option value={false}>No</option>
                                </select>
                            {:else if attr.data_type === "address"}
                                <div class="space-y-2 w-full">
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each filterValues["line1"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeFilterValue(
                                                                "line1",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Line 1"
                                                bind:value={tempFilterInput[
                                                    "line1"
                                                ]}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                            />
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addFilterValue("line1")}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each filterValues["line2"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeFilterValue(
                                                                "line2",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Line 2"
                                                bind:value={tempFilterInput[
                                                    "line2"
                                                ]}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                            />
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addFilterValue("line2")}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each filterValues["line3"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeFilterValue(
                                                                "line3",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Line 3"
                                                bind:value={tempFilterInput[
                                                    "line3"
                                                ]}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                            />
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addFilterValue("line3")}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each filterValues["city"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeFilterValue(
                                                                "city",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="City"
                                                bind:value={tempFilterInput[
                                                    "city"
                                                ]}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                            />
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addFilterValue("city")}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each filterValues["zip"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeFilterValue(
                                                                "zip",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Zip Code"
                                                bind:value={tempFilterInput[
                                                    "zip"
                                                ]}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                            />
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addFilterValue("zip")}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each filterValues["country"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeFilterValue(
                                                                "country",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <select
                                                value={tempFilterInput[
                                                    "country"
                                                ]}
                                                on:change={handleCountryChange}
                                                class="w-full p-2 border rounded-lg shadow-sm mb"
                                            >
                                                <option value="" disabled
                                                    >Select Country</option
                                                >
                                                <!-- Default option -->
                                                {#each countries as country}
                                                    <option value={country.name}
                                                        >{country.name}</option
                                                    >
                                                {/each}
                                            </select>
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addFilterValue("country")}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex flex-wrap gap-2">
                                            {#each filterValues["state"] || [] as value}
                                                <span
                                                    class="bg-blue-100 text-[#34495E] px-2 py-1 rounded flex items-center gap-2"
                                                >
                                                    {value}
                                                    <button
                                                        class="text-[#34495E]"
                                                        on:click={() =>
                                                            removeFilterValue(
                                                                "state",
                                                                value,
                                                            )}
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                        <div
                                            class=" flex flex-row gap-x-2 mt-2"
                                        >
                                            <select
                                                disabled={!states.length}
                                                bind:value={tempFilterInput[
                                                    "state"
                                                ]}
                                                class="w-full p-2 border rounded-lg shadow-sm"
                                            >
                                                <option value="">
                                                    {states.length
                                                        ? "Select State"
                                                        : "No states available"}
                                                </option>
                                                {#each states as state}
                                                    <option value={state}
                                                        >{state}</option
                                                    >
                                                {/each}
                                            </select>
                                            <button
                                                class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                                on:click={() =>
                                                    addFilterValue("state")}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            {:else}
                                <input
                                    id={attr.name}
                                    type={attr.data_type === "number"
                                        ? "number"
                                        : "text"}
                                    bind:value={tempFilterInput[attr.name]}
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E]"
                                    placeholder={`Enter ${entityName} ${attr.name.replace(/_/g, " ")}`}
                                />
                            {/if}
                            {#if attr.data_type != "address"}
                                <button
                                    class="bg-[#34495E] text-white px-4 rounded-md text-sm h-8"
                                    on:click={() => addFilterValue(attr.name)}
                                >
                                    Add
                                </button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

            <div class="flex justify-end space-x-4 mt-6 text-sm">
                <button
                    class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                    on:click={() => (isFilterModalOpen = false)}
                >
                    Cancel
                </button>
                <button
                    class="px-4 py-2 bg-[#34495E] text-white rounded-lg"
                    on:click={() => {
                        console.log("Filters applied:", filterValues);
                        handleApplyFilters(filterValues);
                    }}
                >
                    Apply Filters
                </button>
            </div>
        </div>
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
