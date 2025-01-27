<script lang="ts">
    import { writable } from "svelte/store";
    import { websocketStore } from "$lib/stores/websocket";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher<{ closeModal: void }>();

    export let workflow: any = null;

    let formData = writable<Record<string, any>>({});

    function handleInputChange(question: string, value: any) {
        formData.update((current) => ({ ...current, [question]: value }));
    }

    function handleSubmit(event: Event) {
        event.preventDefault();
        let currentFormData: Record<string, any> = {};
        formData.subscribe((data) => (currentFormData = { ...data }))();

        console.log("Form Submitted:", currentFormData);

        const submission = {
            type: "wms_action",
            action: "SubmitWorkflow",
            env: {
                user: "U005",
                transaction: "",
            },
            params: {
                reason: "Checking In Trailer",
                entityName: "operation",
                function: "CheckInTrailer",
                update: JSON.stringify({
                    formdata: currentFormData,
                    stop_operation_on_failure:
                        workflow.stop_operation_on_failure,
                    type: workflow.type,
                    workflow: workflow.workflow,
                }),
            },
        };
        console.log("Form submission:", submission);
        websocketStore.sendMessage(submission);
        formData.set({});
        dispatch("closeModal");
    }
</script>

<div
    class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg border border-gray-200 scrollbar-hidden"
>
    <div class="mb-6">
        <h3 class="text-sm font-medium text-[#34495E]">
            <span class="text-base font-semibold">Workflow- </span>
            {workflow.workflow}
        </h3>
        <p class="text-sm mt-1 font-medium text-[#34495E]">
            <span class="text-base font-semibold">Type- </span>
            {workflow.type}
        </p>
    </div>

    <form
        on:submit|preventDefault={handleSubmit}
        class="space-y-8 scrollbar-hidden"
    >
        {#each workflow.questions as questionObj, index}
            <div class="space-y-4">
                <label
                    for={`question-${index}`}
                    class="block text-base font-medium text-gray-800"
                >
                    {questionObj.question}
                </label>

                {#if questionObj.data_type === "boolean"}
                    <div class="flex space-x-4">
                        {#each questionObj.possible_values as option}
                            <label class="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name={`question-${index}`}
                                    value={option}
                                    on:change={(e) => {
                                        handleInputChange(
                                            questionObj.question,
                                            (e.target as HTMLInputElement)
                                                .value,
                                        );
                                    }}
                                    class="text-[#34495E] focus:ring-[#34495E]"
                                />
                                <span class="text-gray-800">{option}</span>
                            </label>
                        {/each}
                    </div>
                {/if}

                {#if questionObj.data_type === "dropdown"}
                    <select
                        on:change={(e) => {
                            handleInputChange(
                                questionObj.question,
                                (e.target as HTMLSelectElement).value,
                            );
                        }}
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#34495E] focus:border-[#34495E] sm:text-sm text-gray-800"
                    >
                        <option value="">Select an option</option>
                        {#each questionObj.possible_values as option}
                            <option class=" font-medium" value={option}
                                >{option}</option
                            >
                        {/each}
                    </select>
                {/if}

                {#if questionObj.data_type === "multi-select"}
                    <div class="space-y-2 font-medium text-sm">
                        {#each questionObj.possible_values as option}
                            <label class="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    value={option}
                                    on:change={(e) => {
                                        formData.update((current) => {
                                            const currentValues =
                                                current[questionObj.question] ||
                                                [];
                                            return {
                                                ...current,
                                                [questionObj.question]: (
                                                    e.target as HTMLInputElement
                                                ).checked
                                                    ? [...currentValues, option]
                                                    : currentValues.filter(
                                                          (item: any) =>
                                                              item !== option,
                                                      ),
                                            };
                                        });
                                    }}
                                    class="text-[#34495E] focus:ring-[#34495E] font-medium"
                                />
                                <span class="text-gray-800">{option}</span>
                            </label>
                        {/each}
                    </div>
                {/if}

                {#if questionObj.data_type === "int"}
                    <input
                        type="number"
                        min={questionObj.min}
                        max={questionObj.max}
                        on:change={(e) => {
                            handleInputChange(
                                questionObj.question,
                                parseInt((e.target as HTMLInputElement).value),
                            );
                        }}
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#34495E] focus:border-[#34495E] sm:text-sm text-gray-800"
                    />
                {/if}
            </div>
        {/each}

        <div class="mt-8">
            <button
                type="submit"
                class=" bg-[#34495E] text-white py-2 px-4 rounded-lg text-sm hover:bg-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#34495E] focus:ring-offset-2 transition duration-300"
            >
                Submit
            </button>
        </div>
    </form>
</div>
