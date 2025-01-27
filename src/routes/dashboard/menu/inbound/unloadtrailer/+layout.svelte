<script lang="ts">
    import { websocketStore } from "$lib/stores/websocket";
    import { onMount } from "svelte";

    interface Location {
        location: string;
        areas: string[];
        type: string;
    }

    let locations: Location[] = [];
    let selectedLocation = "";
    let trailerNo = "";
    let validationResponse: any = null;

    const fetchLocations = () => {
        console.log("Fetching locations...");
        const message = {
            type: "action",
            action: "ListEntity",
            env: {
                user: "U005",
            },
            params: {
                entityName: "location",
                type: "Staging",
            },
        };
        websocketStore.sendMessage(message);
        console.log("Sent WebSocket message:", message);
    };

    const handleValidation = () => {
        console.log("Validating trailer number:", trailerNo);
        const message = {
            type: "action",
            action: "ListEntity",
            env: {
                user: "U005",
            },
            params: {
                entityName: "inbound_delivery",
                transport_equipment: trailerNo,
            },
        };
        websocketStore.sendMessage(message);
        console.log("Sent WebSocket message:", message);
    };

    const handleSubmit = () => {
        if (!validationResponse) {
            console.error("Validation response is missing. Cannot submit.");
            alert("Please validate the trailer number before submitting.");
            return;
        }

        console.log("Submitting unload trailer request...");
        const message = {
            type: "action",
            action: "UnloadTrailer",
            env: {
                user: "U005",
            },
            params: {
                entityName: "inbound_delivery",
                transport_equipment: validationResponse[0].transport_equipment,
                location: selectedLocation,
            },
        };

        websocketStore.sendMessage(message);
        console.log("Sent WebSocket message:", message);
        alert("Unload trailer request submitted successfully.");
    };

    onMount(() => {
        console.log("Component mounted");
        setTimeout(() => {
            fetchLocations();
        }, 100);

        const interval = setInterval(() => {
            if (locations.length === 0) {
                console.log("No locations found, retrying...");
                fetchLocations();
            }
        }, 2000);

        return () => {
            clearInterval(interval);
        };
    });

    // Reactive statement to handle WebSocket messages
    $: {
        console.log("WebSocket store updated:", $websocketStore.messages);
        if ($websocketStore.messages?.length) {
            const lastMessage =
                $websocketStore.messages[$websocketStore.messages.length - 1];
            console.log("Processing last message:", lastMessage);

            if (
                lastMessage?.action === "ListEntity" &&
                String(lastMessage?.result?.code) === "SUCCESS200"
            ) {
                if (
                    lastMessage?.params?.entityName === "location" &&
                    lastMessage?.params?.result
                ) {
                    try {
                        const resultData = lastMessage.params.result;
                        console.log("Received result data:", resultData);
                        if (resultData) {
                            locations = JSON.parse(resultData)
                                .filter(
                                    (location: any) =>
                                        location.type === "Staging",
                                )
                                .map((location: any) => ({
                                    location: location.location || "Unknown",
                                    areas: location.areas || [],
                                    type: location.type || "Unknown",
                                }));
                            console.log("Parsed locations:", locations);
                        }
                    } catch (error) {
                        console.error("Error parsing location data:", error);
                    }
                }

                if (lastMessage?.params?.entityName === "inbound_delivery") {
                    try {
                        const resultData = lastMessage.params.result;
                        validationResponse =
                            resultData !== "null"
                                ? JSON.parse(resultData)
                                : null;
                        console.log(
                            "Received validation result data:",
                            validationResponse,
                        );
                    } catch (error) {
                        console.error("Error parsing validation data:", error);
                    }
                }
            }
        }
    }

    function handleLocationChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        selectedLocation = target.value;
    }
</script>

{#if locations.length > 0}
    <div class="mb-6">
        <div
            class="space-y-4 bg-white p-6 rounded-lg max-w-[90%] mx-auto mt-10"
        >
            <div>
                <label
                    for="location"
                    class="block text-sm font-medium text-gray-700 mb-2"
                >
                    Location
                </label>
                <select
                    id="location"
                    bind:value={selectedLocation}
                    on:change={handleLocationChange}
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                    <option value="" disabled>-- Select Location --</option>
                    {#each locations as location (location.location)}
                        <option value={location.location}
                            >{location.location}</option
                        >
                    {/each}
                </select>
            </div>

            <div>
                <label
                    for="trailerNoInput"
                    class="block text-sm font-medium text-gray-700 mb-2"
                >
                    Enter Trailer Number
                </label>
                <input
                    id="trailerNoInput"
                    type="text"
                    bind:value={trailerNo}
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter trailer number"
                />
            </div>
            <div class=" flex flex-row justify-end space-x-4">
                <button
                    class="px-4 py-2 bg-[#00B894] text-white rounded-lg hover:bg-[#008B72]"
                    on:click={handleValidation}
                >
                    Validate
                </button>
                <button
                    class="px-4 py-2 bg-[#34495E] text-white rounded-lg hover:bg-[#4c7196]"
                    on:click={handleSubmit}
                    disabled={!validationResponse}
                >
                    Submit
                </button>
            </div>

            {#if validationResponse}
                <div class="mt-6">
                    <h3 class="text-md font-medium text-gray-800">
                        Validation Successfull
                    </h3>
                    {#if validationResponse.length > 0}
                        {#each validationResponse as response}
                            <div
                                class="p-4 bg-[#b4fdca] rounded-lg shadow-md space-y-2"
                            >
                                <div>
                                    <p class=" text-sm">
                                        <span class=" text-base font-medium"
                                            >Transport Equipment:</span
                                        >
                                        {response.transport_equipment}
                                    </p>
                                </div>
                                <div>
                                    <p class=" text-sm">
                                        <span class=" text-base font-medium"
                                            >Supplier:</span
                                        >
                                        {response.supplier}
                                    </p>
                                </div>
                                <div>
                                    <p class=" text-sm">
                                        <span class=" text-base font-medium"
                                            >Status:</span
                                        >
                                        {response.status}
                                    </p>
                                </div>
                                <div>
                                    <p class=" text-sm">
                                        <span class=" text-base font-medium"
                                            >Order:</span
                                        >
                                        {response.orders
                                            ? (
                                                  response.orders as Array<{
                                                      order: string;
                                                  }>
                                              )
                                                  .map((o) => o.order)
                                                  .join(", ")
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <div
                            class="p-4 bg-red-100 text-red-600 rounded-lg shadow-md"
                        >
                            Not Validated
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>
{/if}
<slot />
