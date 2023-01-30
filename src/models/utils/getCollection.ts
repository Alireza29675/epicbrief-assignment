import {
  addDoc,
  collection,
  DocumentData,
  onSnapshot,
  CollectionReference,
  getDocs,
  QuerySnapshot,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
} from '@firebase/firestore';

import firestore from '../../services/firestore';

interface IOptions {
  sync?: boolean;
}

const transformSnapshotToData = <T extends DocumentData>(
  snapshot: QuerySnapshot<T>
) => {
  return snapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });
};

class Collection<T extends DocumentData> {
  // The onReady promise
  readonly ready: Promise<void>;

  // Options
  collectionName: string;
  sync: boolean;

  // The data array and collection reference
  _data: T[] = [];
  collection: CollectionReference<T>;
  _onReadyResolve: () => void = () => {
    /* to be filled right after constructor runs */
  };

  constructor(collectionName: string, { sync = true }: IOptions) {
    this.collectionName = collectionName;
    this.sync = sync;

    // Create the collection reference based on the collection name
    if (!this.collectionName) {
      throw new Error('Collection name must be set');
    }

    this.collection = collection(
      firestore,
      this.collectionName
    ) as CollectionReference<T>;

    // Set up the onReady promise
    this.ready = new Promise((resolve) => {
      this._onReadyResolve = resolve;
    });

    // If sync is true, create a listener for the collection
    if (this.sync) {
      this.initSnapshotListener();
    } else {
      // Otherwise, just get the data once
      this.fetch();
    }
  }

  /**
   * Creates a listener for the data collection
   * and updates the data array when a change occurs
   */
  initSnapshotListener() {
    onSnapshot(this.collection, (snapshot) => {
      this._data = transformSnapshotToData(snapshot);

      // Resolve the onReady promise
      this._onReadyResolve();
    });
  }

  /**
   * One-time fetch from the collection in Firestore
   */
  async fetch() {
    const snapshot = await getDocs(this.collection);
    this._data = transformSnapshotToData(snapshot);

    // Resolve the onReady promise
    this._onReadyResolve();
  }

  get data() {
    return this._data;
  }

  async get(id: string) {
    return getDoc(doc(firestore, this.collectionName, id));
  }

  // Adds a document to the Firestore collection
  async create(data: T) {
    const doc = await addDoc(this.collection, data);
    if (!this.sync) this._data.push({ id: doc.id, ...data });
  }

  // Updates a document in the Firestore collection
  async update(id: string, data: Partial<T>) {
    await setDoc(doc(firestore, this.collectionName, id), data, {
      merge: true,
    });
    if (!this.sync) {
      const index = this._data.findIndex((item) => item.id === id);
      this._data[index] = { ...this._data[index], ...data };
    }
  }

  async delete(id: string) {
    await deleteDoc(doc(firestore, this.collectionName, id));

    // If sync is false, update the data array manually
    if (!this.sync) {
      this._data = this.data.filter((item) => item.id !== id);
    }
  }
}

const memoizedCollections: Record<string, Collection<DocumentData>> = {};

export default function getCollection<T extends DocumentData>(
  collectionName: string,
  options?: IOptions
) {
  if (memoizedCollections[collectionName]) {
    return memoizedCollections[collectionName];
  }

  const collection = new Collection<T>(collectionName, options || {});

  memoizedCollections[collectionName] = collection;

  return collection;
}
