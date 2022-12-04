/**
 * Wrapper over IndexedDB.
 */
import DatabaseStore from './store';
import {
   isGreaterThan,
   isGreaterThanEqualTo,
   isLessThan,
   isLessThanEqualTo,
   isEqualTo,
   isLike,
   hasKeys
} from "./searcher";

class Database {
   private static openConnections: string[] = [];

   /**
    * Opens a new connection to the given database. If the database doesn't
    * exist already, a new one is created. Otherwise, the existing database is
    * returned back (asynchronously). This is purely the default behavior of
    * the IndexedDB API's open() method.
    */
   static open(dbName: string): Promise<Database> {
      return new Promise((resolve, reject) => {
         if (Database.openConnections.includes(dbName)) {
            throw new DOMException(`Connection to database '${dbName}' already exists. A connection to a database must be closed before a new one can be opened.`)
         }

         var request = indexedDB.open(dbName);
         request.onsuccess = function(e) {
            Database.openConnections.push(dbName);
            resolve(new Database((e.target as IDBRequest).result));
         }
         request.onerror = function(e) {
            reject(e);
         }
      });
   }

   static async exists(dbName: string): Promise<boolean> {
      var databaseInfoList = await indexedDB.databases();
      return databaseInfoList.some(database => database.name === dbName);
   }

   private idb: IDBDatabase | null;
   private name: string;
   private storeNames: DOMStringList;
   private stores: { [key: string]: DatabaseStore };
   private deleted: boolean;
   private closed: boolean;

   constructor(idb: IDBDatabase) {
      this.idb = idb;
      this.name = idb.name;
      this.storeNames = idb.objectStoreNames;
      this.stores = {};
      this.deleted = false;
      this.closed = false;
   }

   throwIfDeletedOrClosedOrClosed() {
      if (this.deleted) {
         throw new DOMException(`The underlying IndexedDB database '${this.name}' has been deleted. You'll have to create the database using Database.open(), and then use the returned Database instance to perform any further actions on the underlying database.`);
      }

      if (this.closed) {
         throw new DOMException(`The underlying IndexedDB database '${this.name}' has been closed. You'll have to open a new connection using Database.open(), and then use the returned Database instance to perform any further actions on the underlying database.`);
      }
   }

   private removeFromOpenConnections() {
      Database.openConnections.splice(Database.openConnections.indexOf(this.name), 1);
   }

   close() {
      this.throwIfDeletedOrClosedOrClosed();
      this.removeFromOpenConnections();
      this.idb!.close();
   }

   delete(): Promise<void> {
      this.throwIfDeletedOrClosedOrClosed();

      return new Promise((resolve, reject) => {
         // The close() method here is necessary because, as stated in the spec,
         // if the underlying IndexedDB database has open connections (that don't
         // close in response to the versionchange event triggered by
         // deleteDatabase()), the deletion of the database, and likewise, it's
         // 'success' event would be blocked until the closure happens.
         this.close();

         var request = indexedDB.deleteDatabase(this.name);
         request.onsuccess = (e) => {
            this.removeFromOpenConnections();
            this.idb = null;
            this.stores = {};
            this.deleted = true;
            resolve();
         }
         request.onerror = (e) => {
            reject((e.target as IDBRequest).error);
         }
      });
   }

   private versionChange(versionChangeHandler): Promise<IDBObjectStore> {
      return new Promise((resolve, reject) => {
         this.close();

         var request = indexedDB.open(this.name, this.idb!.version + 1);
         request.onupgradeneeded = (e) => {
            this.idb = (e.target as IDBOpenDBRequest).result;
            try {
               var returnValue = versionChangeHandler();
               this.storeNames = this.idb.objectStoreNames;

               (e.target as IDBRequest).transaction!.oncomplete = function(e) {
                  resolve(returnValue);
               }
            }
            catch (e) {
               reject(e);
            }
         }
         request.onerror = function(e) {
            reject(e);
         }
      });
   }

   private createIDBStore(storeName: string, autoIncrementOrKeyPath?: boolean | string | null, indexes?: string[]) {
      var options: IDBObjectStoreParameters = {};
      if (typeof autoIncrementOrKeyPath === 'boolean') {
         options.autoIncrement = autoIncrementOrKeyPath;
      }
      else if (typeof autoIncrementOrKeyPath === 'string') {
         options.keyPath = autoIncrementOrKeyPath;
      }

      var store = this.idb!.createObjectStore(storeName, options);

      // If provided, create all the desired indexes on the store.
      if (indexes) {
         for (var index of indexes) {
            store.createIndex(index, index);
         }
      }
      return store;
   }

   // To create a new store in IndexedDB, a versionchange event must be fired.
   // And this can only be done by opening a connection with a newer version.
   async createStore(storeName: string, schema?, autoIncrementOrKeyPath?: string | boolean | null, indexes?: string[] | DOMStringList) {
      this.throwIfDeletedOrClosedOrClosed();

      await this.versionChange(
         this.createIDBStore.bind(this, storeName, autoIncrementOrKeyPath, indexes)
      );
      var dbStore = new DatabaseStore(this, storeName, schema);
      this.stores[storeName] = dbStore;
      return dbStore;
   }

   getIDBObjectStore(storeName: string, mode: IDBTransactionMode) {
      return this.idb!.transaction(storeName, mode).objectStore(storeName);
   }

   // When a request is made to obtain a store, via this method, only then must
   // the internal stores map be populated with a DatabaseStore instance for
   // that IndexedDB object store. Hence, we could say that our computation of
   // stores is 'lazy'.
   getStore(storeName: string) {
      this.throwIfDeletedOrClosedOrClosed();

      if (this.existsStore(storeName)) {
         if (!this.stores[storeName]) {
            this.stores[storeName] = new DatabaseStore(this, storeName);
         }
         return this.stores[storeName];
      }
      
      throw new DOMException(`Object store '${storeName}' doesn't exist. Create it first using createStore().`);
   }

   private deleteIDBObjectStore(storeName: string) {
      return this.idb!.deleteObjectStore(storeName);
   }

   async deleteStore(storeName: string) {
      this.throwIfDeletedOrClosedOrClosed();
      await this.versionChange(this.deleteIDBObjectStore.bind(this, storeName));
      delete this.stores[storeName];
   }

   existsStore(storeName: string) {
      this.throwIfDeletedOrClosedOrClosed();
      return this.storeNames.contains(storeName);
   }
}

export {
   isGreaterThan,
   isGreaterThanEqualTo,
   isLessThan,
   isLessThanEqualTo,
   isEqualTo,
   isLike,
   hasKeys,
   Database,
   DatabaseStore
};

export default Database;