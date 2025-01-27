<script lang="ts">
    import "../../app.css";
    import { websocketStore } from "$lib/stores/websocket";
    import { onMount, onDestroy } from "svelte";

    interface Area {
        type: string;
        area: string;
    }

    interface BaseMessage {
        type: string;
        action: string;
        env: {
            user: string;
        };
        params: {
            entityName: string;
            area?: string;
        };
    }

    interface WebSocketMessage {
        params?: {
            result?: string;
        };
        result?: {
            message?: string;
        };
    }

    let areas: Area[] = [];
    let types: string[] = [];
    let filteredAreas: Area[] = [];
    let locations: string[] = [];
    let selectedType = "";
    let selectedArea = "";
    let loading = false;
    let responseMessage = "";
    let isConnected = false;

    let unsubscribe = websocketStore.subscribe((state) => {
        isConnected = state.isConnected;
    });

    function extractTypes(areas: Area[]): void {
        types = [...new Set(areas.map((area) => area.type))];
    }

    function filterAreasByType(type: string): void {
        filteredAreas = type ? areas.filter((area) => area.type === type) : [];
        locations = [];
        selectedArea = "";
    }

    function fetchAreas(): void {
        if (!isConnected) {
            responseMessage =
                "WebSocket is not connected. Unable to fetch areas.";
            return;
        }

        try {
            loading = true;
            websocketStore.sendMessage({
                type: "command",
                action: "ListEntity",
                env: {
                    user: "U005",
                },
                params: {
                    entityName: "area",
                },
            } as BaseMessage);
        } catch (error) {
            responseMessage = "Error fetching areas. Please try again.";
            console.error("Error fetching areas:", error);
        } finally {
            loading = false;
        }
    }

    async function generateLocations(): Promise<void> {
        if (!selectedArea || !selectedType) {
            responseMessage = "Please select both area type and area.";
            return;
        }

        if (!isConnected) {
            responseMessage = "WebSocket is not connected.";
            return;
        }

        try {
            loading = true;
            websocketStore.sendMessage({
                type: "command",
                action: "GenerateLocations",
                env: {
                    user: "U005",
                },
                params: {
                    entityName: "location",
                    area: selectedArea,
                },
            } as BaseMessage);
        } catch (error) {
            responseMessage = "Error generating locations. Please try again.";
            console.error("Error generating locations:", error);
        }
    }

    function handleTypeChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        selectedType = select.value;
        filterAreasByType(selectedType);
    }

    let messageUnsubscribe = websocketStore.subscribe((state) => {
        const latestMessage = state.messages[
            state.messages.length - 1
        ] as WebSocketMessage;

        if (!latestMessage?.params?.result) return;

        try {
            const result = JSON.parse(latestMessage.params.result);

            if (Array.isArray(result)) {
                if (result[0]?.type) {
                    areas = result as Area[];
                    extractTypes(areas);
                } else if (result[0]?.location) {
                    locations = result.map((item) => item.location);
                }
            }

            if (latestMessage.result?.message) {
                responseMessage = latestMessage.result.message;
            }
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
            responseMessage = "Error: Failed to process server response.";
        } finally {
            loading = false;
        }
    });

    onMount(() => {
        websocketStore.connect("ws://localhost:8083/join", "U005");
        return () => {
            // Disconnect is handled by the store
        };
    });
</script>

<div class="container mx-auto mt-5 p-4">
    <h2 class="text-2xl font-bold mb-4">Generate Locations</h2>

    <!-- Connection Status -->
    {#if !isConnected}
        <div class="alert alert-warning mb-4" role="alert">
            WebSocket is not connected
        </div>
    {/if}

    <!-- Fetch Areas Button -->
    <div class="mb-4">
        <button
            class="btn btn-primary"
            on:click={fetchAreas}
            disabled={!isConnected || loading}
        >
            {loading ? "Fetching..." : "Fetch Areas"}
        </button>
    </div>

    <!-- Type Selection -->
    <div class="form-control mb-4">
        <label for="areaType" class="label">
            <span class="label-text">Select Area Type</span>
        </label>
        <select
            id="areaType"
            class="select select-bordered w-full max-w-xs"
            value={selectedType}
            on:change={handleTypeChange}
            disabled={loading || !isConnected}
        >
            <option value="">-- Select Type --</option>
            {#each types as type}
                <option value={type}>{type}</option>
            {/each}
        </select>
    </div>

    <!-- Area Selection -->
    {#if filteredAreas.length > 0}
        <div class="form-control mb-4">
            <label for="area" class="label">
                <span class="label-text">Select Area</span>
            </label>
            <select
                id="area"
                class="select select-bordered w-full max-w-xs"
                bind:value={selectedArea}
                disabled={loading || !isConnected}
            >
                <option value="">-- Select Area --</option>
                {#each filteredAreas as area}
                    <option value={area.area}>{area.area}</option>
                {/each}
            </select>
            <button
                class="btn btn-success mt-3"
                on:click={generateLocations}
                disabled={!selectedArea || loading || !isConnected}
            >
                {loading ? "Generating..." : "Generate Locations"}
            </button>
        </div>
    {/if}

    <!-- Response Message -->
    {#if responseMessage}
        <div class="alert alert-info mb-4" role="alert">
            {responseMessage}
        </div>
    {/if}

    <!-- Locations Table -->
    {#if loading}
        <div class="flex justify-center items-center">
            <div class="loading loading-spinner loading-lg"></div>
        </div>
    {:else if locations.length > 0}
        <div>
            <h3 class="text-xl font-semibold mb-3">Locations</h3>
            <div class="overflow-x-auto">
                <table class="table w-full" role="grid">
                    <thead>
                        <tr>
                            <th scope="col">Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each locations as location}
                            <tr>
                                <td>{location}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {:else if selectedArea}
        <p>No locations found for the selected area.</p>
    {/if}
</div>
