<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { DisplayAttribute } from '$lib/stores/MessageType/messagetype';
    // Props passed in:
    export let show: boolean;                             // Whether to display the modal
    export let entityName: string;                        // Name of the entity (e.g. 'Supplier')
    export let attributes:  DisplayAttribute[] = [];
    /**
     * This object holds the actual data for each field. For address fields,
     * it can be an object like:
     *   { line1, line2, line3, city, state, zip, country }
     */
    export let recordData: Record<string, any> = {};
    // If this is an edit form (vs. an add form)
    export let isEdit: boolean = false;
    // Svelte event dispatcher
    const dispatch = createEventDispatcher();
    /**
     * Close the modal (fires the 'close' event so parent can hide the modal)
     */
    function closeModal() {
      dispatch('close');
    }
    /**
     * Handle the save action (fires the 'save' event so parent can do its saving logic)
     */
    function handleSave() {
      // Send recordData upward so the parent can handle saving
      dispatch('save', recordData);
      closeModal();
    }
    /**
     * Safely update the recordData in an immutable-friendly way.
     */
    function updateRecord(attrName: string, value: any) {
      recordData = { ...recordData, [attrName]: value };
    }
    /**
     * For address fields, we might want to store hierarchical data like
     * recordData[attrName] = { line1, line2, line3, city, state, zip, country }
     * This helper updates nested fields inside the address object.
     */
    function updateAddressField(attrName: string, field: string, value: string) {
      const currentAddress = recordData[attrName] || {};
      const updatedAddress = { ...currentAddress, [field]: value };
      updateRecord(attrName, updatedAddress);
    }
  </script>
  <!-- If show is true, we display the modal. Otherwise, it's hidden. -->
  {#if show}
    <!-- Modal backdrop -->
    <div class="modal-backdrop fade show"></div>
    <!-- Actual modal -->
    <div class="modal d-block" tabindex="-1" style="display: block;">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <!-- Modal header -->
          <div class="modal-header">
            <h5 class="modal-title">
              {isEdit ? `Edit ${entityName}` : `Add ${entityName}`}
            </h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              on:click={closeModal}
            ></button>
          </div>
          <!-- Modal body (where the form fields go) -->
          <div class="modal-body">
            {#each attributes as attr, index}
              <!--
                For demonstration, we skip rendering fields with type = 'standard_locked'
                or something custom. You can adapt this logic as needed.
              -->
              {#if attr.type !== 'standard_locked'}
                <div class="mb-4">
                  <label class="form-label fw-bold" for={"field-" + index}>
                    {attr.name}
                  </label>
                  <!-- ID field (read-only, or 'Auto-generated') -->
                  {#if attr.data_type === 'id'}
                    <input
                      id={"field-" + index}
                      class="form-control"
                      type="text"
                      value={recordData[attr.name] || 'Auto-generated'}
                      readonly
                    />
                  <!-- Text field -->
                  {:else if attr.data_type === 'text'}
                    <input
                      id={"field-" + index}
                      class="form-control"
                      type="text"
                      placeholder={`Enter ${attr.name}`}
                      value={recordData[attr.name] || ''}
                      on:input={(e) => {
                        const target = e.target as HTMLInputElement;
                        updateRecord(attr.name, target.value);
                      }}
                      required={attr.mandatory}
                    />
                  <!-- Toggle / checkbox field -->
                  {:else if attr.data_type === 'toggle'}
                    <div class="form-check">
                      <input
                        id={"field-" + index}
                        class="form-check-input"
                        type="checkbox"
                        checked={recordData[attr.name] || false}
                        on:change={(e) => {
                          const target = e.target as HTMLInputElement;
                          updateRecord(attr.name, target.checked);
                        }}
                      />
                      <label class="form-check-label" for={"field-" + index}>
                        {`Enable ${attr.name}`}
                      </label>
                    </div>
                  <!-- Address field - with multiple subfields (hierarchy) -->
                  {:else if attr.data_type === 'address'}
                    <!--
                      For demonstration, let's show line1, line2, line3, city, state, zip, country.
                      This ensures the address data is stored in the correct hierarchy:
                        recordData["supplier_address"] = {
                          line1, line2, line3, city, state, zip, country
                        }
                    -->
                    <div class="row g-3">
                      <div class="col-12">
                        <input
                          class="form-control"
                          id={"field-line1-" + index}
                          type="text"
                          placeholder="Address Line 1"
                          value={recordData[attr.name]?.line1 || ''}
                          on:input={(e) =>{
                            const target = e.target as HTMLInputElement;
                            updateAddressField(attr.name, 'line1', target.value);
                          }}
                        />
                        <!-- updateAddressField(attr.name, 'line1', e.target.value)} -->
                      </div>
                      <div class="col-12">
                        <input
                          class="form-control"
                          id={"field-line2-" + index}
                          type="text"
                          placeholder="Address Line 2"
                          value={recordData[attr.name]?.line2 || ''}
                          on:input={(e) => {
                            const target = e.target as HTMLInputElement;
                            updateAddressField(attr.name, 'line2', target.value);
                          }}
                        />
                      </div>
                      <div class="col-12">
                        <input
                          class="form-control"
                          id={"field-line3-" + index}
                          type="text"
                          placeholder="Address Line 3"
                          value={recordData[attr.name]?.line3 || ''}
                          on:input={(e) => {
                            const target = e.target as HTMLInputElement;
                            updateAddressField(attr.name, 'line3', target.value);
                          }}
                        />
                      </div>
                      <div class="col-md-6">
                        <input
                          class="form-control"
                          id={"field-city-" + index}
                          type="text"
                          placeholder="City"
                          value={recordData[attr.name]?.city || ''}
                          on:input={(e) => {
                            const target = e.target as HTMLInputElement;
                            updateAddressField(attr.name, 'city', target.value);
                          }}
                        />
                      </div>
                      <div class="col-md-6">
                        <input
                          class="form-control"
                          id={"field-state-" + index}
                          type="text"
                          placeholder="State"
                          value={recordData[attr.name]?.state || ''}
                          on:input={(e) => {
                            const target = e.target as HTMLInputElement;
                            updateAddressField(attr.name, 'state', target.value);
                          }}
                        />
                      </div>
                      <div class="col-md-6">
                        <input
                          class="form-control"
                          id={"field-zip-" + index}
                          type="text"
                          placeholder="ZIP Code"
                          value={recordData[attr.name]?.zip || ''}
                          on:input={(e) => {
                            const target = e.target as HTMLInputElement;
                            updateAddressField(attr.name, 'zip', target.value);
                          }}
                        />
                      </div>
                      <div class="col-md-6">
                        <input
                          class="form-control"
                          id={"field-country-" + index}
                          type="text"
                          placeholder="Country"
                          value={recordData[attr.name]?.country || ''}
                          on:input={(e) => {
                            const target = e.target as HTMLInputElement;
                            updateAddressField(attr.name, 'country', target.value);
                          }}
                        />
                      </div>
                    </div>
                  <!-- Add more field types as needed here -->
                  {:else}
                    <!-- Fallback if no known data_type -->
                    <input
                      id={"field-" + index}
                      class="form-control"
                      type="text"
                      placeholder={`Enter ${attr.name} (unrecognized type)`}
                      value={recordData[attr.name] || ''}
                      on:input={(e) => {
                        const target = e.target as HTMLInputElement;
                        updateRecord(attr.name, target.value);
                      }}
                    />
                  {/if}
                  <!-- If mandatory, display a small reminder -->
                  {#if attr.mandatory}
                    <div class="text-danger small mt-1">* Required</div>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
          <!-- Modal footer -->
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={closeModal}
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              on:click={handleSave}
            >
              {isEdit ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
  <!-- Some minimal styling so the modal layers are correct. -->
  <style>
    .modal-backdrop.show {
      z-index: 1050;
    }
    .modal.d-block {
      z-index: 1055;
    }
  </style>