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

// This interface is used to pass options when creating a collection
interface IOptions {
  sync?: boolean; // if sync is set to true, it will listen to changes
}

// This interface is used to add any additional metadata to the data returned by the firestore
export interface IAdditionalMetadata {
  id: string;
  _createdAt: number;
  _updatedAt: number;
}

// This function is used to transform the snapshot returned by firestore
// into an array of objects so we can put in `_data`
const transformSnapshot = <T extends DocumentData>(
  snapshot: QuerySnapshot<T>
) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

export class Collection<T extends DocumentData> {
  collectionName: string;
  sync: boolean;
  collectionRef: CollectionReference<T & IAdditionalMetadata>;
  _data: Array<T & IAdditionalMetadata> = []; // private variable to store the data
  readonly ready: Promise<void>; // promise to wait for data to be initialized

  constructor(collectionName: string, { sync = true }: IOptions) {
    this.collectionName = collectionName;
    this.sync = sync;
    if (!this.collectionName) throw new Error('Collection name must be set');

    // Create a reference to the collection in firestore
    this.collectionRef = collection(
      firestore,
      this.collectionName
    ) as CollectionReference<T & IAdditionalMetadata>;

    // To be used as collection.ready.then(() => ...)
    this.ready = new Promise((resolve) => this._init(resolve));
  }

  _init = (resolve: () => void) => {
    if (this.sync) {
      this._listen(resolve);
    } else {
      this._fetch(resolve);
    }
  };

  _listen = (resolve: () => void) => {
    onSnapshot(this.collectionRef, (snapshot) => {
      this._data = transformSnapshot(snapshot);
      resolve();
    });
  };

  async _fetch(resolve: () => void) {
    const snapshot = await getDocs(this.collectionRef);
    this._data = transformSnapshot(snapshot);
    resolve();
  }

  get data() {
    return this._data;
  }

  async get(id: string) {
    return getDoc(doc(firestore, this.collectionName, id));
  }

  async create(data: T) {
    const dataWithDates = {
      ...data,
      _createdAt: Date.now(),
      _updatedAt: Date.now(),
    };

    const docRef = await addDoc(this.collectionRef, dataWithDates);
    if (!this.sync) {
      this._data.push({ id: docRef.id, ...dataWithDates });
    }
  }

  async update(id: string, data: Partial<T>) {
    const updatedData = {
      ...data,
      _updatedAt: Date.now(),
    };
    await setDoc(doc(firestore, this.collectionName, id), updatedData, {
      merge: true,
    });
    if (!this.sync) {
      const index = this._data.findIndex((item) => item.id === id);
      this._data[index] = {
        ...this._data[index],
        ...updatedData,
      };
    }
  }

  async delete(id: string) {
    await deleteDoc(doc(firestore, this.collectionName, id));
    if (!this.sync) {
      this._data = this._data.filter((item) => item.id !== id);
    }
  }
}

// Memoize collections to avoid creating multiple instances of the same collection
const memoizedCollections: Record<string, Collection<DocumentData>> = {};

export default function getCollection<T extends DocumentData>(
  collectionName: string,
  options?: IOptions
) {
  // Return memoized collection if it exists
  if (memoizedCollections[collectionName])
    return memoizedCollections[collectionName];

  // Create new collection if it doesn't exist yet
  const collection = new Collection<T>(collectionName, options || {});

  // and memoize it
  memoizedCollections[collectionName] = collection;

  return collection;
}
