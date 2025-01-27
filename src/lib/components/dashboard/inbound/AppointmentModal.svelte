<script lang="ts">
  import type { Appointment } from "$lib/stores/MessageType/messagetype";
  export let selectedAppointment: Appointment | null;
  export let closeModal: () => void;
  export let saveChanges: () => void;
  export let dockOptions: string[] = [];
</script>

{#if selectedAppointment}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded-lg shadow-lg w-1/3">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Trailer Details</h2>
        <button
          class="text-gray-400 hover:text-gray-600 focus:outline-none"
          on:click={closeModal}
        >
          ✖
        </button>
      </div>
      <p>
        <strong>Inbound Delivery:</strong>
        {selectedAppointment.inbound_delivery}
      </p>
      <p><strong>Status:</strong> {selectedAppointment.status}</p>

      <div class="mt-4">
        <label for="status" class="block mb-2">Update Status:</label>
        <select id="status" class="w-full p-2 border rounded">
          <option
            value="pending"
            selected={selectedAppointment.status === "pending"}>Pending</option
          >
          <option
            value="in_progress"
            selected={selectedAppointment.status === "in_progress"}
            >In Progress</option
          >
          <option
            value="complete"
            selected={selectedAppointment.status === "complete"}
            >Complete</option
          >
        </select>

        <label for="dock" class="block mt-4 mb-2">Update Dock:</label>
        <select id="dock" class="w-full p-2 border rounded">
          <option value="" selected={!selectedAppointment.dock}
            >Not Assigned</option
          >
          {#each dockOptions as dockOption}
            <option
              value={dockOption}
              selected={selectedAppointment.dock === dockOption}
            >
              {dockOption}
            </option>
          {/each}
        </select>

        <div class="flex justify-end mt-6 space-x-2">
          <button
            class="bg-gray-200 text-gray-700 transition-all duration-200 ease-in-out py-2 px-6 rounded-xl hover:cursor-pointer"
            on:click={closeModal}
          >
            Cancel
          </button>
          <button
            class="bg-[#34495E] hover:bg-[#34495E] transition-all duration-200 ease-in-out text-white py-2 px-6 rounded-xl hover:cursor-pointer"
            on:click={saveChanges}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
