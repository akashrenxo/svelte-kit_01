<script lang="ts">
    import { onMount } from "svelte";
    import { websocketStore } from "$lib/stores/websocket";
    import Cookies from "js-cookie";
    import { writable, derived, get } from "svelte/store";

    interface Entity {
        entity: string;
        attributes: string[];
        isShareable: boolean;
    }

    let entities: Entity[] = [];
    let attributes: string[] = [];
    let selectedEntity: string | null = null;
    let ruleText = "";
    let selectedOperation = "AND";
    let error: string | null = null;
    let isLoading = false;
    let validationError: string | null = null;
    let areas = "";
    let showModal = false;
    let modalMessage = "";
    let modalType: "success" | "failure" = "success";
    let retryCount = 0;
    const MAX_RETRIES = 1;
    let errorMessage = writable<string | null>(null);

    onMount(() => {
        if ($websocketStore.isConnected) {
            fetchEntities();
        }
    });

    const userId = Cookies.get("userId") || "";

    const fetchEntities = () => {
        if (!$websocketStore.isConnected) {
            error = "WebSocket is not connected";
            return;
        }
        isLoading = true;
        error = null;
        websocketStore.sendMessage({
            type: "action",
            action: "ListEntity",
            env: {
                user: userId,
            },
            params: {
                entityName: "entity",
            },
            payload: "",
        });
    };
    onMount(() => {
        // initializeWebSocket();
        // initializeSubscriptions();

        const interval = setInterval(() => {
            if ((attributes).length === 0 && retryCount < MAX_RETRIES) {
                retryCount++;
                fetchEntities();
            } else if (retryCount >= MAX_RETRIES) {
                clearInterval(interval);
                errorMessage.set("Failed to load data after multiple attempts");
            }
        }, 2000);

        return () => clearInterval(interval);
    });
    $: {
        if ($websocketStore.messages.length > 0) {
            const latestMessage =
                $websocketStore.messages[$websocketStore.messages.length - 1];
            if (latestMessage.params?.result) {
                try {
                    const result = JSON.parse(latestMessage.params.result);
                    entities = Object.values(result).map((entity: any) => ({
                        entity: entity.entity,
                        attributes: entity.attributes.map(
                            (attr: any) => attr.name,
                        ),
                        isShareable: true,
                    }));
                    error = null;
                } catch (err) {
                    error = "Failed to parse response";
                }
            }
            isLoading = false;
        }
    }

    const handleEntityClick = (entity: string, event: Event) => {
        event.preventDefault();
        const selected = entities.find((e) => e.entity === entity);
        if (selected) {
            selectedEntity = entity;
            attributes = selected.attributes || [];
            error = null;
        } else {
            attributes = [];
            error = `No attributes found for ${entity}`;
        }
    };

    const handleAttributeSelect = (attribute: string, event: Event) => {
        event.preventDefault();
        if (selectedEntity && attribute) {
            ruleText = ruleText
                ? `${ruleText} ${selectedOperation} ${selectedEntity}.${attribute}`
                : `${selectedEntity}.${attribute}`;
        }
    };

    const validateRule = () => {
        validationError = null;
        const ruleParts = ruleText.split(
            /\s+(AND|OR|NOT|IN|>|<|=|<=|>=|!=|!|\+|\-|\*|\/|%)\s+/,
        );
        if (ruleText === "") {
            validationError = `please create rules !!`;
            showModal = true;
            modalMessage = validationError;
            modalType = "failure";
            return;
        }
        for (let i = 0; i < ruleParts.length; i++) {
            const part = ruleParts[i].trim();
            if (part.includes(".")) {
                const [entityName, attributeName] = part.split(".");
                const entity = entities.find((e) => e.entity === entityName);
                if (!entity) {
                    validationError = `Entity ${entityName} does not exist`;
                    showModal = true;
                    modalMessage = validationError;
                    modalType = "failure";
                    return;
                }
                if (!entity.attributes.includes(attributeName)) {
                    validationError = `Attribute ${attributeName} does not exist in entity ${entityName}`;
                    showModal = true;
                    modalMessage = validationError;
                    modalType = "failure";
                    return;
                }
            }
        }
        validationError = "Rule is valid";
        showModal = true;
        modalMessage = validationError;
        modalType = "success";
    };

    function convertToPostfix(infix: string) {
        type Operator =
            | "AND"
            | "OR"
            | "NOT"
            | "IN"
            | ">"
            | "<"
            | "="
            | "!="
            | "!"
            | "<="
            | ">="
            | "+"
            | "-"
            | "*"
            | "/"
            | "%";
        const precedence: Record<Operator, number> = {
            AND: 1,
            OR: 1,
            NOT: 2,
            IN: 3,
            ">": 4,
            "<": 4,
            "=": 4,
            "!=": 4,
            "!": 5,
            "<=": 4,
            ">=": 4,
            "+": 5,
            "-": 5,
            "*": 6,
            "/": 6,
            "%": 6,
        };
        function isOperator(token: string): token is Operator {
            return Object.prototype.hasOwnProperty.call(precedence, token);
        }
        const stack: string[] = [];
        const output: string[] = [];
        const tokens = infix.split(/\s+/);
        tokens.forEach((token) => {
            if (isOperator(token)) {
                while (
                    stack.length &&
                    isOperator(stack[stack.length - 1]) &&
                    precedence[stack[stack.length - 1] as Operator] >=
                        precedence[token]
                ) {
                    output.push(stack.pop()!);
                }
                stack.push(token);
            } else {
                output.push(token);
            }
        });
        while (stack.length) {
            output.push(stack.pop()!);
        }
        return output;
    }
    // Separate reactive statement for handling websocket messages
    $: {
        if ($websocketStore.messages.length > 0) {
            const latestMessage =
                $websocketStore.messages[$websocketStore.messages.length - 1];
            if (latestMessage.action === "AddEntity") {
                if (latestMessage?.result?.code === "SUCCESS0122") {
                    showModal = true;
                    modalMessage = latestMessage?.result?.message;
                    modalType = "success";
                    // Clear form on success
                    ruleText = "";
                    areas = "";
                    validationError = null;
                } else {
                    showModal = true;
                    modalMessage = "Error during add rules";
                    modalType = "failure";
                }
            }
        }
    }
    const saveRule = () => {
        if (validationError !== "Rule is valid") {
            error = "Please validate the rule before saving";
            showModal = true;
            modalMessage = error;
            modalType = "failure";
            return;
        }
        const postfixRule = convertToPostfix(ruleText);
        const condition = postfixRule.map((token) => {
            if (token.includes(".")) {
                return { type: "var", val: token };
            } else if (
                [
                    "AND",
                    "OR",
                    "NOT",
                    "IN",
                    ">",
                    "<",
                    "=",
                    "!=",
                    "!",
                    "<=",
                    ">=",
                    "+",
                    "-",
                    "*",
                    "/",
                    "%",
                ].includes(token)
            ) {
                return { type: "op", val: token };
            } else {
                return { type: "val", val: token };
            }
        });
        const toAreas = areas.split(",").map((area) => area.trim());
        const payload = {
            condition: condition,
            infix: ruleText,
            seq: 1,
            to_areas: toAreas,
        };
        websocketStore.sendMessage({
            type: "action",
            action: "AddEntity",
            env: {
                user: "U005",
            },
            params: {
                entityName: "storage_rule",
            },
            payload: JSON.stringify(payload),
        });
    };
</script>

<div class=" text-white min-h-screen p-6 rounded-md">
    <div class="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white text-[#34495E] p-4 rounded shadow">
            <h3 class="text-lg font-bold mb-4">Entities</h3>
            {#if isLoading}
                <p class="text-[#34495E] mb-4">Loading entities...</p>
            {/if}

            {#if entities.length > 0}
                <ul class="space-y-2">
                    {#each entities as entity, index}
                        <li class="border-b pb-2">
                            <button
                                type="button"
                                class="text-[#34495E] text-sm font-medium"
                                on:click={(e) =>
                                    handleEntityClick(entity.entity, e)}
                            >
                                {entity.entity}
                            </button>
                        </li>
                    {/each}
                </ul>
            {:else if !isLoading}
                <p class="mt-4">No shareable entities found</p>
            {/if}
        </div>

        <div class="bg-white text-[#34495E] p-4 rounded shadow">
            <h4 class="text-lg font-bold mb-4">
                Attributes of {selectedEntity}
            </h4>
            {#if selectedEntity}
                <div>
                    {#if attributes.length > 0}
                        <ul class="space-y-2">
                            {#each attributes as attribute, idx}
                                <li class="border-b pb-2">
                                    <button
                                        type="button"
                                        class="text-[#34495E] text-sm font-medium"
                                        on:click={(e) =>
                                            handleAttributeSelect(attribute, e)}
                                    >
                                        {attribute}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {:else}
                        <p>No attributes available</p>
                    {/if}
                </div>
            {/if}
        </div>

        <div class="bg-white text-[#34495E] p-4 rounded shadow">
            <h4 class="text-lg font-bold mb-4">Create Rule</h4>
            <form class="space-y-4">
                <div>
                    <label for="ruleText" class="block text-sm font-medium"
                        >Rule</label
                    >
                    <input
                        type="text"
                        id="ruleText"
                        class="w-full p-2 text-sm border rounded focus:outline-none focus:ring focus:ring-blue-500"
                        bind:value={ruleText}
                        placeholder="Select entity and attribute"
                    />
                </div>

                <div>
                    <label for="operation" class="block text-sm font-medium"
                        >Logical Operation</label
                    >
                    <select
                        id="operation"
                        class="w-full text-sm font-medium p-2 border rounded focus:outline-none focus:ring focus:ring-blue-500"
                        bind:value={selectedOperation}
                    >
                        <option class=" font-medium" value="AND">AND</option>
                        <option class=" font-medium" value="OR">OR</option>
                        <option class=" font-medium" value="NOT">NOT</option>
                        <option class=" font-medium" value="IN">IN</option>
                        <option class=" font-medium" value=">"
                            >Greater Than</option
                        >
                        <option class=" font-medium" value="<">Less Than</option
                        >
                        <option class=" font-medium" value="=">Equal</option>
                        <option class=" font-medium" value="!="
                            >Not Equal</option
                        >
                        <option class=" font-medium" value="!">Not</option>
                        <option class=" font-medium" value="<="
                            >Less Than or Equal</option
                        >
                        <option class=" font-medium" value=">="
                            >Greater Than or Equal</option
                        >
                        <option class=" font-medium" value="+">Add</option>
                        <option class=" font-medium" value="-">Subtract</option>
                        <option class=" font-medium" value="*">Multiply</option>
                        <option class=" font-medium" value="/">Divide</option>
                        <option class=" font-medium" value="%">Modulus</option>
                    </select>
                </div>

                <div>
                    <label for="areas" class="block text-sm font-medium"
                        >Areas</label
                    >
                    <input
                        type="text"
                        id="areas"
                        class="w-full p-2 font-medium text-sm border rounded focus:outline-none focus:ring focus:ring-blue-500"
                        bind:value={areas}
                        placeholder="Enter areas, separated by commas"
                    />
                </div>

                <div class="flex space-x-4">
                    <button
                        type="button"
                        class="bg-[#00B894] text-sm text-white px-4 py-2 rounded"
                        on:click={validateRule}
                    >
                        Validate Rule
                    </button>
                    <button
                        type="button"
                        class="bg-[#34495E] text-sm text-white px-4 py-2 rounded"
                        on:click={saveRule}
                    >
                        Save Rule
                    </button>
                </div>
            </form>

            {#if ruleText}
                <div class="mt-4 bg-gray-100 p-2 rounded">
                    <h5 class="font-bold text-sm">Current Rule</h5>
                    <p class=" text-sm">{ruleText}</p>
                </div>
            {/if}

            {#if validationError}
                <div class="mt-4">
                    <h5 class="font-bold text-sm">Validation Result</h5>
                    <p
                        class={validationError === "Rule is valid"
                            ? "text-green-500"
                            : "text-red-500"}
                    >
                        {validationError}
                    </p>
                </div>
            {/if}

            {#if showModal}
                <div
                    class="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50"
                >
                    <div
                        class="bg-white text-center rounded-lg shadow-lg w-1/3 p-8 max-w-lg mx-auto font-medium"
                    >
                        <h4
                            class={`text-lg font-bold mb-4 text-start ${modalType === "success" ? "text-green-600" : "text-red-600"}`}
                        >
                            {modalType === "success"
                                ? "Operation Successful"
                                : "Operation Failed"}
                        </h4>
                        <p class="text-gray-700 my-4 text-start">
                            {modalMessage}
                        </p>
                        <button
                            class="bg-[#34495E] hover:bg-[#34495E] text-white px-6 py-2 rounded-md text-sm font-medium"
                            on:click={() => (showModal = false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
<slot />