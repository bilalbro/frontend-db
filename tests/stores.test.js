describe('Working with stores', function() {
   const TEST_DB_NAME = 'test-db';
   const NON_EXISTENT_DB_NAME = 'fake-db';
   const STORE_NAME = 'test-store';
   var db;

   before(async function() {
      db = await FrontendDB.open('test-db');
      await db.delete();
      db = await FrontendDB.open('test-db');
   });

   after(function() {
      db.close();
   });

   describe(`Calling multiple methods without 'await'`, function() {
      var orderOfCalls = [];

      before((done) => {
         db.createStore('s1').then(() => {
            orderOfCalls.push(1);
            db.createStore('s2').then(() => {
               orderOfCalls.push(2);
               db.createStore('xyz').then(() => {
                  orderOfCalls.push(3);
               });
            });
         });
         db.existsStore('s3').then(() => {
            orderOfCalls.push(4);
            db.createStore('s4').then(() => {
               orderOfCalls.push(5);
               done();
            });
         });
      })
      
      it(`order of calls should be [1,2,3,4,5] (see before() hook for more info)`, () => {
         chai.expect(orderOfCalls).to.eql([1,2,3,4,5]);
      });
   })

   describe(`Basic store functionality`, function() {
      it(`creating a new store '${STORE_NAME}' should complete without any errors`);
      it(`creating the store '${STORE_NAME}' again should throw an error`);
      it(`checking for the store's existence should return true`);
      it(`getting the store '${STORE_NAME}' should return a FrontendDBStore instance`);
      it(`deleting the store '${STORE_NAME}' should complete without any errors`);
      it(`deleting the store '${STORE_NAME}' again should throw an error`);
      it(`once deleted, the FrontendDBStore instance should throw on every subsequent operation, e.g. addRecord()`);
   });
});