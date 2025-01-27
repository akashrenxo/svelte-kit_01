<script lang="ts">
    export let orders: any[];
    export let onRemoveOrder: (orderId: string) => void;
    export let onSubmit: () => void;
</script>

<div class="mb-4">
    <h3 class="text-xl font-bold mb-4">Order Summary</h3>
    
    {#each orders as order (order.order)}
        <div class="card bg-base-200 p-4 mb-3">
            <h5 class="font-bold">Order ID: {order.order}</h5>
            <ul class="mt-2">
                {#each order.lines as line (line.id)}
                    <li class="mb-1">
                        <strong>Item:</strong> {line.item} |
                        <strong>Expected:</strong> {line.expected} |
                        <strong>Received:</strong> {line.received}
                    </li>
                {/each}
            </ul>
            <button
                class="btn btn-error btn-sm mt-2"
                on:click={() => onRemoveOrder(order.order)}
            >
                Remove Order
            </button>
        </div>
    {/each}

    <button class="btn btn-success" on:click={onSubmit}>
        Submit Inbound Delivery
    </button>
</div>