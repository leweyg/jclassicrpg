/** Stack equivalent items while retaining source IDs for idempotent loot transfers. */
export function emptyInventory() {
    return { version: 2, items: {}, order: [] };
}

export function itemQuantity(item) {
    const quantity = item.quantity ?? 1;
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
        throw Error('Invalid item quantity');
    }
    return quantity;
}

function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
    }
    return value;
}

export function stackSignature(item) {
    const properties = Object.fromEntries(Object.entries(item).filter(([key]) => (
        !['id', 'quantity', 'sourceIds', 'sourceKind'].includes(key)
    )));
    // Preserve individually equipped, attached, unique, and explicitly non-stackable items.
    if (item.equipped || item.attached || item.unique || item.stackable === false) {
        properties.instanceId = item.id;
    }
    return JSON.stringify(stableValue(properties));
}

function appendStack(inventory, item) {
    const signature = stackSignature(item);
    const existing = inventory.order
        .map(id => inventory.items[id])
        .find(stack => stackSignature(stack) === signature);
    if (existing) {
        const quantity = existing.quantity + item.quantity;
        if (!Number.isSafeInteger(quantity)) throw Error('Inventory quantity is too large');
        existing.quantity = quantity;
        existing.sourceIds.push(...item.sourceIds);
        return existing;
    }
    if (inventory.order.length >= 4096) throw Error('Inventory is full');
    inventory.items[item.id] = item;
    inventory.order.push(item.id);
    return item;
}

export function grantInventoryItem(inventory, item) {
    if (inventory.order.some(id => inventory.items[id].sourceIds.includes(item.id))) return;
    return appendStack(inventory, {
        ...structuredClone(item),
        quantity: itemQuantity(item),
        sourceIds: [item.id],
    });
}

/** Accept old instance inventories and normalize both old and current portable saves. */
export function normalizeInventory(input) {
    if (
        !input || (input.version !== undefined && input.version !== 2)
        || !input.items || typeof input.items !== 'object' || Array.isArray(input.items)
        || !Array.isArray(input.order) || input.order.length > 10000
        || new Set(input.order).size !== input.order.length
        || Object.keys(input.items).length !== input.order.length
    ) {
        throw Error('Invalid inventory');
    }
    const inventory = emptyInventory(), sources = new Set();
    for (const id of input.order) {
        const item = input.items[id];
        if (!item || item.id !== id || typeof id !== 'string' || !id
            || typeof item.typeId !== 'string' || !item.typeId) {
            throw Error('Invalid inventory item');
        }
        const sourceIds = item.sourceIds ?? (input.version === undefined ? [id] : null);
        if (!Array.isArray(sourceIds) || !sourceIds.length || !sourceIds.includes(id)) {
            throw Error('Invalid inventory sources');
        }
        for (const source of sourceIds) {
            if (typeof source !== 'string' || !source || sources.has(source)) {
                throw Error('Duplicate or invalid inventory source');
            }
            sources.add(source);
        }
        if (sources.size > 10000) throw Error('Inventory source limit exceeded');
        appendStack(inventory, {
            ...structuredClone(item),
            quantity: itemQuantity(item),
            sourceIds: [...sourceIds],
        });
    }
    return inventory;
}

export function inventoryCount(inventory, typeId) {
    return inventory.order.reduce((count, id) => {
        const item = inventory.items[id];
        return count + (item.typeId === typeId ? itemQuantity(item) : 0);
    }, 0);
}
