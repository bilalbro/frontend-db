describe('Working with databases', function() {
   const TEST_DB_NAME = 'test-db';
   const NON_EXISTENT_DB_NAME = 'fake-db';
   var db;

   describe('Opening a connection - static open()', function() {
      it(`should complete without errors upon opening a brand new database connection '${TEST_DB_NAME}'`, async () => {
         db = await FrontendDB.open(TEST_DB_NAME);
         chai.expect(db).to.be.instanceOf(FrontendDB);
      });

      it(`should throw when opening a new connection to the same database '${TEST_DB_NAME}'`, async () => {
         try {
            await FrontendDB.open(TEST_DB_NAME);
         }
         catch(e) {
            chai.expect(e).to.be.instanceOf(DOMException);
         }
      });
   });

   describe(`Checking for database's existence - static exists()`, function() {
      it(`should eventually return true when called on an existing database '${TEST_DB_NAME}'`, async () => {
         chai.expect(await FrontendDB.exists(TEST_DB_NAME)).to.be.true;
      });

      it(`should eventually return false when called on a non-existing database '${NON_EXISTENT_DB_NAME}'`, async () => {
         chai.expect(await FrontendDB.exists(NON_EXISTENT_DB_NAME)).to.be.false;
      });
   });

   describe(`Deleting a database - delete()`, function() {
      it(`should complete without any errors when deleting an existing database '${TEST_DB_NAME}' via its FrontendDB instance`, async () => {
         chai.expect(await db.delete()).to.be.undefined;
      });

      it(`should eventually throw when called on the previous FrontendDB instance (which has been deleted)`, async () => {
         try {
            await db.delete();
         }
         catch(e) {
            chai.expect(e).to.be.instanceOf(DOMException);
         }
      });
   });
});