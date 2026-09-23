import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyInventory, grantInventoryItem, normalizeInventory, inventoryCount} from '../interactions/inventory.js';

const item = (id, extra = {}) => ({id, typeId: 'coil', quantity: 1, ...extra});

test('equivalent items store once with quantity and source IDs; replaying a grant is harmless', () => {
    const inventory = emptyInventory();
    grantInventoryItem(inventory, item('a', {quantity: 2}));
    grantInventoryItem(inventory, item('b', {sourceKind: 'another-source'}));
    grantInventoryItem(inventory, item('b'));
    assert.deepEqual(inventory.order, ['a']);
    assert.equal(inventory.items.a.quantity, 3);
    assert.deepEqual(inventory.items.a.sourceIds, ['a', 'b']);
    assert.equal(inventory.items.b, undefined);
    assert.equal(inventoryCount(inventory, 'coil'), 3);
});

test('different state and individual equipment remain separate', () => {
    const inventory = emptyInventory();
    for (const record of [
        item('plain'), item('used', {uses: 1}), item('owned', {ownerActorId: 'a'}),
        item('equipped1', {equipped: true}), item('equipped2', {equipped: true}),
        item('unique1', {unique: true}), item('unique2', {unique: true}),
        item('single1', {stackable: false}), item('single2', {stackable: false}),
    ]) grantInventoryItem(inventory, record);
    assert.equal(inventory.order.length, 9);
    grantInventoryItem(inventory, item('used2', {uses: 1}));
    assert.equal(inventory.order.length, 9);
    assert.equal(inventory.items.used.quantity, 2);
});

test('old inventories migrate in stable order and normalization is idempotent', () => {
    const old = {items: {a: item('a'), b: item('b'), c: item('c', {typeId: 'sword'})}, order: ['a','b','c']};
    const inventory = normalizeInventory(old);
    assert.deepEqual(inventory.order, ['a', 'c']);
    assert.equal(inventory.items.a.quantity, 2);
    assert.deepEqual(normalizeInventory(inventory), inventory);
    assert.equal(old.items.a.quantity, 1, 'migration does not modify the input');
});

test('invalid counts, duplicate sources and overflowing stacks are rejected', () => {
    for (const quantity of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
        assert.throws(() => normalizeInventory({items: {a: item('a', {quantity})}, order:['a']}));
    }
    assert.throws(() => normalizeInventory({version: 2, items: {
        a: item('a', {sourceIds:['a','b']}), b: item('b', {sourceIds:['b']}),
    }, order:['a','b']}), /source/);
    const inventory = emptyInventory();
    grantInventoryItem(inventory, item('a', {quantity: Number.MAX_SAFE_INTEGER}));
    assert.throws(() => grantInventoryItem(inventory, item('b')), /too large/);
    assert.deepEqual(inventory.items.a.sourceIds, ['a']);
});
