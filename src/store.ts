import Database from '.';
import DatabaseSearcher from './searcher';

function intersection(a, b)
{
   // If intersecting an array with undefined, return that array as it is.
   if (!b) {
      return a;
   }

   var intersectionArray: any[] = []
   var setA = new Set(a);

   b.forEach(function(key) {
      if (setA.has(key)) {
         intersectionArray.push(key);
      }
   });

   return intersectionArray;
}

class DatabaseStore 
{
   private db: Database;
   private schema?: Object;
   private idbObjectStore: IDBObjectStore | null;
   private name: string;

   constructor(db: Database, name: string, schema?: Object)
   {
      this.db = db;
      this.name = name;
      this.schema = schema;
      this.idbObjectStore = null;
   }

   private prepare(mode: IDBTransactionMode = 'readonly')
   {
      this.idbObjectStore = this.db.getIDBObjectStore(this.name, mode);
   }

   getIndexes(): DOMStringList
   {
      this.prepare();
      return this.idbObjectStore!.indexNames;
   }

   async copy(newStoreName: string)
   {
      this.prepare();

      // Create an empty store with its autoIncrement and indexes both obtained
      // from this calling store.
      var newEmptyStore = await this.db.createStore(
         newStoreName,
         {},
         this.idbObjectStore!.autoIncrement,
         (this.idbObjectStore!.indexNames)
      );
      var recordsWithKeys = await this.getAllRecordsWithKeys();

      for (var recordWithKey of recordsWithKeys) {
         await newEmptyStore.addRecord(recordWithKey[1], recordWithKey[0]);
      }

      return newEmptyStore;
   }

   addRecord(record: Object, key?: IDBValidKey): Promise<IDBValidKey | false>
   {
      this.prepare('readwrite');

      return new Promise(async (resolve, reject) => {
         try {
            var request = this.idbObjectStore!.add(record, key);
            request.onsuccess = (e) => {
               resolve((e.target as IDBRequest).result);
            }
            request.onerror = (e) => {
               reject((e.target as IDBRequest).error);
            }
         }
         catch (e) {
            reject(e);
         }
      });
   }

   async clearAllRecords(): Promise<void>
   {
      this.prepare('readwrite');

      return new Promise(async (resolve, reject) => {
         try {
            var request = this.idbObjectStore!.clear();
            request.onsuccess = (e) => {
               resolve();
            }
            request.onerror = (e) => {
               reject((e.target as IDBRequest).error);
            }
         }
         catch (e) {
            reject(e);
         }
      });
   }

   getRecord(key: IDBValidKey): Promise<object>
   {
      this.prepare();

      return new Promise(async (resolve, reject) => {
         var request = this.idbObjectStore!.get(key);

         request.onsuccess = (e) => {
            var record = (e.target as IDBRequest).result;
            if (record !== undefined) {
               resolve(record);
            }
            else {
               reject(new DOMException(`Key '${key}' doesn't exist in store '${this.name}'. To add a record with this key, use addRecord().`))
            }
         }
         request.onerror = (e) => {
            reject((e.target as IDBRequest).error);
         }
      });
   }

   getAllRecords(): Promise<object[]>
   {
      this.prepare();

      return new Promise(async (resolve, reject) => {
         var request = this.idbObjectStore!.getAll();

         request.onsuccess = (e) => {
            var records = (e.target as IDBRequest).result;
            resolve(records);
         }
         request.onerror = (e) => {
            reject((e.target as IDBRequest).error);
         }
      });
   }

   getAllKeys(): Promise<IDBValidKey[]>
   {
      this.prepare();

      return new Promise(async (resolve, reject) => {
         var request = this.idbObjectStore!.getAllKeys();

         request.onsuccess = (e) => {
            var keys = (e.target as IDBRequest).result;
            resolve(keys);
         }
         request.onerror = (e) => {
            reject((e.target as IDBRequest).error);
         }
      });
   }

   async getAllRecordsWithKeys(): Promise<[IDBValidKey, object][]>
   {
      var records = await this.getAllRecords();
      var keys = await this.getAllKeys();

      return records.map((record, i) => [keys[i], record]);
   }

   async existsRecord(key: IDBValidKey)
   {
      try {
         await this.getRecord(key);
         return true;
      }
      catch (e) {
         return false;
      }
   }

   deleteRecord(key: IDBValidKey): Promise<void>
   {
      return new Promise(async (resolve, reject) => {
         // If there is no record with the given key, throw an error.
         if (!await this.existsRecord(key)) {
            reject(new DOMException(`Key '${key}' doesn't exist in store '${this.name}'. To add a record with this key, use addRecord().`));
            return;
         }

         this.prepare('readwrite');

         var request = this.idbObjectStore!.delete(key);
         request.onsuccess = (e) => {
            resolve();
         }
         request.onerror = (e) => {
            reject((e.target as IDBRequest).error);
         }
      });
   }

   updateRecord(key: IDBValidKey, newDetails: object): Promise<void>
   {
      return new Promise(async (resolve, reject) => {
         // If there is no record with the given key, throw an error.
         if (!await this.existsRecord(key)) {
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
         var request = this.idbObjectStore!.put(newRecord, key);
         request.onsuccess = (e) => {
            resolve();
         }
         request.onerror = (e) => {
            reject((e.target as IDBRequest).error);
         }
      });
   }

   searchRecords(
      prop: string,
      searcher: DatabaseSearcher,
      recordsInstead: boolean = false
   ): Promise<any[]>
   {
      var isPropIndex = this.getIndexes().contains(prop);
      this.prepare();

      return new Promise(async (resolve, reject) => {
         var matchingKeysOrRecords = await searcher.run(this.idbObjectStore!, prop, isPropIndex, recordsInstead);
         resolve(matchingKeysOrRecords);
      });
   }

   async searchRecordsAdvanced(
      filters: {[key: number]: DatabaseSearcher},
      recordsInstead: boolean = false
   ): Promise<any[]>
   {
      var matchingKeys;

      for (var prop in filters) {
         var searcher = filters[prop];
         var localMatchingKeys: IDBValidKey[] = await this.searchRecords(prop, searcher);
         matchingKeys = intersection(localMatchingKeys, matchingKeys);
      }

      if (!recordsInstead) {
         return matchingKeys;
      }

      var matchingRecords: any[] = [];
      for (var matchingKey of matchingKeys) {
         matchingRecords.push(await this.getRecord(matchingKey));
      }
      return matchingRecords;
   }
}

export default DatabaseStore;