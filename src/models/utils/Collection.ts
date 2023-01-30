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

import firestore from '@/services/firestore';

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

abstract class Collection<T extends DocumentData> {
  // Override this in the child class
  protected collectionName = '';
  protected sync = true;

  // The data array and collection reference
  private _data: T[] = [];
  private collection: CollectionReference<T>;

  constructor() {
    // Create the collection reference based on the collection name
    if (!this.collectionName) {
      throw new Error('Collection name must be set');
    }

    this.collection = collection(
      firestore,
      this.collectionName
    ) as CollectionReference<T>;

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
  private initSnapshotListener() {
    onSnapshot(this.collection, (snapshot) => {
      this._data = transformSnapshotToData(snapshot);
    });
  }

  /**
   * One-time fetch from the collection in Firestore
   */
  async fetch() {
    const snapshot = await getDocs(this.collection);
    this._data = transformSnapshotToData(snapshot);
  }

  get data() {
    return this._data;
  }

  async get(id: string) {
    return getDoc(doc(firestore, this.collectionName, id));
  }

  async create(data: T) {
    const doc = await addDoc(this.collection, data);

    // If sync is false, update the data array manually
    if (doc && !this.sync) {
      this._data.push({
        id: doc.id,
        ...data,
      });
    }
  }

  async update(id: string, data: Partial<T>) {
    await setDoc(doc(firestore, this.collectionName, id), data, {
      merge: true,
    });

    // If sync is false, update the data array manually
    if (!this.sync) {
      const index = this.data.findIndex((item) => item.id === id);
      this._data[index] = {
        ...this._data[index],
        ...data,
      };
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

export default Collection;
