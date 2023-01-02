/**
 * Wrapper over IndexedDB.
 */

import FrontendDBStore from './store';
import {
   isGreaterThan,
   isGreaterThanEqualTo,
   isLessThan,
   isLessThanEqualTo,
   isEqualTo,
   isLike,
   hasKeys
} from './searcher';
import ActionQueue from './action-queue';
import { FrontendDBJSON, FrontendDBStoreJSON } from './types';


const PUBLIC_METHOD_NAMES = [
   'close',
   'delete',
   'existsStore',
   'createStore',
   'getStore',
   'deleteStore',
   'getJSON',
   'exportToJSON',
];

const PUBLIC_STATIC_METHOD_NAMES = [
   'open',
   'exists',
   'restore',
];


class FrontendDB
{
   private static openConnections: string[] = [];
   static actionQueue = new ActionQueue();

   // Public static methods
   static open: typeof FrontendDB._open;
   static exists: Function;
   static restore: typeof FrontendDB._restore;


   static async exportJSON(json: FrontendDBJSON | FrontendDBStoreJSON)
   {
      var jsonBlob = new Blob(
         [JSON.stringify(json)],
         { type: 'application/json' }
      );

      var anchorElement = document.createElement('a');
      anchorElement.href = URL.createObjectURL(jsonBlob);
      anchorElement.download = json.name;

      document.body.appendChild(anchorElement);
      setTimeout(function() {
         anchorElement.click();
      }, 0);
   }


   private static async _restore(dbJSONString: string)
   {
      var dbJSON: FrontendDBJSON = JSON.parse(dbJSONString);

      var db = await FrontendDB._open(dbJSON.name);
      for (var i = 0; i < dbJSON.stores.length; i++) {
         var dbJSONStore = dbJSON.stores[i];

         var store = await db._createStore(
            dbJSONStore.name,
            {},
            dbJSONStore.autoIncrement || dbJSONStore.keyPath,
            dbJSONStore.indexes
         );
         await store._restore(dbJSONStore.records);
      }

      db._publicClose();
   }

   private static _open(dbName: string): Promise<FrontendDB>
   {
      if (FrontendDB.openConnections.includes(dbName)) {
         throw new DOMException(`Connection to database '${dbName}' already exists. A connection to a database must be closed before a new one can be opened.`);
      }
      FrontendDB.openConnections.push(dbName);

      return new Promise((resolve, reject) => {
         var request = indexedDB.open(dbName);
         request.onsuccess = function(e) {
            resolve(new FrontendDB((e.target as IDBRequest).result));
         }
         request.onerror = function(e) {
            reject(e);
         }
      });
   }

   private static async _exists(dbName: string): Promise<boolean>
   {
      var databaseInfoList = await indexedDB.databases();
      return databaseInfoList.some(database => database.name === dbName);
   }


   private idb: IDBDatabase | null;
   private name: string;
   private storeNames: DOMStringList;
   private stores: { [key: string]: FrontendDBStore };
   public deleted: boolean;
   private closed: boolean;

   // Public methods
   public close: Function;
   public delete: Function;
   public existsStore: Function;
   public createStore: Function;
   public getStore: Function;
   public deleteStore: Function;
   public getJSON: Function;
   public exportToJSON: Function;


   constructor(idb: IDBDatabase)
   {
      this.idb = idb;
      this.name = idb.name;
      this.storeNames = idb.objectStoreNames;
      this.stores = {};
      this.deleted = false;
      this.closed = false;
      this.definePublicMethods();
   }

   private definePublicMethods()
   {
      for (var methodName of PUBLIC_METHOD_NAMES) {
         this[methodName] = FrontendDB.actionQueue.getActionWrapper(this['_' + methodName], this);
      }
   }

   private throwIfDeletedOrClosed()
   {
      if (this.deleted) {
         throw new DOMException(`The underlying IndexedDB database '${this.name}' has been deleted. You'll have to create the database using Database.open(), and then use the returned Database instance to perform any further actions on the underlying database.`);
      }

      if (this.closed) {
         throw new DOMException(`The underlying IndexedDB database '${this.name}' has been closed. You'll have to open a new connection using Database.open(), and then use the returned Database instance to perform any further actions on the underlying database.`);
      }
   }

   private removeFromOpenConnections()
   {
      FrontendDB.openConnections.splice(FrontendDB.openConnections.indexOf(this.name), 1);
   }

   private _publicClose()
   {
      this.throwIfDeletedOrClosed();
      this.removeFromOpenConnections();
      this.closed = true;
      this._close();
   }

   private _close()
   {
      this.idb!.close();
   }

   private _delete(): Promise<void>
   {
      this.throwIfDeletedOrClosed();

      return new Promise((resolve, reject) => {
         // The close() method here is necessary because, as stated in the spec,
         // if the underlying IndexedDB database has open connections (that don't
         // close in response to the versionchange event triggered by
         // deleteDatabase()), the deletion of the database, and likewise, it's
         // 'success' event would be blocked until the closure happens.
         this._close();

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

   private _versionChange(versionChangeHandler: Function)
   {
      return new Promise((resolve, reject) => {
         this._close();

         var request = indexedDB.open(this.name, this.idb!.version + 1);
         request.onupgradeneeded = (e) => {
            this.idb = (e.target as IDBOpenDBRequest).result;
            var transaction = (e.target as IDBRequest).transaction!;
            try {
               var returnValue = versionChangeHandler();
               this.storeNames = this.idb.objectStoreNames;

               transaction.oncomplete = function(e) {
                  resolve(returnValue);
               };
            }
            catch (e) {
               reject(e);
            }
         }
         request.onerror = (e) => {
            reject(e);
         }
      });
   }

   private createIDBStore(
      storeName: string,
      autoIncrementOrKeyPath?: boolean | string | null,
      indexes?: string[]
   ): IDBObjectStore
   {
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

   // This method is deliberately made public, since it's used by the store.ts
   // file — specifically in the copy() method.
   async _createStore(
      storeName: string,
      schema?,
      autoIncrementOrKeyPath?: string | boolean | null,
      indexes?: string[] | DOMStringList
   ): Promise<FrontendDBStore>
   {
      this.throwIfDeletedOrClosed();

      await this._versionChange(
         this.createIDBStore.bind(this, storeName, autoIncrementOrKeyPath, indexes)
      );
      var dbStore = new FrontendDBStore(this, storeName, schema);
      this.stores[storeName] = dbStore;
      return dbStore;
   }

   async getIDBObjectStore(storeName: string, mode: IDBTransactionMode)
   {
      return this.idb!.transaction(storeName, mode).objectStore(storeName);
   }

   // When a request is made to obtain a store, via this method, only then must
   // the internal stores map be populated with a DatabaseStore instance for
   // that IndexedDB object store. Hence, we could say that our computation of
   // stores is 'lazy'.
   private async _getStore(storeName: string)
   {
      this.throwIfDeletedOrClosed();

      if (await this._existsStore(storeName)) {
         if (!this.stores[storeName]) {
            this.stores[storeName] = new FrontendDBStore(this, storeName);
         }
         return this.stores[storeName];
      }
      
      throw new DOMException(`Object store '${storeName}' doesn't exist. Create it first using createStore().`);
   }

   private deleteIDBObjectStore(storeName: string)
   {
      return this.idb!.deleteObjectStore(storeName);
   }

   private async _deleteStore(storeName: string)
   {
      this.throwIfDeletedOrClosed();
      await this._versionChange(this.deleteIDBObjectStore.bind(this, storeName));
      delete this.stores[storeName];
   }

   private async _existsStore(storeName: string)
   {
      this.throwIfDeletedOrClosed();
      return this.storeNames.contains(storeName);
   }

   private async _getJSON()
   {
      var dbJSON: FrontendDBJSON = {} as FrontendDBJSON;
      dbJSON.name = this.name;
      dbJSON.stores = [];

      for (var i = 0; i < this.storeNames.length; i++) {
         var store = await this._getStore(this.storeNames[i]);
         dbJSON.stores.push(await store._getJSON());
      }

      return dbJSON;
   }

   private async _exportToJSON()
   {
      await FrontendDB.exportJSON(await this._getJSON());
   }
}


for (var methodName of PUBLIC_STATIC_METHOD_NAMES) {
   FrontendDB[methodName] = FrontendDB.actionQueue.getActionWrapper(
      FrontendDB['_' + methodName], FrontendDB);
}

export {
   isGreaterThan,
   isGreaterThanEqualTo,
   isLessThan,
   isLessThanEqualTo,
   isEqualTo,
   isLike,
   hasKeys,
   FrontendDBStore
};

export default FrontendDB;