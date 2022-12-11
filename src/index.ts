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


type DatabaseAction = {
   function: Function;
   store?: FrontendDBStore
   arguments: [];
   resolve: Function,
   reject: Function
}


class FrontendDB
{
   private static openConnections: string[] = [];

   /**
    * Opens a new connection to the given database. If the database doesn't
    * exist already, a new one is created. Otherwise, the existing database is
    * returned back (asynchronously). This is purely the default behavior of
    * the IndexedDB API's open() method.
    */
   static open(dbName: string): Promise<FrontendDB>
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

   static async exists(dbName: string): Promise<boolean>
   {
      var databaseInfoList = await indexedDB.databases();
      return databaseInfoList.some(database => database.name === dbName);
   }


   private idb: IDBDatabase | null;
   private name: string;
   private storeNames: DOMStringList;
   private stores: { [key: string]: FrontendDBStore };
   private deleted: boolean;
   private closed: boolean;
   private databaseActions: DatabaseAction[] = [];
   private processingOn = false;
   private resolvingActionPromise = false;

   // Public actions
   public delete: Function;
   public existsStore: Function;
   public createStore: Function;
   public getStore: Function;
   public deleteStore: Function;


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


   definePublicMethods()
   {
      this.delete = this.getPublicMethodFunction(this._delete);
      this.existsStore = this.getPublicMethodFunction(this._existsStore);
      this.createStore = this.getPublicMethodFunction(this._createStore);
      this.getStore = this.getPublicMethodFunction(this._getStore);
      this.deleteStore = this.getPublicMethodFunction(this._deleteStore);
   }


   getPublicMethodFunction(internalFunction: Function, store?: FrontendDBStore)
   {
      var _this = this;
      return function() {
         var databaseAction: DatabaseAction = {} as DatabaseAction;
         var promise = new Promise((resolve, reject) => {
            databaseAction = {
               function: internalFunction,
               store: store,
               arguments: Array.prototype.slice.call(arguments),
               resolve: resolve,
               reject: reject
            }
         });
         _this.queueDatabaseAction(databaseAction);
         return promise;
      }
   }


   private processNextDatabaseActionWhenFree()
   {
      setTimeout(async () => {
         var databaseAction = this.databaseActions.shift() as DatabaseAction;
         try {
            var returnValue = await databaseAction.function.apply(
               // If the action has an associated store, we ought to invoke its 
               // corresponding function with 'this' configured to that very
               // DatabaseStore instance.
               databaseAction.store || this,
               databaseAction.arguments
            );
            this.resolvingActionPromise = true;

            databaseAction.resolve(returnValue);
         }
         catch (e) {
            databaseAction.reject(e);
         }
         finally {
            setTimeout(() => {
               this.resolvingActionPromise = false;
               if (!this.databaseActions.length) {
                  this.processingOn = false;
               }
               else {
                  this.processNextDatabaseActionWhenFree();
               }
            }, 0);
         }
      }, 0);
   }


   private queueDatabaseAction(databaseAction: DatabaseAction)
   {
      if (!this.resolvingActionPromise) {
         this.databaseActions.push(databaseAction);
      }
      else {
         this.databaseActions.unshift(databaseAction);
      }

      if (!this.processingOn) {
         this.processingOn = true;
         this.processNextDatabaseActionWhenFree();
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

   close()
   {
      this.throwIfDeletedOrClosed();
      this.removeFromOpenConnections();
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

   private _versionChange(versionChangeHandler)
   {
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

      if (this.existsStore(storeName)) {
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