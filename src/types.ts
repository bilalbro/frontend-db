export interface Action {
   function: Function;
   thisValue: any
   arguments: [];
   resolve: Function,
   reject: Function
}

export interface FrontendDBJSON {
   name: string,
   stores: FrontendDBStoreJSON[]
}

export interface FrontendDBStoreJSON {
   name: string,
   indexes: string[],
   autoIncrement: boolean,
   keyPath: boolean | string,
   records: [IDBValidKey, {[key: string]: any}][]
}

export type RecordMatcherFunction = (prop: string, record: object) => boolean;
export type RecordMatcherFunctionWithValue = (value: any, prop: string, record: object) => boolean;