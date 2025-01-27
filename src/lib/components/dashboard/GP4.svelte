<script lang="ts">
  import { onMount } from "svelte";
  import Select from "svelte-select"; // Importing svelte-select for enhanced multi-select
  import { websocketStore } from "$lib/stores/websocket";
  import type { BaseMessage } from "$lib/stores/MessageType/messagetype";
  import AddEditModal from "$lib/components/dashboard/AddEditModal.svelte";

  export let entityName: string; // Entity name passed as a prop

  let entityRecords: any[] = [];
  let entityAttributes: any[] = [];

  // Dynamic filter state - stores unique values and selected values for each attribute
  let attributeFilters: Map<
    string,
    {
      uniqueValues: any[];
      selectedValue: any;
      displayName: string;
    }
  > = new Map();

  // Selected attributes using svelte-select
  let selectedAttributeOptions: {
    label: string;
    value: string;
    path?: string;
  }[] = [];
  let selectedAttributeName: string[] = []; // Extracted attribute names

  let selectedRowData: any = null;

  let showModal = false;
  let isEdit = false;
  let currentRecord: Record<string, any> = {};

  // Sorting state
  let sortColumn: string | null = null;
  let sortDirection: "asc" | "desc" = "asc";

  // Global search
  let globalSearch: string = "";

  // Specific attribute filters
  let cityFilter: string = ""; // Example filter for 'city' attribute
  let stateFilter: string = "";

  // Pagination state
  let currentPage: number = 1; // Current page
  const pageSize: number = 30; // Items per page
  let jumpPageInput: string = ""; // Input for jumping to a specific page

  onMount(() => {
    fetchEntityData();
  });

  // Reactive statement to map selected options to attribute names
  $: selectedAttributeName = selectedAttributeOptions.map(
    (option) => option.value,
  );

  // Fetch both attributes and records
  function fetchEntityData() {
    fetchEntityAttributes();
    fetchEntityRecords();
  }

  // Fetch entity attributes via WebSocket
  function fetchEntityAttributes() {
    if (!entityName) {
      console.error("Entity name is required");
      return;
    }

    const message: BaseMessage = {
      type: "action",
      action: "GetEntity",
      env: { user: "U005" },
      params: { entityName: "entity", primaryKey: entityName },
      payload: "",
    };

    websocketStore.sendMessage(message);

    const unsubscribe = websocketStore.subscribe((state) => {
      const lastMessage = state.messages[state.messages.length - 1];

      if (
        lastMessage?.type === "response" &&
        lastMessage.action === "GetEntity"
      ) {
        const attribute = lastMessage.params?.[entityName];
        console.log("Received Attributes from WebSocket:", attribute);
        const attributes = JSON.parse(attribute);
        console.log("Parsed Attributes from WebSocket:", attributes);
        if (attributes) {
          // Ensure each attribute has a 'path' property if it's nested
          entityAttributes = attributes.attributes.map((attr: any) => ({
            ...attr,
            path: attr.path || undefined, // Assign undefined if path is not provided
          }));
          console.log("Updated Attributes from WebSocket:", entityAttributes);
        } else {
          console.warn("No attributes found for entity:", entityName);
        }

        unsubscribe(); // Ensure we unsubscribe after processing
      }
    });
  }

  // Fetch entity records via WebSocket
  function fetchEntityRecords() {
    if (!entityName) {
      console.error("Entity name is required to fetch records");
      return;
    }

    const message: BaseMessage = {
      type: "action",
      action: "ListEntity",
      env: { user: "U005" },
      params: { entityName: entityName },
      payload: "",
    };

    websocketStore.sendMessage(message);

    const unsubscribe = websocketStore.subscribe((state) => {
      const lastMessage = state.messages[state.messages.length - 1];

      if (
        lastMessage?.type === "response" &&
        lastMessage.action === "ListEntity"
      ) {
        if (lastMessage.params?.result) {
          entityRecords = [...JSON.parse(lastMessage.params.result)];
          console.log("Updated Records from WebSocket:", entityRecords);
        }
      }
    });
  }

  // Get only the attributes selected by the user
  function getFilteredAttributes() {
    if (!entityAttributes || entityAttributes.length === 0) {
      return [];
    }
    if (selectedAttributeName.length > 0) {
      return entityAttributes.filter((attr) =>
        selectedAttributeName.includes(attr.name),
      );
    }
    return entityAttributes;
  }

  // Display row data in a modal
  function showRowData(row: any) {
    selectedRowData = row;
  }

  // Retrieve nested values from records
  function getNestedValue(
    record: any,
    path: string | undefined,
    attrName: string,
  ) {
    if (!path || typeof path !== "string") {
      console.log(`Fetching top-level attribute: ${attrName}`);
      return record[attrName];
    }
    const parts = path.split(".");
    let current = record;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return record[attrName];
      }
    }
    console.log(`Fetched nested value for path '${path}':`, current);
    return current;
  }

  // Open the Add Record modal
  function openAddModal() {
    isEdit = false;
    currentRecord = {}; // Reset current record
    showModal = true;
  }

  // Open the Edit Record modal
  function openEditModal(record: any) {
    isEdit = true;
    currentRecord = { ...record }; // Clone the record for editing
    showModal = true;
  }

  // Handle saving (adding or updating) records
  function handleSave(event: CustomEvent<any>) {
    const data = event.detail; // Record data from modal
    console.log("[GenericPage] handleSave, isEdit:", isEdit, " data:", data);

    // Find the attribute with data_type "id" for primary key
    const idAttribute = entityAttributes.find(
      (attr) => attr.data_type === "id",
    );

    if (!idAttribute) {
      console.error("No attribute with data_type 'id' found.");
      alert("Unable to save record: Missing primary key configuration.");
      return;
    }

    // Get the primary key value from the record data
    const primaryKeyName = idAttribute.name;
    const primaryKeyValue = data[primaryKeyName] || data.id;

    if (isEdit) {
      if (!primaryKeyValue) {
        console.error("Missing primary key value for update:", primaryKeyName);
        alert("Unable to update record: Missing primary key value.");
        return;
      }

      // Send the update record action via WebSocket
      const message: BaseMessage = {
        type: "action",
        action: "UpdateEntity",
        env: { user: "U005" },
        params: {
          entityName: entityName,
          primaryKey: primaryKeyValue,
          updates: JSON.stringify(data),
        },
        payload: "",
      };

      console.log("Sending UpdateEntity message:", message);
      websocketStore.sendMessage(message);
    } else {
      // Send the add record action via WebSocket
      const message: BaseMessage = {
        type: "action",
        action: "AddEntity",
        env: { user: "U005" },
        params: { entityName: entityName },
        payload: JSON.stringify(data),
      };

      console.log("Sending AddEntity message:", message);
      websocketStore.sendMessage(message);
    }
    fetchEntityData();
    showModal = false;
    // Optionally refresh the records after saving
  }

  // Close the modal
  function handleClose() {
    showModal = false;
  }

  // Handle deleting a record
  function handleDelete(record: any) {
    const idAttribute = entityAttributes.find(
      (attr) => attr.data_type === "id",
    );

    if (!idAttribute) {
      console.error("No attribute with data_type 'id' found.");
      alert("Unable to delete record: Missing primary key configuration.");
      return;
    }

    const primaryKeyName = idAttribute.name;
    const primaryKeyValue = record[primaryKeyName];

    const message: BaseMessage = {
      type: "action",
      action: "RemoveEntity",
      env: { user: "U005" },
      params: { entityName, primaryKey: primaryKeyValue },
      payload: "",
    };

    websocketStore.sendMessage(message);
    fetchEntityData();
  }

  // Sorting function
  function sortByColumn(column: string) {
    if (sortColumn === column) {
      // Toggle sort direction
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }
  }

  // Formatting function for address
  function formatAddress(address: any): string {
    if (!address || typeof address !== "object") return "";

    const {
      line1 = "",
      line2 = "",
      line3 = "",
      city = "",
      state = "",
      country = "",
      zip_code = "",
    } = address;

    // Concatenate the address parts, filtering out any empty strings
    return [line1, line2, line3, city, state, country, zip_code]
      .filter((part) => part) // Remove empty parts
      .join(", ");
  }

  // Compute filtered and sorted records
  $: filteredRecords = entityRecords
    .filter((record) => {
      // Global search
      if (globalSearch) {
        return getFilteredAttributes().some((attr) => {
          const value = getNestedValue(record, attr.path, attr.name);
          return (
            value &&
            value.toString().toLowerCase().includes(globalSearch.toLowerCase())
          );
        });
      }
      return true;
    })
    .filter((record) => {
      // Specific filter: State
      if (stateFilter) {
        const address = `${entityName}_address`;
        const path = `${address}.state`;
        const stateValue = getNestedValue(record, path, "state");
        return stateValue === stateFilter;
      }
      return true;
    })
    .filter((record) => {
      // Specific filter: City
      if (cityFilter) {
        const address = `${entityName}_address`;
        const path = `${address}.city`;
        const cityValue = getNestedValue(record, path, "city");
        return cityValue === cityFilter;
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;
      const attr = entityAttributes.find((attr) => attr.name === sortColumn);
      if (!attr) return 0;
      const aValue = getNestedValue(a, attr.path, attr.name);
      const bValue = getNestedValue(b, attr.path, attr.name);

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Compute total pages
  $: totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  // Reset currentPage if it exceeds totalPages
  $: {
    if (currentPage > totalPages) {
      currentPage = 1;
    }
  }

  // Compute records for the current page
  $: paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Compute distinct cities for the city filter dropdown
  $: distinctCities = Array.from(
    new Set(
      entityRecords.map((record) =>
        getNestedValue(record, `${entityName}_address.city`, "city"),
      ),
    ),
  ).filter((city) => city); // Remove undefined or null

  // Compute distinct states for the state filter dropdown
  $: distinctStates = Array.from(
    new Set(
      entityRecords.map((record) =>
        getNestedValue(record, `${entityName}_address.state`, "state"),
      ),
    ),
  ).filter((state) => state); // Remove undefined or null

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
    }
  }

  function previousPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }

  function jumpToPage() {
    const pageNumber = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      currentPage = pageNumber;
      jumpPageInput = "";
    } else {
      alert(`Please enter a valid page number between 1 and ${totalPages}.`);
    }
  }

  // Function to map sortDirection to aria-sort values
  function getAriaSort(
    direction: "asc" | "desc" | null,
  ): "ascending" | "descending" | "none" {
    if (direction === "asc") return "ascending";
    if (direction === "desc") return "descending";
    return "none";
  }
</script>

<div class="container my-4">
  <h2 class="mb-4">WMS Project</h2>

  <button class="btn btn-success mb-3" on:click={openAddModal}>
    Add {entityName || "Record"}
  </button>

  <div class="mb-3">
    <input
      type="text"
      class="form-control"
      bind:value={globalSearch}
      placeholder="Search across all selected attributes..."
      aria-label="Global Search"
    />
  </div>

  <div class="mb-3">
    <label for="attributeDropdown" class="form-label">
      <strong>Select Attributes to Display:</strong>
    </label>
    <Select
      id="attributeDropdown"
      items={entityAttributes.map((attr) => ({
        label: attr.name,
        value: attr.name,
        path: attr.path, // Include path if available
      }))}
      bind:value={selectedAttributeOptions}
      multiple
      placeholder="Select attributes to display"
      class="mt-2"
    />
  </div>

  <div class="row">
    {#if entityAttributes.some((attr) => attr.data_type === "address")}
      <div class="mb-3 col-md-6">
        <label for="stateFilter" class="form-label">
          <strong>Filter by State:</strong>
        </label>
        <select
          id="stateFilter"
          class="form-select"
          bind:value={stateFilter}
          aria-label="Filter by State"
        >
          <option value="">-- All States --</option>
          {#each distinctStates as state}
            <option value={state}>{state}</option>
          {/each}
        </select>
      </div>
    {/if}

    {#if entityAttributes.some((attr) => attr.data_type === "address")}
      <div class="mb-3 col-md-6">
        <label for="cityFilter" class="form-label">
          <strong>Filter by City:</strong>
        </label>
        <select
          id="cityFilter"
          class="form-select"
          bind:value={cityFilter}
          aria-label="Filter by City"
        >
          <option value="">-- All Cities --</option>
          {#each distinctCities as city}
            <option value={city}>{city}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
    <div class="d-flex align-items-center mb-2 mb-md-0">
      <button
        class="btn btn-secondary me-2"
        on:click={previousPage}
        disabled={currentPage === 1}
        aria-label="Previous Page"
      >
        Previous
      </button>

      <button
        class="btn btn-secondary"
        on:click={nextPage}
        disabled={currentPage === totalPages || filteredRecords.length === 0}
        aria-label="Next Page"
      >
        Next
      </button>
    </div>

    <span class="mb-2 mb-md-0">
      Page {currentPage} of {totalPages} ({filteredRecords.length} records)
    </span>

    <div class="d-flex align-items-center">
      <label for="jumpPageInput" class="me-2 mb-0">Jump to Page:</label>
      <input
        type="number"
        id="jumpPageInput"
        class="form-control me-2"
        bind:value={jumpPageInput}
        min="1"
        max={totalPages}
        placeholder="Page #"
        aria-label="Jump to Page Number"
      />
      <button
        class="btn btn-primary"
        on:click={jumpToPage}
        aria-label="Go to Page"
      >
        Go
      </button>
    </div>
  </div>

  {#if paginatedRecords.length > 0}
    <table class="table table-bordered">
      <thead>
        <tr>
          {#each getFilteredAttributes() as colAttr}
            <th
              scope="col"
              on:click={() => sortByColumn(colAttr.name)}
              style="cursor: pointer;"
              aria-sort={sortColumn === colAttr.name
                ? sortDirection === "asc"
                  ? "ascending"
                  : "descending"
                : "none"}
              tabindex="0"
              on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  sortByColumn(colAttr.name);
                }
              }}
            >
              {colAttr.name}
              {#if sortColumn === colAttr.name}
                {#if sortDirection === "asc"}
                  ▲
                {:else}
                  ▼
                {/if}
              {/if}
            </th>
          {/each}
          <th>Actions</th>
          <th>Edit/Delete</th>
        </tr>
      </thead>
      <tbody>
        {#each paginatedRecords as row}
          <tr>
            {#each getFilteredAttributes() as colAttr}
              <td>
                {#if colAttr.data_type.toLowerCase() === "address"}
                  {formatAddress(
                    getNestedValue(row, colAttr.path, colAttr.name),
                  )}
                {:else}
                  {getNestedValue(row, colAttr.path, colAttr.name)}
                {/if}
              </td>
            {/each}
            <td>
              <button
                class="btn btn-primary btn-sm"
                on:click={() => showRowData(row)}
                aria-label="View Details"
              >
                View Details
              </button>
            </td>
            <td class="text-center">
              <button
                class="btn btn-warning btn-sm me-2"
                on:click={() => openEditModal(row)}
                aria-label="Edit Record"
              >
                Edit
              </button>
              <button
                class="btn btn-danger btn-sm"
                on:click={() => handleDelete(row)}
                aria-label="Delete Record"
              >
                Delete
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else if entityName}
    <p>No data found for the selected entity.</p>
  {/if}

  {#if selectedRowData}
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rowDetailsTitle"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="rowDetailsTitle">Row Details</h3>
          <button
            class="close-button"
            on:click={() => (selectedRowData = null)}
            aria-label="Close Modal"
          >
            ×
          </button>
        </div>
        <div class="modal-body">
          <pre>{JSON.stringify(selectedRowData, null, 2)}</pre>
        </div>
      </div>
    </div>
  {/if}
</div>

<AddEditModal
  {entityName}
  recordData={currentRecord}
  {isEdit}
  attributes={entityAttributes}
  bind:show={showModal}
  on:save={handleSave}
  on:close={handleClose}
/>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    max-width: 80%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
  }

  .modal-body {
    max-height: calc(80vh - 100px);
    overflow-y: auto;
  }

  pre {
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  th {
    user-select: none;
  }

  th:hover {
    background-color: #f1f1f1;
  }
</style>
