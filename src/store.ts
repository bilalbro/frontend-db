import FrontendDB from '.';
import DatabaseSearcher from './searcher';
import { FrontendDBStoreJSON } from './types';


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


const PUBLIC_METHOD_NAMES = [
   'getIndexes',
   'copy',
   'addRecord',
   'clearAllRecords',
   'getRecord',
   'getAllRecords',
   'getAllKeys',
   'getAllRecordsWithKeys',
   'existsRecord',
   'deleteRecord',
   'updateRecord',
   'searchRecords',
   'searchRecordsAdvanced',
   'getJSON',
   'exportToJSON',
];


class FrontendDBStore
{
   private db: FrontendDB;
   private schema?: Object;
   private idbObjectStore: IDBObjectStore | null;
   private name: string;

   // Public methods
   public getIndexes: Function;
   public copy: Function;
   public addRecord: Function;
   public clearAllRecords: Function;
   public getRecord: Function;
   public getAllRecords: Function;
   public getAllKeys: typeof this._getAllKeys;
   public getAllRecordsWithKeys: typeof this._getAllRecordsWithKeys;
   public existsRecord: Function;
   public deleteRecord: Function;
   public updateRecord: typeof this._updateRecord;
   public searchRecords: Function;
   public searchRecordsAdvanced: Function;
   public getJSON: Function;
   public exportToJSON: Function;


   constructor(db: FrontendDB, name: string, schema?: Object)
   {
      this.db = db;
      this.name = name;
      this.schema = schema;
      this.idbObjectStore = null;
      this.definePublicMethods();
   }

   private definePublicMethods()
   {
      for (var methodName of PUBLIC_METHOD_NAMES) {
         this[methodName] = FrontendDB.actionQueue.getActionWrapper(
            this['_' + methodName], this);
      }
   }

   private async _prepare(mode: IDBTransactionMode = 'readonly')
   {
      this.idbObjectStore = await this.db.getIDBObjectStore(this.name, mode);
   }

   private async _getIndexes(): Promise<DOMStringList>
   {
      await this._prepare();
      return this.idbObjectStore!.indexNames;
   }

   private async _copy(newStoreName: string)
   {
      await this._prepare();

      // Create an empty store with its autoIncrement and indexes both obtained
      // from this calling store.
      var newEmptyStore = await this.db._createStore(
         newStoreName,
         {},
         this.idbObjectStore!.autoIncrement,
         (this.idbObjectStore!.indexNames)
      );
      var recordsWithKeys = await this._getAllRecordsWithKeys();

      for (var recordWithKey of recordsWithKeys) {
         await newEmptyStore._addRecord(recordWithKey[1], recordWithKey[0]);
      }

      return newEmptyStore;
   }

   private _addRecord(record: Object, key?: IDBValidKey): Promise<IDBValidKey>
   {
      return new Promise(async (resolve, reject) => {
         await this._prepare('readwrite');
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

   private async _clearAllRecords(): Promise<void>
   {
      await this._prepare('readwrite');

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

   private _getRecord(key: IDBValidKey): Promise<object>
   {
      return new Promise(async (resolve, reject) => {
         await this._prepare();
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

   private _getAllRecords(): Promise<object[]>
   {
      return new Promise(async (resolve, reject) => {
         await this._prepare();
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

   private _getAllKeys(): Promise<IDBValidKey[]>
   {
      return new Promise(async (resolve, reject) => {
         await this._prepare();
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

   private async _getAllRecordsWithKeys(): Promise<[IDBValidKey, {[key: string]: any}][]>
   {
      var records = await this._getAllRecords();
      var keys = await this._getAllKeys();

      return records.map((record, i) => [keys[i], record]);
   }

   private async _existsRecord(key: IDBValidKey)
   {
      try {
         await this._getRecord(key);
         return true;
      }
      catch (e) {
         return false;
      }
   }

   private _deleteRecord(key: IDBValidKey): Promise<void>
   {
      return new Promise(async (resolve, reject) => {
         // If there is no record with the given key, throw an error.
         if (!await this._existsRecord(key)) {
            reject(new DOMException(`Key '${key}' doesn't exist in store '${this.name}'. To add a record with this key, use addRecord().`));
            return;
         }

         await this._prepare('readwrite');

         var request = this.idbObjectStore!.delete(key);
         request.onsuccess = (e) => {
            resolve();
         }
         request.onerror = (e) => {
            reject((e.target as IDBRequest).error);
         }
      });
   }

   private _updateRecord(key: IDBValidKey, newDetails: object): Promise<void>
   {
      return new Promise(async (resolve, reject) => {
         // If there is no record with the given key, throw an error.
         if (!await this._existsRecord(key)) {
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
         var request = this.idbObjectStore!.put(newRecord, this.idbObjectStore!.keyPath ? undefined : key);
         request.onsuccess = (e) => {
            resolve();
         }
         request.onerror = (e) => {
            reject((e.target as IDBRequest).error);
         }
      });
   }

   private _searchRecords(
      prop: string,
      searcher: DatabaseSearcher,
      recordsInstead: boolean = false
   ): Promise<any[]>
   {
      return new Promise(async (resolve, reject) => {
         var isPropIndex = (await this._getIndexes()).contains(prop);
         await this._prepare();

         var matchingKeysOrRecords = await searcher.run(this.idbObjectStore!, prop, isPropIndex, recordsInstead);
         resolve(matchingKeysOrRecords);
      });
   }

   private async _searchRecordsAdvanced(
      filters: {[key: number]: DatabaseSearcher},
      recordsInstead: boolean = false
   ): Promise<any[]>
   {
      var matchingKeys;

      for (var prop in filters) {
         var searcher = filters[prop];
         var localMatchingKeys: IDBValidKey[] = await this._searchRecords(prop, searcher);
         matchingKeys = intersection(localMatchingKeys, matchingKeys);
      }

      if (!recordsInstead) {
         return matchingKeys;
      }

      var matchingRecords: any[] = [];
      for (var matchingKey of matchingKeys) {
         matchingRecords.push(await this._getRecord(matchingKey));
      }
      return matchingRecords;
   }

   async _getJSON()
   {
      await this._prepare('readwrite');

      var exportedJSON: FrontendDBStoreJSON = {} as any;
      exportedJSON.name = this.name;
      exportedJSON.indexes = [...await this._getIndexes()];
      exportedJSON.autoIncrement = this.idbObjectStore!.autoIncrement;

      var keyPath = this.idbObjectStore!.keyPath;
      exportedJSON.keyPath = keyPath === null ? !!(keyPath) : keyPath as string;

      var recordsWithKeys = await this._getAllRecordsWithKeys();
      exportedJSON.records = recordsWithKeys;

      return exportedJSON;
   }

   private async _exportToJSON()
   {
      await FrontendDB.exportJSON(await this._getJSON());
   }

   async _restore(recordsWithKeys: [IDBValidKey, {[key: string]: any}][])
   {
      // TODO: Rectify the keyPath problem
      await this._prepare('readwrite');

      for (var recordWithKey of recordsWithKeys) {
         await this._addRecord(recordWithKey[1], this.idbObjectStore!.keyPath ? undefined : recordWithKey[0]);
      }
   }
}

export default FrontendDBStore;