// store.test.ts

import { Store } from '../store';

describe('Store Operations', () => {
  let store;

  beforeEach(() => {
    // Initialize a new instance of Store before each test.
    store = new Store();
  });

  test('should initialize with an empty state', () => {
    expect(store.getState()).toEqual({});
  });

  test('should add an item to the store', () => {
    const item = { id: 1, name: 'Item 1' };
    store.addItem(item);
    expect(store.getState()).toEqual({ 1: item });
  });

  test('should update an existing item in the store', () => {
    const item = { id: 1, name: 'Item 1' };
    store.addItem(item);
    const updatedItem = { id: 1, name: 'Updated Item 1' };
    store.updateItem(updatedItem);
    expect(store.getState()).toEqual({ 1: updatedItem });
  });

  test('should remove an item from the store', () => {
    const item = { id: 1, name: 'Item 1' };
    store.addItem(item);
    store.removeItem(1);
    expect(store.getState()).toEqual({});
  });

  test('should return undefined for a non-existing item', () => {
    expect(store.getItem(999)).toBeUndefined();
  });

  test('should get an existing item from the store', () => {
    const item = { id: 1, name: 'Item 1' };
    store.addItem(item);
    expect(store.getItem(1)).toEqual(item);
  });
});