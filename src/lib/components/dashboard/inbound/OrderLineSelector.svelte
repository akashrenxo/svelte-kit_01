<script lang="ts">
    interface OrderLine {
        id: string;
        item: string;
        expected: number;
        received: number;
    }

    interface SelectedOrderLine extends OrderLine {
        selected: boolean;
    }

    export let lines: OrderLine[];
    export let onConfirm: (lines: OrderLine[]) => void;
    export let onCancel: () => void;

    let selectedLines: SelectedOrderLine[] = lines.map(line => ({
        ...line,
        selected: false
    }));

    function handleConfirm() {
        const selectedOrderLines = selectedLines
            .filter(line => line.selected)
            .map(({ selected, ...line }) => line);
        onConfirm(selectedOrderLines);
    }
</script>

<div class="modal modal-open">
    <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Select Order Lines</h3>
        
        <div class="overflow-x-auto">
            <table class="table w-full">
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>Item</th>
                        <th>Expected</th>
                        <th>Received</th>
                    </tr>
                </thead>
                <tbody>
                    {#each selectedLines as line (line.id)}
                        <tr>
                            <td>
                                <input
                                    type="checkbox"
                                    class="checkbox"
                                    bind:checked={line.selected}
                                />
                            </td>
                            <td>{line.item}</td>
                            <td>{line.expected}</td>
                            <td>{line.received}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <div class="modal-action">
            <button class="btn btn-primary" on:click={handleConfirm}>
                Confirm Selection
            </button>
            <button class="btn" on:click={onCancel}>Cancel</button>
        </div>
    </div>
</div>