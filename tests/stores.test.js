describe('Working with stores', function() {
   const TEST_DB_NAME = 'test-db';
   const NON_EXISTENT_DB_NAME = 'fake-db';
   const STORE_NAME = 'test-store';
   var db;

   before(async function() {
      db = await Database.open('test-db');
   });

   after(function() {
      db.close();
   });

   describe(`Basic store functionality`, function() {
      it(`creating a new store '${STORE_NAME}' should complete without any errors`);
      it(`creating the store '${STORE_NAME}' again should throw an error`);
      it(`checking for the store's existence should return true`);
      it(`getting the store '${STORE_NAME}' should return a DatabaseStore instance`);
      it(`deleting the store '${STORE_NAME}' should complete without any errors`);
      it(`deleting the store '${STORE_NAME}' again should throw an error`);
      it(`once deleted, the DatabaseStore instance should throw on every subsequent operation, e.g. addRecord()`);
   });
});