describe('Backup and restoration', function() {
   const TEST_DB_NAME = 'test-db';
   const NON_EXISTENT_DB_NAME = 'fake-db';
   var db;

   before(async () => {
      db = await FrontendDB.open('test-db');
      await db.delete();
      db = await FrontendDB.open('test-db');
   });

   after(async () => {
      db.close();
   });

   describe(`Backing up data`, function() {
      it(`Creating a test store and then getting its JSON should yield the correct output`, async () => {
         var store = await db.createStore('test-store', {}, true);
         var key = await store.addRecord({
            name: 'Bro',
            age: 18
         });
         chai.expect( await store.getJSON() ).to.eql({
            name: 'test-store',
            indexes: [],
            autoIncrement: true,
            keyPath: false,
            records: [
               [key, {name: 'Bro', age: 18}]
            ]
         });
         // db.exportToJSON();
         // FrontendDB.restore(`{"name":"test-db","stores":["{\"name\":\"test-store\",\"indexes\":[],\"autoIncrement\":true,\"keyPath\":false,\"records\":[[1,{\"name\":\"Bro\",\"age\":18}]]}"]}`);
      })
   });
});