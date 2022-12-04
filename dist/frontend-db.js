(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
   typeof define === 'function' && define.amd ? define(['exports'], factory) :
   (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.window = global.window || {}));
})(this, (function (exports) { 'use strict';

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
   class DatabaseStore {
     constructor(db, name, schema) {
       this.db = db;
       this.name = name;
       this.schema = schema;
       this.idbObjectStore = null;
     }
     prepare(mode = 'readonly') {
       this.idbObjectStore = this.db.getIDBObjectStore(this.name, mode);
     }
     getIndexes() {
       this.prepare();
       return this.idbObjectStore.indexNames;
     }
     async copy(newStoreName) {
       this.prepare();

       // Create an empty store with its autoIncrement and indexes both obtained
       // from this calling store.
       var newEmptyStore = await this.db.createStore(newStoreName, {}, this.idbObjectStore.autoIncrement, this.idbObjectStore.indexNames);
       var recordsWithKeys = await this.getAllRecordsWithKeys();
       for (var recordWithKey of recordsWithKeys) {
         await newEmptyStore.addRecord(recordWithKey[1], recordWithKey[0]);
       }
       return newEmptyStore;
     }
     addRecord(record, key) {
       this.prepare('readwrite');
       return new Promise(async (resolve, reject) => {
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
     async clearAllRecords() {
       this.prepare('readwrite');
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
     getRecord(key) {
       this.prepare();
       return new Promise(async (resolve, reject) => {
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
     getAllRecords() {
       this.prepare();
       return new Promise(async (resolve, reject) => {
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
     getAllKeys() {
       this.prepare();
       return new Promise(async (resolve, reject) => {
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
     async getAllRecordsWithKeys() {
       var records = await this.getAllRecords();
       var keys = await this.getAllKeys();
       return records.map((record, i) => [keys[i], record]);
     }
     async existsRecord(key) {
       try {
         await this.getRecord(key);
         return true;
       } catch (e) {
         return false;
       }
     }
     deleteRecord(key) {
       return new Promise(async (resolve, reject) => {
         // If there is no record with the given key, throw an error.
         if (!(await this.existsRecord(key))) {
           reject(new DOMException(`Key '${key}' doesn't exist in store '${this.name}'. To add a record with this key, use addRecord().`));
           return;
         }
         this.prepare('readwrite');
         var request = this.idbObjectStore.delete(key);
         request.onsuccess = e => {
           resolve();
         };
         request.onerror = e => {
           reject(e.target.error);
         };
       });
     }
     updateRecord(key, newDetails) {
       return new Promise(async (resolve, reject) => {
         // If there is no record with the given key, throw an error.
         if (!(await this.existsRecord(key))) {
           reject(new DOMException(`Key '${key}' doesn't exist in store '${this.name}'. To add a record with this key, use addRecord().`));
           return;
         }
         if (typeof newDetails !== 'object') {
           reject(new DOMException(`Second argument to updateRecord() must be an object. Currently, a '${typeof newDetails}' was provided.`));
           return;
         }

         // First we need to obtain the object already stored in the given key.
         var record = await this.getRecord(key);
         var newRecord = Object.assign(record, newDetails);
         this.prepare('readwrite');
         var request = this.idbObjectStore.put(newRecord, key);
         request.onsuccess = e => {
           resolve();
         };
         request.onerror = e => {
           reject(e.target.error);
         };
       });
     }
     searchRecords(prop, searcher, recordsInstead = false) {
       var isPropIndex = this.getIndexes().contains(prop);
       this.prepare();
       return new Promise(async (resolve, reject) => {
         var matchingKeysOrRecords = await searcher.run(this.idbObjectStore, prop, isPropIndex, recordsInstead);
         resolve(matchingKeysOrRecords);
       });
     }
     async searchRecordsAdvanced(filters, recordsInstead = false) {
       var matchingKeys;
       for (var prop in filters) {
         var searcher = filters[prop];
         var localMatchingKeys = await this.searchRecords(prop, searcher);
         matchingKeys = intersection(localMatchingKeys, matchingKeys);
       }
       if (!recordsInstead) {
         return matchingKeys;
       }
       var matchingRecords = [];
       for (var matchingKey of matchingKeys) {
         matchingRecords.push(await this.getRecord(matchingKey));
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
   class Database {
     static openConnections = [];

     /**
      * Opens a new connection to the given database. If the database doesn't
      * exist already, a new one is created. Otherwise, the existing database is
      * returned back (asynchronously). This is purely the default behavior of
      * the IndexedDB API's open() method.
      */
     static open(dbName) {
       return new Promise((resolve, reject) => {
         if (Database.openConnections.includes(dbName)) {
           throw new DOMException(`Connection to database '${dbName}' already exists. A connection to a database must be closed before a new one can be opened.`);
         }
         var request = indexedDB.open(dbName);
         request.onsuccess = function (e) {
           Database.openConnections.push(dbName);
           resolve(new Database(e.target.result));
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
     constructor(idb) {
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
     removeFromOpenConnections() {
       Database.openConnections.splice(Database.openConnections.indexOf(this.name), 1);
     }
     close() {
       this.throwIfDeletedOrClosedOrClosed();
       this.removeFromOpenConnections();
       this.idb.close();
     }
     delete() {
       this.throwIfDeletedOrClosedOrClosed();
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
     versionChange(versionChangeHandler) {
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

     // To create a new store in IndexedDB, a versionchange event must be fired.
     // And this can only be done by opening a connection with a newer version.
     async createStore(storeName, schema, autoIncrementOrKeyPath, indexes) {
       this.throwIfDeletedOrClosedOrClosed();
       await this.versionChange(this.createIDBStore.bind(this, storeName, autoIncrementOrKeyPath, indexes));
       var dbStore = new DatabaseStore(this, storeName, schema);
       this.stores[storeName] = dbStore;
       return dbStore;
     }
     getIDBObjectStore(storeName, mode) {
       return this.idb.transaction(storeName, mode).objectStore(storeName);
     }

     // When a request is made to obtain a store, via this method, only then must
     // the internal stores map be populated with a DatabaseStore instance for
     // that IndexedDB object store. Hence, we could say that our computation of
     // stores is 'lazy'.
     getStore(storeName) {
       this.throwIfDeletedOrClosedOrClosed();
       if (this.existsStore(storeName)) {
         if (!this.stores[storeName]) {
           this.stores[storeName] = new DatabaseStore(this, storeName);
         }
         return this.stores[storeName];
       }
       throw new DOMException(`Object store '${storeName}' doesn't exist. Create it first using createStore().`);
     }
     deleteIDBObjectStore(storeName) {
       return this.idb.deleteObjectStore(storeName);
     }
     async deleteStore(storeName) {
       this.throwIfDeletedOrClosedOrClosed();
       await this.versionChange(this.deleteIDBObjectStore.bind(this, storeName));
       delete this.stores[storeName];
     }
     existsStore(storeName) {
       this.throwIfDeletedOrClosedOrClosed();
       return this.storeNames.contains(storeName);
     }
   }

   exports.Database = Database;
   exports.DatabaseStore = DatabaseStore;
   exports.default = Database;
   exports.hasKeys = hasKeys;
   exports.isEqualTo = isEqualTo;
   exports.isGreaterThan = isGreaterThan;
   exports.isGreaterThanEqualTo = isGreaterThanEqualTo;
   exports.isLessThan = isLessThan;
   exports.isLessThanEqualTo = isLessThanEqualTo;
   exports.isLike = isLike;

   Object.defineProperty(exports, '__esModule', { value: true });

}));
