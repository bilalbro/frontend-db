import { RecordMatcherFunction, RecordMatcherFunctionWithValue } from './types';

class DatabaseSearcher
{
   isIndexSearchCompatible: boolean;
   idbKeyRange?: IDBKeyRange;
   recordMatcher?: RecordMatcherFunction;

   constructor(isIndexSearchCompatible: boolean, idbKeyRange: IDBKeyRange, recordMatcher: RecordMatcherFunction);
   constructor(isIndexSearchCompatible: boolean, recordMatcher: RecordMatcherFunction);
   constructor(isIndexSearchCompatible, arg, arg2?) {
      this.isIndexSearchCompatible = isIndexSearchCompatible;
      if (arg instanceof IDBKeyRange) {
         this.idbKeyRange = arg;
         this.recordMatcher = arg2;
      }
      else {
         this.recordMatcher = arg;
      }
   }

   runForIndexing(idbObjectStore: IDBObjectStore, prop: string, recordsInstead: boolean): Promise<any[]>
   {
      return new Promise((resolve, reject) => {
         var request = idbObjectStore.index(prop)[recordsInstead ? 'getAll' : 'getAllKeys'](this.idbKeyRange);
         request.onsuccess = function(e) {
            resolve((e.target as IDBRequest).result);
         }
         request.onerror = function(e) {
            reject(e);
         }
      });
   }

   runForLinearSearch(idbObjectStore: IDBObjectStore, prop: string, recordsInstead: boolean): Promise<any[]>
   {
      return new Promise((resolve, reject) => {
         var matches: any[] = [];
         var cursor = idbObjectStore.openCursor();

         cursor.onsuccess = async (e) => {
            var internalCursor: IDBCursorWithValue = (e.target as IDBRequest).result;
            if (internalCursor) {
               var recordDoesMatch = this.recordMatcher!(prop, internalCursor.value);
               if (recordDoesMatch) {
                  matches.push(recordsInstead ? internalCursor.value : internalCursor.key);
               }
               internalCursor.continue();
            }
            else {
               resolve(matches);
            }
         }
         cursor.onerror = (e) => {
            reject(e);
         }
      });
   }

   async run(idbObjectStore: IDBObjectStore, prop: string, isPropIndex: boolean, recordsInstead: boolean): Promise<[]>
   {
      var matches;
      if (isPropIndex && this.isIndexSearchCompatible) {
         matches = await this.runForIndexing(idbObjectStore, prop, recordsInstead);
      }
      else {
         matches = await this.runForLinearSearch(idbObjectStore, prop, recordsInstead);
      }
      return matches;
   }
}

function valueCheckingWrapper(searcherFunction: (value) => IDBKeyRange, recordMatcher: RecordMatcherFunctionWithValue)
{
   return function(value) {
      if (typeof value === 'number' || typeof value === 'string') {
         return new DatabaseSearcher(true, searcherFunction(value), recordMatcher.bind(null, value));
      }
      else {
         throw new DOMException(`${searcherFunction.name}() can only be called with a number or a string.`);
      }
   }
}

export const isGreaterThan = valueCheckingWrapper(function isGreaterThan(value) {
   return IDBKeyRange.lowerBound(value, true);
}, (value, prop, record) => record[prop] > value);

export const isGreaterThanEqualTo = valueCheckingWrapper(function isGreaterThanEqualTo(value) {
   return IDBKeyRange.lowerBound(value);
}, (value, prop, record) => record[prop] >= value);

export const isLessThan = valueCheckingWrapper(function isLessThan(value) {
   return IDBKeyRange.upperBound(value, true);
}, (value, prop, record) => record[prop] < value);

export const isLessThanEqualTo = valueCheckingWrapper(function isLessThanEqualTo(value) {
   return IDBKeyRange.upperBound(value);
}, (value, prop, record) => record[prop] <= value);

export const isEqualTo = valueCheckingWrapper(function isEqualTo(value) {
   return IDBKeyRange.only(value);
}, (value, prop, record) => record[prop] === value);

export function isLike(value: string, caseInsensitive: boolean = false) {
   // Only string values can be provided, hence, if the value argument is not a
   // a string, throw an error rightaway.
   if (typeof value !== 'string') {
      throw new DOMException(`isLike() can only be called with strings.`);
   }

   // Convert the given value into a regular expression.
   // The rule is as follows. Any sequence of % is converted into .*, since %
   // means any piece of text (including an empty one).
   var pattern = new RegExp('^' + value.replace(/%+/g, '.*') + '$', caseInsensitive ? 'i' : '');

   return new DatabaseSearcher(false, function(prop, record) {
      return pattern.test(record[prop]);
   });
}

export function hasKeys(...args: string[])
{
   return new DatabaseSearcher(false, function(prop, record) {
      var obj = record[prop];
      for (var arg of args) {
         if (!(arg in obj)) {
            return false;
         }
      }
      return true;
   });
}

export default DatabaseSearcher;