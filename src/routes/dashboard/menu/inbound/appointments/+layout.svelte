<script lang="ts">
  import { onMount } from "svelte";
  import { appointmentStore } from "$lib/stores/apiStores/appointmentStore";
  import type { Appointment } from "$lib/stores/MessageType/messagetype";
  import { websocketStore } from "$lib/stores/websocket";
  import AppointmentModal from "$lib/components/dashboard/inbound/AppointmentModal.svelte"; // Import the modal component

  // Define interfaces
  interface TimeEntry {
    internationalTime: string;
    localTime: string;
    appointments: Record<string, Appointment | null>;
  }

  //Define Variables
  let appointments: Appointment[] = []; // Holds the fetched appointments
  let selectedAppointment: Appointment | null = null; //selected on right click
  let showModal = false;
  let draggedAppointment: Appointment | null = null; //selected on drag and drop
  const timezones: string[] = Intl.supportedValuesOf("timeZone"); // Get supported timezones
  let timeEntries: TimeEntry[] = []; //store the time entries

  // Initialize with the current timezone
  let selectedTimezone: string =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  onMount(() => {
    // Generate initial time entries
    generateTimeEntries();

    // Fetch appointments and subscribe to updates
    appointmentStore.fetchAppointments();

    const unsubscribe = appointmentStore.subscribe((data) => {
      console.log("Appointments received in +page.svelte:", data);
      appointments = data.appointments; // Update appointments array reactively
      generateTimeEntries(); // Regenerate time entries based on new data
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  });

  // Function to round down to the nearest hour (13:15 to 13:00)
  function getStartOfCurrentHour(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      0,
      0,
      0,
    );
  }

  // Function to generate time entries
  function generateTimeEntries(): void {
    const now = new Date();
    const startTime = getStartOfCurrentHour(now);
    const entries: TimeEntry[] = [];

    for (let i = 0; i < 24; i++) {
      const localTime = new Date(startTime.getTime() + i * 60 * 60 * 1000);

      // Format international time based on selected timezone
      const internationalTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: selectedTimezone,
      }).format(localTime);

      // Format local time based on current timezone
      const formattedLocalTime = localTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const entryAppointments: Record<string, Appointment | null> = {};

      // Populate appointment data
      appointments.forEach((appointment) => {
        const appointmentTime = new Date(appointment.schedule);
        if (
          appointment.dock &&
          appointmentTime.getHours() === localTime.getHours()
        ) {
          entryAppointments[appointment.dock] = appointment;
        }
      });

      entries.push({
        internationalTime,
        localTime: formattedLocalTime,
        appointments: entryAppointments,
      });
    }

    timeEntries = entries;
  }

  // Reactive statement to regenerate time entries whenever selectedTimezone or appointments change
  $: if (selectedTimezone || appointments) {
    generateTimeEntries();
  }

  // Function to handle timezone selection
  function selectTimezone(tz: string): void {
    selectedTimezone = tz;
  }

  // Get background color based on status
  function getStatusColor(status: string): string {
    switch (status) {
      case "pending":
        return "bg-yellow-300";
      case "in_progress":
        return "bg-orange-300";
      case "complete":
        return "bg-green-300";
      default:
        return "";
    }
  }

  function openModal(appointment: Appointment): void {
    selectedAppointment = { ...appointment };
    showModal = true;
  }

  function closeModal(): void {
    showModal = false;
    selectedAppointment = null;
  }

  // Save changes from the modal
  function saveChanges(): void {
    if (selectedAppointment) {
      const statusSelect = document.getElementById(
        "status",
      ) as HTMLSelectElement;
      const dockSelect = document.getElementById("dock") as HTMLSelectElement;

      selectedAppointment.status = statusSelect.value;
      selectedAppointment.dock = dockSelect.value || undefined;

      appointments = appointments.map((appointment) =>
        appointment.id === selectedAppointment?.id
          ? selectedAppointment
          : appointment,
      );

      const message = {
        type: "action",
        action: "UpdateEntity",
        env: { user: "U005" },
        params: {
          entityName: "appointment",
          primaryKey: selectedAppointment.id,
          updates: JSON.stringify(selectedAppointment),
        },
      };
      websocketStore.sendMessage(message);
      closeModal();
    }
  }

  function onDragStart(event: DragEvent, appointment: Appointment): void {
    draggedAppointment = appointment;
    event.dataTransfer?.setData(
      "application/json",
      JSON.stringify(appointment),
    );
  }

  function onDrop(
    event: DragEvent,
    targetDock: string,
    targetTime: string,
  ): void {
    event.preventDefault();

    if (draggedAppointment) {
      // Construct a valid date-time string using the current date and targetTime
      const now = new Date();
      const targetDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        parseInt(targetTime.split(":")[0]), // Extract hours from targetTime
        parseInt(targetTime.split(":")[1]), // Extract minutes from targetTime
      );

      // Ensure the date-time is valid
      if (isNaN(targetDateTime.getTime())) {
        console.error("Invalid target time:", targetTime);
        return;
      }
      // Format the date as "Fri Jan 17 2025 20:00:00 GMT+00:00"
      const formattedSchedule =
        new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
          hour12: false,
        }).format(targetDateTime) + " GMT+00:00";

      const updatedAppointment: Appointment = {
        ...draggedAppointment,
        dock: targetDock === "not_assigned" ? undefined : targetDock,
        schedule: formattedSchedule.replaceAll(",", ""), // Use the formatted schedule
        manually_set: true, // Mark as manually set
      };

      appointments = appointments.map((appointment) =>
        appointment.id === updatedAppointment.id
          ? updatedAppointment
          : appointment,
      );

      // Trigger server update
      const message = {
        type: "action",
        action: "UpdateEntity",
        env: { user: "U005" },
        params: {
          entityName: "appointment",
          primaryKey: updatedAppointment.id,
          updates: JSON.stringify(updatedAppointment),
        },
      };
      websocketStore.sendMessage(message);
      console.log("Dragged and updated appointment:", message);
    }

    draggedAppointment = null;
  }

  function onDragOver(event: DragEvent): void {
    event.preventDefault();
  }
  function getBorderClass(appointment: Appointment | null): string {
    if (appointment?.manually_set) {
      return "border-red-500"; // Add red border for manually set appointments
    }
    return "border-gray-300"; // Default border color
  }

  let isOpen = false;

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function closeDropdown() {
    isOpen = false;
  }

  onMount(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        closeDropdown();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });
</script>

<!-- Functionalities 1, 2 & 3: UI Components -->
<div class="p-4">
  <!-- Timezone Dropdown -->
  <div class="relative mb-6 dropdown-container font-medium">
    <button
      class="text-sm bg-[#34495E] hover:bg-[#34495E] transition duration-200 text-white py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34495E] focus:ring-offset-2 shadow-md"
      on:click={toggleDropdown}
      aria-haspopup="true"
      aria-expanded={isOpen}
    >
      {selectedTimezone}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 inline-block ml-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
    {#if isOpen}
      <ul
        class="absolute z-20 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-[20rem] max-h-[400px] overflow-auto"
        role="menu"
        aria-label="Timezone Selection"
      >
        {#each timezones as timezone}
          <li>
            <button
              class="block w-full text-left text-sm text-gray-700 px-4 py-2 hover:bg-blue-100 hover:text-blue-800 focus:outline-none"
              on:click={() => {
                selectTimezone(timezone);
                closeDropdown();
              }}
              role="menuitem"
            >
              {timezone}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <!-- Time Table -->
  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead>
        <tr class="text-center text-xs">
          <th>International Time ({selectedTimezone})</th>
          <th>Local Time</th>
          <th>Not Assigned</th>
          <th>DD1</th>
          <th>DD2</th>
          <th>DD3</th>
          <th>DD4</th>
          <th>DD5</th>
        </tr>
      </thead>
      <tbody class="text-center">
        {#each timeEntries as entry}
          <tr>
            <td>{entry.internationalTime}</td>
            <td>{entry.localTime}</td>
            {#each ["not_assigned", "DD1", "DD2", "DD3", "DD4", "DD5"] as dock}
              <td
                on:dragover={onDragOver}
                on:drop={(event) => onDrop(event, dock, entry.localTime)}
              >
                {#if entry.appointments[dock]}
                  <button
                    draggable="true"
                    on:dragstart={(event) =>
                      onDragStart(event, entry.appointments[dock]!)}
                    on:contextmenu={(e) => {
                      e.preventDefault();
                      if (entry.appointments[dock]) {
                        openModal(entry.appointments[dock]);
                      }
                    }}
                    class="btn btn-sm btn-block text-xs {getStatusColor(
                      entry.appointments[dock]?.status || '',
                    )} {getBorderClass(entry.appointments[dock])}"
                  >
                    {entry.appointments[dock]?.inbound_delivery || ""}
                  </button>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if showModal && selectedAppointment}
    <AppointmentModal
      {selectedAppointment}
      {closeModal}
      {saveChanges}
      dockOptions={["not_assigned", "DD1", "DD2", "DD3", "DD4", "DD5"]}
    />
  {/if}
</div>

<!--<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
      <p><strong>Inbound Delivery:</strong> {selectedAppointment.inbound_delivery}</p>
      <p><strong>Status:</strong> {selectedAppointment.status}</p>

      <div class="mt-4">
        <label for="status" class="block mb-2">Update Status:</label>
        <select id="status" class="w-full p-2 border rounded">
          <option value="pending" selected={selectedAppointment.status === "pending"}>Pending</option>
          <option value="in_progress" selected={selectedAppointment.status === "in_progress"}>In Progress</option>
          <option value="complete" selected={selectedAppointment.status === "complete"}>Complete</option>
        </select>

        <label for="dock" class="block mt-4 mb-2">Update Dock:</label>
        <select id="dock" class="w-full p-2 border rounded">
          <option value="" selected={!selectedAppointment.dock}>Not Assigned</option>
          {#each ["DD1", "DD2", "DD3", "DD4", "DD5"] as dockOption}
            <option value={dockOption} selected={selectedAppointment.dock === dockOption}>
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
  </div>-->

<style>
  /* Ensure the dropdown opens downward */
  .dropdown {
    position: relative;
  }

  .dropdown-content {
    position: absolute;
    top: 100%; /* Position below the button */
    left: 0;
    z-index: 1000;
  }

  /* Optional: Table Styling */
  table {
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.75rem;
    border-bottom: 1px solid #ddd;
    border-left: 1px solid #ddd;
  }

  th {
    background-color: #f3f4f6; /* DaisyUI's base-200 */
  }

  .bg-yellow-300 {
    background-color: #f1c40f; /* Adjusted yellow */
  }

  .bg-orange-300 {
    background-color: #e67e22; /* Adjusted orange */
  }

  .bg-green-300 {
    background-color: #2ecc71; /* Adjusted green */
  }

  .border-red-500 {
    border-width: 3px;
    border-color: #e74c3c; /* Tailored red */
  }

  .border-gray-300 {
    border-width: 1px;
    border-color: #b0bec5; /* Tailwind's gray-300 */
  }
</style>
