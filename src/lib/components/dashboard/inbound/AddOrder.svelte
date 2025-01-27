<script lang="ts">
    import { websocketStore } from '$lib/stores/websocket';
    import { onMount } from 'svelte';

    interface OrderLine {
        id: string;
        item: string;
        expected: number;
        received: number;
    }

    interface Order {
        id: string;
        order: string;
        lines: OrderLine[];
    }

    let availableOrders: Order[] = [];
    let selectedOrder: Order | null = null;
    let isPartial = false;

    // Function to fetch orders
    const fetchOrders = () => {
        console.log("Fetching orders...");
        const message = {
            type: 'action',
            action: 'ListEntity',
            env: {
                user: 'U005'
            },
            params: {
                entityName: 'inbound_delivery'
            }
        };
        websocketStore.sendMessage(message);
        console.log("Sent WebSocket message for orders:", message);
    };

    onMount(() => {
        console.log("Component mounted, initializing order fetch");
        fetchOrders();
    });

    // Reactive statement to handle WebSocket messages
    $: {
        if ($websocketStore.messages?.length) {
            const lastMessage = $websocketStore.messages[$websocketStore.messages.length - 1];
            console.log("New WebSocket message received:", lastMessage);
            
            if (lastMessage?.action === 'ListEntity') {
                console.log("ListEntity action detected");
                console.log("Result code:", lastMessage?.result?.code);
                console.log("Params result:", lastMessage?.params?.result);
                
                if (lastMessage?.params?.result) {
                    try {
                        const resultData = lastMessage.params.result;
                        console.log("Raw result data:", resultData);
                        
                        const parsedData = JSON.parse(resultData);
                        console.log("Parsed data:", parsedData);
                        
                        availableOrders = parsedData.map((order: any, index: number) => ({
                            id: order.id || `order-${index}`,
                            order: order.order || order.name || "",  // Added fallback to name
                            lines: order.lines || []
                        }));
                        
                        console.log("Processed orders:", availableOrders);
                    } catch (error) {
                        console.error('Error processing order data:', error);
                        console.error('Error details:', {
                            // message: error.message,
                            // stack: error.stack
                        });
                    }
                }
            }
        }
    }

    function handleOrderChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const selectedOrderId = target.value;
        selectedOrder = availableOrders.find(order => order.id === selectedOrderId) || null;
        console.log("Selected order:", selectedOrder);
    }
</script>

<div class="mb-4">
    <h3 class="text-xl font-bold mb-4">Add Orders</h3>
    
    <div class="mb-3">
        <label for="order" class="label">Select Order</label>
        <select
            id="order"
            class="select select-bordered w-full"
            on:change={handleOrderChange}
        >
            <option value="">-- Select Order --</option>
            {#each availableOrders as order (order.id)}
                <option value={order.id}>
                    {order.id}
                </option>
            {/each}
        </select>
    </div>

    {#if selectedOrder}
        <div class="flex gap-4 mb-3">
            <button
                class="btn btn-primary"
            >
                Add Full Order
            </button>
            <button
                class="btn btn-secondary"
                on:click={() => (isPartial = true)}
            >
                Add Partial Order
            </button>
        </div>
    {/if}
</div>
