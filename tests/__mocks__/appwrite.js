// tests/__mocks__/appwrite.js
// Mock do Appwrite SDK para testes

export class Client {
  setEndpoint() { return this; }
  setProject() { return this; }
}

export class Account {
  constructor() {}
}

export class Databases {
  constructor() {}
}

export class Storage {
  constructor() {}
}

export const Query = {
  orderDesc: jest.fn((field) => ({ type: 'orderDesc', field })),
  orderAsc: jest.fn((field) => ({ type: 'orderAsc', field })),
  limit: jest.fn((n) => ({ type: 'limit', value: n })),
  offset: jest.fn((n) => ({ type: 'offset', value: n })),
  equal: jest.fn((field, value) => ({ type: 'equal', field, value })),
  search: jest.fn((field, term) => ({ type: 'search', field, term })),
  greaterThanOrEqual: jest.fn((field, value) => ({ type: 'gte', field, value })),
  lessThanOrEqual: jest.fn((field, value) => ({ type: 'lte', field, value })),
  isNull: jest.fn((field) => ({ type: 'isNull', field })),
};

export const ID = {
  unique: jest.fn(() => 'mock-unique-id'),
};

export const Permission = {
  read: jest.fn(),
  write: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

export const Role = {
  any: jest.fn(),
  team: jest.fn(),
};
