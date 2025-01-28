import { writable } from 'svelte/store';

interface FilterValue {
    [field: string]: string[];
}

interface FilterValues {
    [entityType: string]: FilterValue;
}

interface FilterState {
    values: FilterValues;
    visible: boolean;
}

export const filterStore = writable<FilterState>({
    values: {},
    visible: false
});

export const filterActions = {
    addFilter: (entityType: string, field: string, value: string) => {
        filterStore.update(state => {
            const entityFilters = state.values[entityType] || {};
            const fieldValues = entityFilters[field] || [];

            if (!fieldValues.includes(value)) {
                const updatedValues = {
                    ...state.values,
                    [entityType]: {
                        ...entityFilters,
                        [field]: [...fieldValues, value]
                    }
                };

                saveFiltersToStorage(updatedValues);

                return {
                    values: updatedValues,
                    visible: true
                };
            }
            return state;
        });
    },

    removeFilter: (entityType: string, field: string, value: string) => {
        filterStore.update(state => {
            if (!state.values[entityType] || !state.values[entityType][field]) {
                return state;
            }

            const updatedEntityFilters = { ...state.values[entityType] };
            updatedEntityFilters[field] = updatedEntityFilters[field].filter(v => v !== value);

            if (updatedEntityFilters[field].length === 0) {
                delete updatedEntityFilters[field];
            }

            const updatedValues = { ...state.values };

            if (Object.keys(updatedEntityFilters).length === 0) {
                delete updatedValues[entityType];
            } else {
                updatedValues[entityType] = updatedEntityFilters;
            }

            const hasFilters = Object.values(updatedValues).some(entityFilters =>
                Object.values(entityFilters).some(arr => arr.length > 0)
            );

            saveFiltersToStorage(updatedValues);

            return {
                values: updatedValues,
                visible: hasFilters
            };
        });
    },

    clearEntityFilters: (entityType: string) => {
        filterStore.update(state => {
            const updatedValues = { ...state.values };
            delete updatedValues[entityType];

            const hasFilters = Object.values(updatedValues).some(entityFilters =>
                Object.values(entityFilters).some(arr => arr.length > 0)
            );

            saveFiltersToStorage(updatedValues);

            return {
                values: updatedValues,
                visible: hasFilters
            };
        });
    },

    clearAllFilters: () => {
        filterStore.set({
            values: {},
            visible: false
        });
        localStorage.removeItem('FilterData');
    }
};

export const formatLabel = (key: string): string => {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const saveFiltersToStorage = (filters: FilterValues): void => {
    localStorage.setItem('FilterData', JSON.stringify(filters));
};

export const loadFiltersFromStorage = (): void => {
    try {
        const storedFilters = localStorage.getItem('FilterData');
        if (storedFilters) {
            const parsedFilters = JSON.parse(storedFilters);
            const hasFilters = Object.values(parsedFilters).some(
                (entityFilters: any) => Object.values(entityFilters).some(
                    (values: any) => values.length > 0
                )
            );

            filterStore.set({
                values: parsedFilters,
                visible: hasFilters
            });
        }
    } catch (error) {
        console.error('Error loading filters from storage:', error);
        filterStore.set({
            values: {},
            visible: false
        });
    }
};