import {
  addDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  doc,
  DocumentData,
} from '@firebase/firestore';
import firestore from '@/services/firestore';
import getCollection, { Collection } from './getCollection';

jest.mock('@firebase/firestore', () => ({
  addDoc: jest.fn(() => Promise.resolve({ id: '1' })),
  collection: jest.fn(),
  onSnapshot: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  setDoc: jest.fn(),
  doc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@/services/firestore', () => ({}));

describe('Collection', () => {
  let collection: Collection<DocumentData>;

  beforeEach(() => {
    collection = new Collection('test', { sync: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls getDocs when sync is set to false', () => {
    expect(getDocs).toHaveBeenCalled();
  });

  it('calls onSnapshot when sync is set to true', () => {
    collection = new Collection('test', { sync: true });
    expect(onSnapshot).toHaveBeenCalled();
  });

  it('creates a new document', async () => {
    const data = { name: 'Test' };
    await collection.create(data);

    expect(addDoc).toHaveBeenCalledWith(collection.collectionRef, {
      ...data,
      _createdAt: expect.any(Number),
      _updatedAt: expect.any(Number),
    });
  });

  it('updates a document', async () => {
    const id = '1';
    const data = { name: 'Test' };
    await collection.update(id, data);

    expect(setDoc).toHaveBeenCalledWith(
      doc(firestore, collection.collectionName, id),
      {
        ...data,
        _updatedAt: expect.any(Number),
      },
      { merge: true }
    );
  });

  it('deletes a document', async () => {
    const id = '1';
    await collection.delete(id);

    expect(deleteDoc).toHaveBeenCalledWith(
      doc(firestore, collection.collectionName, id)
    );
  });
});

describe('getCollection', () => {
  it('returns the same instance of a memoized collection', () => {
    const collection1 = getCollection('test');
    const collection2 = getCollection('test');
    expect(collection1).toBe(collection2);
  });
});
