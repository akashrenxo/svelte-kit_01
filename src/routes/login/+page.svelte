<script lang="ts">
    import { login } from "$lib/utils/auth";
    import { goto } from "$app/navigation";

    let username: string = "";
    let password: string = "";
    let error: string = "";

    let processing = false;

    async function handleLogin() {
        processing = true;
        const success = await login(username, password);
        processing = false;

        if (success) {
            await goto("/dashboard");
        } else {
            error = "Invalid credentials. Please try again.";
        }
    }
</script>

<div
    class="min-h-screen p-4 bg-gray-100 flex items-center justify-center font-inter"
>
    <div class="container max-w-screen-lg mx-auto">
        <div>
            <div class="bg-white rounded shadow-lg p-4 px-4 md:p-12 mb-6">
                <div
                    class="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3"
                >
                    <div class="text-gray-600">
                        <p class="font-medium text-lg">
                            Sign in to your account
                        </p>
                        <p>Please fill out all the fields.</p>
                    </div>
                    <div class="lg:col-span-2">
                        <form on:submit|preventDefault={handleLogin}>
                            <div
                                class="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5"
                            >
                                <div class="md:col-span-4">
                                    <label for="username">Username</label>
                                    <input
                                        type="text"
                                        id="username"
                                        bind:value={username}
                                        class="h-10 border mt-1 rounded px-4 w-full bg-gray-50"
                                        placeholder="Username"
                                        required
                                    />
                                </div>
                                <div class="md:col-span-4">
                                    <label for="password">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        bind:value={password}
                                        class="h-10 border mt-1 rounded px-4 w-full bg-gray-50"
                                        placeholder="Password (8 or more characters)"
                                        required
                                    />
                                </div>
                                {#if error}
                                    <div class="md:col-span-5 text-red-500">
                                        {error}
                                    </div>
                                {/if}
                                <div class="md:col-span-5 text-right mt-4">
                                    <button
                                        type="submit"
                                        class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- <script lang="ts">
    import { onMount, onDestroy } from "svelte";

    interface Column {
        id: keyof TableRow;
        label: string;
        width: number;
        maxWidth: number;
        minWidth: number;
    }

    interface TableRow {
        id: number;
        name: string;
        email: string;
        role: string;
        status: string;
    }

    let columns: Column[] = [
        { id: "id", label: "ID", width: 60, maxWidth: 100, minWidth: 50 },
        { id: "name", label: "Name", width: 200, maxWidth: 300, minWidth: 50 },
        {
            id: "email",
            label: "Email",
            width: 200,
            maxWidth: 300,
            minWidth: 50,
        },
        { id: "role", label: "Role", width: 150, maxWidth: 250, minWidth: 50 },
        {
            id: "status",
            label: "Status",
            width: 100,
            maxWidth: 200,
            minWidth: 50,
        },
    ];

    const data: TableRow[] = [
        {
            id: 1,
            name: "This is a very long name that will be truncated",
            email: "johndoe@verylongexample.com",
            role: "Administrator with long title",
            status: "Active",
        },
        {
            id: 2,
            name: "Jane Smith",
            email: "jane@example.com",
            role: "User",
            status: "Inactive",
        },
    ];

    let currentColumnIndex: number | null = null;
    let startX: number;
    let startWidth: number;
    let isResizing = false;

    function getTextWidth(text: string): number {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return 0;

        context.font =
            getComputedStyle(document.body).font || "14px sans-serif";
        const metrics = context.measureText(text);
        return metrics.width + 32;
    }

    function calculateColumnWidths() {
        columns = columns.map((column) => {
            const headerWidth = getTextWidth(column.label);
            const contentWidths = data.map((row) =>
                getTextWidth(row[column.id].toString()),
            );
            const maxContentWidth = Math.max(...contentWidths);
            const minWidth = Math.max(50, headerWidth);
            const maxWidth = Math.max(maxContentWidth, headerWidth);

            return {
                ...column,
                width: Math.max(column.width, minWidth),
                minWidth,
                maxWidth,
            };
        });
    }

    function startResize(index: number, event: MouseEvent) {
        currentColumnIndex = index;
        startX = event.pageX;
        startWidth = columns[index].width;
        isResizing = true;
        document.body.classList.add("select-none");

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", stopResize);
    }

    function handleMouseMove(event: MouseEvent) {
        if (currentColumnIndex === null || !isResizing) return;

        const column = columns[currentColumnIndex];
        const diff = event.pageX - startX;
        const newWidth = Math.max(
            column.minWidth,
            Math.min(column.maxWidth, startWidth + diff),
        );

        columns[currentColumnIndex].width = newWidth;
        columns = [...columns]; // Trigger reactivity
    }

    function stopResize() {
        currentColumnIndex = null;
        isResizing = false;
        document.body.classList.remove("select-none");
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopResize);
    }

    onMount(() => {
        calculateColumnWidths();
    });

    onDestroy(() => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopResize);
    });
</script>

<div class="w-full overflow-x-auto bg-white rounded-lg shadow">
    <table class="w-full border border-gray-200">
        <thead class="bg-gray-100 border-b border-gray-300">
            <tr>
                {#each columns as column, i}
                    <th
                        class="relative p-2 text-left font-semibold text-gray-700 border-r border-gray-300"
                        style="width: {column.width}px; transition: {isResizing
                            ? 'none'
                            : 'width 0.2s ease-out'}"
                    >
                        <div class="flex items-center">
                            <span class="truncate">{column.label}</span>
                            <div
                                class="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent
                                       {isResizing && currentColumnIndex === i
                                    ? 'bg-blue-400'
                                    : 'hover:bg-blue-400'} 
                                       group"
                                role="presentation"
                                aria-hidden="true"
                                on:mousedown={(e) => startResize(i, e)}
                            >
                                {#if column.width === column.minWidth}
                                    <span
                                        class="absolute -left-4 top-1/2 -translate-y-1/2 text-xs text-red-500
                                               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    >
                                        Min
                                    </span>
                                {/if}
                                {#if column.width === column.maxWidth}
                                    <span
                                        class="absolute -right-4 top-1/2 -translate-y-1/2 text-xs text-red-500
                                               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    >
                                        Max
                                    </span>
                                {/if}
                            </div>
                        </div>
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
            {#each data as row}
                <tr class="hover:bg-gray-50">
                    {#each columns as column}
                        <td
                            class="p-2 text-gray-600 border-r border-gray-300"
                            style="width: {column.width}px; transition: {isResizing
                                ? 'none'
                                : 'width 0.2s ease-out'}"
                        >
                            <div
                                class="truncate"
                                title={row[column.id].toString()}
                            >
                                {row[column.id]}
                            </div>
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
    table {
        border-collapse: collapse;
        table-layout: fixed;
    }

    th,
    td {
        overflow: hidden;
        white-space: nowrap;
    }

    :global(.resize-active) {
        cursor: col-resize !important;
        user-select: none;
    }

    /* Add smooth transitions for resize handle */
    [role="presentation"] {
        transition: background-color 0.2s ease-out;
    }
</style> -->
