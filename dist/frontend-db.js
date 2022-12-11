(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
   typeof define === 'function' && define.amd ? define(factory) :
   (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.FrontendDB = factory());
})(this, (function () { 'use strict';

   function intersection(a, b) {
     // If intersecting an array with undefined, return that array as it is.
     if (!b) {
       return a;
     }
     var intersectionArray = [];
     var setA = new Set(a);
     b.forEach(function (key) {
       if (setA.has(key)) {
         intersectionArray.push(key);
       }
     });
     return intersectionArray;
   }
   const PUBLIC_METHOD_NAMES = ['getIndexes', 'copy', 'addRecord', 'clearAllRecords', 'getRecord', 'getAllRecords', 'getAllKeys', 'getAllRecordsWithKeys', 'existsRecord', 'deleteRecord', 'updateRecord', 'searchRecords', 'searchRecordsAdvanced'];
   class FrontendDBStore {
     // Public methods

     constructor(db, name, schema) {
       this.db = db;
       this.name = name;
       this.schema = schema;
       this.idbObjectStore = null;
       this.definePublicMethods();
     }
     definePublicMethods() {
       for (var methodName of PUBLIC_METHOD_NAMES) {
         this[methodName] = this.db.getPublicMethodFunction(this['_' + methodName], this);
       }
     }
     async _prepare(mode = 'readonly') {
       this.idbObjectStore = await this.db.getIDBObjectStore(this.name, mode);
     }
     async _getIndexes() {
       await this._prepare();
       return this.idbObjectStore.indexNames;
     }
     async _copy(newStoreName) {
       await this._prepare();

       // Create an empty store with its autoIncrement and indexes both obtained
       // from this calling store.
       var newEmptyStore = await this.db._createStore(newStoreName, {}, this.idbObjectStore.autoIncrement, this.idbObjectStore.indexNames);
       var recordsWithKeys = await this._getAllRecordsWithKeys();
       for (var recordWithKey of recordsWithKeys) {
         await newEmptyStore._addRecord(recordWithKey[1], recordWithKey[0]);
       }
       return newEmptyStore;
     }
     _addRecord(record, key) {
       return new Promise(async (resolve, reject) => {
         await this._prepare('readwrite');
         try {
           var request = this.idbObjectStore.add(record, key);
           request.onsuccess = e => {
             resolve(e.target.result);
           };
           request.onerror = e => {
             reject(e.target.error);
           };
         } catch (e) {
           reject(e);
         }
       });
     }
     async _clearAllRecords() {
       await this._prepare('readwrite');
       return new Promise(async (resolve, reject) => {
         try {
           var request = this.idbObjectStore.clear();
           request.onsuccess = e => {
             resolve();
           };
           request.onerror = e => {
             reject(e.target.error);
           };
         } catch (e) {
           reject(e);
         }
       });
     }
     _getRecord(key) {
       return new Promise(async (resolve, reject) => {
         await this._prepare();
         var request = this.idbObjectStore.get(key);
         request.onsuccess = e => {
           var record = e.target.result;
           if (record !== undefined) {
             resolve(record);
           } else {
             reject(new DOMException(`Key '${key}' doesn't exist in store '${this.name}'. To add a record with this key, use addRecord().`));
           }
         };
         request.onerror = e => {
           reject(e.target.error);
         };
       });
     }
     _getAllRecords() {
       return new Promise(async (resolve, reject) => {
         await this._prepare();
         var request = this.idbObjectStore.getAll();
         request.onsuccess = e => {
           var records = e.target.result;
           resolve(records);
         };
         request.onerror = e => {
           reject(e.target.error);
         };
       });
     }
     _getAllKeys() {
       return new Promise(async (resolve, reject) => {
         await this._prepare();
         var request = this.idbObjectStore.getAllKeys();
         request.onsuccess = e => {
           var keys = e.target.result;
           resolve(keys);
         };
         request.onerror = e => {
           reject(e.target.error);
         };
       });
     }
     async _getAllRecordsWithKeys() {
       var records = await this._getAllRecords();
       var keys = await this._getAllKeys();
       return records.map((record, i) => [keys[i], record]);
     }
     async _existsRecord(key) {
       try {
         await this._getRecord(key);
         return true;
       } catch (e) {
         return false;
       }
     }
     _deleteRecord(key) {
       return new Promise(async (resolve, reject) => {
         // If there is no record with the given key, throw an error.
         if (!(await this._existsRecord(key))) {
           reject(new DOMException(`Key '${key}' doesn't exist in store '${this.name}'. To add a record with this key, use addRecord().`));
           return;
         }
         await this._prepare('readwrite');
         var request = this.idbObjectStore.delete(key);
         request.onsuccess = e => {
           resolve();
         };
         request.onerror = e => {
           reject(e.target.error);
         };
       });
     }
     _updateRecord(key, newDetails) {
       return new Promise(async (resolve, reject) => {
         // If there is no record with the given key, throw an error.
         if (!(await this._existsRecord(key))) {
           reject(new DOMException(`Key '${key}' doesn't exist in store '${this.name}'. To add a record with this key, use addRecord().`));
           return;
         }
         if (typeof newDetails !== 'object') {
           reject(new DOMException(`Second argument to updateRecord() must be an object. Currently, a '${typeof newDetails}' was provided.`));
           return;
         }

         // First we need to obtain the object already stored in the given key.
         var record = await this._getRecord(key);
         var newRecord = Object.assign(record, newDetails);
         await this._prepare('readwrite');
         var request = this.idbObjectStore.put(newRecord, key);
         request.onsuccess = e => {
           resolve();
         };
         request.onerror = e => {
           reject(e.target.error);
         };
       });
     }
     _searchRecords(prop, searcher, recordsInstead = false) {
       return new Promise(async (resolve, reject) => {
         var isPropIndex = (await this._getIndexes()).contains(prop);
         await this._prepare();
         var matchingKeysOrRecords = await searcher.run(this.idbObjectStore, prop, isPropIndex, recordsInstead);
         resolve(matchingKeysOrRecords);
       });
     }
     async _searchRecordsAdvanced(filters, recordsInstead = false) {
       var matchingKeys;
       for (var prop in filters) {
         var searcher = filters[prop];
         var localMatchingKeys = await this._searchRecords(prop, searcher);
         matchingKeys = intersection(localMatchingKeys, matchingKeys);
       }
       if (!recordsInstead) {
         return matchingKeys;
       }
       var matchingRecords = [];
       for (var matchingKey of matchingKeys) {
         matchingRecords.push(await this._getRecord(matchingKey));
       }
       return matchingRecords;
     }
   }

   class DatabaseSearcher {
     constructor(isIndexSearchCompatible, arg, arg2) {
       this.isIndexSearchCompatible = isIndexSearchCompatible;
       if (arg instanceof IDBKeyRange) {
         this.idbKeyRange = arg;
         this.recordMatcher = arg2;
       } else {
         this.recordMatcher = arg;
       }
     }
     runForIndexing(idbObjectStore, prop, recordsInstead) {
       return new Promise((resolve, reject) => {
         var request = idbObjectStore.index(prop)[recordsInstead ? 'getAll' : 'getAllKeys'](this.idbKeyRange);
         request.onsuccess = function (e) {
           resolve(e.target.result);
         };
         request.onerror = function (e) {
           reject(e);
         };
       });
     }
     runForLinearSearch(idbObjectStore, prop, recordsInstead) {
       return new Promise((resolve, reject) => {
         var matches = [];
         var cursor = idbObjectStore.openCursor();
         cursor.onsuccess = async e => {
           var internalCursor = e.target.result;
           if (internalCursor) {
             var recordDoesMatch = this.recordMatcher(prop, internalCursor.value);
             if (recordDoesMatch) {
               matches.push(recordsInstead ? internalCursor.value : internalCursor.key);
             }
             internalCursor.continue();
           } else {
             resolve(matches);
           }
         };
         cursor.onerror = e => {
           reject(e);
         };
       });
     }
     async run(idbObjectStore, prop, isPropIndex, recordsInstead) {
       var matches;
       if (isPropIndex && this.isIndexSearchCompatible) {
         matches = await this.runForIndexing(idbObjectStore, prop, recordsInstead);
       } else {
         matches = await this.runForLinearSearch(idbObjectStore, prop, recordsInstead);
       }
       return matches;
     }
   }
   function valueCheckingWrapper(searcherFunction, recordMatcher) {
     return function (value) {
       if (typeof value === 'number' || typeof value === 'string') {
         return new DatabaseSearcher(true, searcherFunction(value), recordMatcher.bind(null, value));
       } else {
         throw new DOMException(`${searcherFunction.name}() can only be called with a number or a string.`);
       }
     };
   }
   const isGreaterThan = valueCheckingWrapper(function isGreaterThan(value) {
     return IDBKeyRange.lowerBound(value, true);
   }, (value, prop, record) => record[prop] > value);
   const isGreaterThanEqualTo = valueCheckingWrapper(function isGreaterThanEqualTo(value) {
     return IDBKeyRange.lowerBound(value);
   }, (value, prop, record) => record[prop] >= value);
   const isLessThan = valueCheckingWrapper(function isLessThan(value) {
     return IDBKeyRange.upperBound(value, true);
   }, (value, prop, record) => record[prop] < value);
   const isLessThanEqualTo = valueCheckingWrapper(function isLessThanEqualTo(value) {
     return IDBKeyRange.upperBound(value);
   }, (value, prop, record) => record[prop] <= value);
   const isEqualTo = valueCheckingWrapper(function isEqualTo(value) {
     return IDBKeyRange.only(value);
   }, (value, prop, record) => record[prop] === value);
   function isLike(value, caseInsensitive = false) {
     // Only string values can be provided, hence, if the value argument is not a
     // a string, throw an error rightaway.
     if (typeof value !== 'string') {
       throw new DOMException(`isLike() can only be called with strings.`);
     }

     // Convert the given value into a regular expression.
     // The rule is as follows. Any sequence of % is converted into .*, since %
     // means any piece of text (including an empty one).
     var pattern = new RegExp('^' + value.replace(/%+/g, '.*') + '$', caseInsensitive ? 'i' : '');
     return new DatabaseSearcher(false, function (prop, record) {
       return pattern.test(record[prop]);
     });
   }
   function hasKeys(...args) {
     return new DatabaseSearcher(false, function (prop, record) {
       var obj = record[prop];
       for (var arg of args) {
         if (!(arg in obj)) {
           return false;
         }
       }
       return true;
     });
   }

   /**
    * Wrapper over IndexedDB.
    */
   class FrontendDB {
     static openConnections = [];

     /**
      * Opens a new connection to the given database. If the database doesn't
      * exist already, a new one is created. Otherwise, the existing database is
      * returned back (asynchronously). This is purely the default behavior of
      * the IndexedDB API's open() method.
      */
     static open(dbName) {
       if (FrontendDB.openConnections.includes(dbName)) {
         throw new DOMException(`Connection to database '${dbName}' already exists. A connection to a database must be closed before a new one can be opened.`);
       }
       FrontendDB.openConnections.push(dbName);
       return new Promise((resolve, reject) => {
         var request = indexedDB.open(dbName);
         request.onsuccess = function (e) {
           resolve(new FrontendDB(e.target.result));
         };
         request.onerror = function (e) {
           reject(e);
         };
       });
     }
     static async exists(dbName) {
       var databaseInfoList = await indexedDB.databases();
       return databaseInfoList.some(database => database.name === dbName);
     }
     databaseActions = [];
     processingOn = false;
     resolvingActionPromise = false;

     // Public actions

     constructor(idb) {
       this.idb = idb;
       this.name = idb.name;
       this.storeNames = idb.objectStoreNames;
       this.stores = {};
       this.deleted = false;
       this.closed = false;
       this.definePublicMethods();
     }
     definePublicMethods() {
       this.delete = this.getPublicMethodFunction(this._delete);
       this.existsStore = this.getPublicMethodFunction(this._existsStore);
       this.createStore = this.getPublicMethodFunction(this._createStore);
       this.getStore = this.getPublicMethodFunction(this._getStore);
       this.deleteStore = this.getPublicMethodFunction(this._deleteStore);
     }
     getPublicMethodFunction(internalFunction, store) {
       var _this = this;
       return function () {
         var databaseAction = {};
         var promise = new Promise((resolve, reject) => {
           databaseAction = {
             function: internalFunction,
             store: store,
             arguments: Array.prototype.slice.call(arguments),
             resolve: resolve,
             reject: reject
           };
         });
         _this.queueDatabaseAction(databaseAction);
         return promise;
       };
     }
     processNextDatabaseActionWhenFree() {
       setTimeout(async () => {
         var databaseAction = this.databaseActions.shift();
         try {
           var returnValue = await databaseAction.function.apply(
           // If the action has an associated store, we ought to invoke its 
           // corresponding function with 'this' configured to that very
           // DatabaseStore instance.
           databaseAction.store || this, databaseAction.arguments);
           this.resolvingActionPromise = true;
           databaseAction.resolve(returnValue);
         } catch (e) {
           databaseAction.reject(e);
         } finally {
           setTimeout(() => {
             this.resolvingActionPromise = false;
             if (!this.databaseActions.length) {
               this.processingOn = false;
             } else {
               this.processNextDatabaseActionWhenFree();
             }
           }, 0);
         }
       }, 0);
     }
     queueDatabaseAction(databaseAction) {
       if (!this.resolvingActionPromise) {
         this.databaseActions.push(databaseAction);
       } else {
         this.databaseActions.unshift(databaseAction);
       }
       if (!this.processingOn) {
         this.processingOn = true;
         this.processNextDatabaseActionWhenFree();
       }
     }
     throwIfDeletedOrClosed() {
       if (this.deleted) {
         throw new DOMException(`The underlying IndexedDB database '${this.name}' has been deleted. You'll have to create the database using Database.open(), and then use the returned Database instance to perform any further actions on the underlying database.`);
       }
       if (this.closed) {
         throw new DOMException(`The underlying IndexedDB database '${this.name}' has been closed. You'll have to open a new connection using Database.open(), and then use the returned Database instance to perform any further actions on the underlying database.`);
       }
     }
     removeFromOpenConnections() {
       FrontendDB.openConnections.splice(FrontendDB.openConnections.indexOf(this.name), 1);
     }
     close() {
       this.throwIfDeletedOrClosed();
       this.removeFromOpenConnections();
       this.idb.close();
     }
     _delete() {
       this.throwIfDeletedOrClosed();
       return new Promise((resolve, reject) => {
         // The close() method here is necessary because, as stated in the spec,
         // if the underlying IndexedDB database has open connections (that don't
         // close in response to the versionchange event triggered by
         // deleteDatabase()), the deletion of the database, and likewise, it's
         // 'success' event would be blocked until the closure happens.
         this.close();
         var request = indexedDB.deleteDatabase(this.name);
         request.onsuccess = e => {
           this.removeFromOpenConnections();
           this.idb = null;
           this.stores = {};
           this.deleted = true;
           resolve();
         };
         request.onerror = e => {
           reject(e.target.error);
         };
       });
     }
     _versionChange(versionChangeHandler) {
       return new Promise((resolve, reject) => {
         this.close();
         var request = indexedDB.open(this.name, this.idb.version + 1);
         request.onupgradeneeded = e => {
           this.idb = e.target.result;
           try {
             var returnValue = versionChangeHandler();
             this.storeNames = this.idb.objectStoreNames;
             e.target.transaction.oncomplete = function (e) {
               resolve(returnValue);
             };
           } catch (e) {
             reject(e);
           }
         };
         request.onerror = function (e) {
           reject(e);
         };
       });
     }
     createIDBStore(storeName, autoIncrementOrKeyPath, indexes) {
       var options = {};
       if (typeof autoIncrementOrKeyPath === 'boolean') {
         options.autoIncrement = autoIncrementOrKeyPath;
       } else if (typeof autoIncrementOrKeyPath === 'string') {
         options.keyPath = autoIncrementOrKeyPath;
       }
       var store = this.idb.createObjectStore(storeName, options);

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
     async _createStore(storeName, schema, autoIncrementOrKeyPath, indexes) {
       this.throwIfDeletedOrClosed();
       await this._versionChange(this.createIDBStore.bind(this, storeName, autoIncrementOrKeyPath, indexes));
       var dbStore = new FrontendDBStore(this, storeName, schema);
       this.stores[storeName] = dbStore;
       return dbStore;
     }
     async getIDBObjectStore(storeName, mode) {
       return this.idb.transaction(storeName, mode).objectStore(storeName);
     }

     // When a request is made to obtain a store, via this method, only then must
     // the internal stores map be populated with a DatabaseStore instance for
     // that IndexedDB object store. Hence, we could say that our computation of
     // stores is 'lazy'.
     async _getStore(storeName) {
       this.throwIfDeletedOrClosed();
       if (this.existsStore(storeName)) {
         if (!this.stores[storeName]) {
           this.stores[storeName] = new FrontendDBStore(this, storeName);
         }
         return this.stores[storeName];
       }
       throw new DOMException(`Object store '${storeName}' doesn't exist. Create it first using createStore().`);
     }
     deleteIDBObjectStore(storeName) {
       return this.idb.deleteObjectStore(storeName);
     }
     async _deleteStore(storeName) {
       this.throwIfDeletedOrClosed();
       await this._versionChange(this.deleteIDBObjectStore.bind(this, storeName));
       delete this.stores[storeName];
     }
     async _existsStore(storeName) {
       this.throwIfDeletedOrClosed();
       return this.storeNames.contains(storeName);
     }
   }

   FrontendDB.isGreaterThan = isGreaterThan, FrontendDB.isGreaterThanEqualTo = isGreaterThanEqualTo;
   FrontendDB.isLessThan = isLessThan;
   FrontendDB.isLessThanEqualTo = isLessThanEqualTo;
   FrontendDB.isEqualTo = isEqualTo;
   FrontendDB.isLike = isLike;
   FrontendDB.hasKeys = hasKeys;
   FrontendDB.FrontendDBStore = FrontendDBStore;

   return FrontendDB;

}));
