describe('Working with records', function() {
   var db;
   var store;

   before(async function() {
      db = await FrontendDB.open('test-db');
      await db.delete();
      db = await FrontendDB.open('test-db');
   });

   describe(`Store with manual keys`, function() {

      before(async function() {
         store = await db.createStore('test-store-manual');
      });

      it(`getting all records at this point should give an empty array`, async () => {
         chai.expect(await store.getAllRecords()).to.be.eql([]);
      });
      it(`adding a new record {x: -5, y: 10} with key 'a' should complete without any errors and return 'a'`, async () => {
         chai.expect(await store.addRecord({x: -5, y: 10}, 'a')).to.equal('a');
      });
      it(`adding a new record with key 'a' should throw an error`, (done) => {
         store.addRecord({x: 50, y: 10000}, 'a')
            .then(done)
            .catch(() => {done()});
      });
      it(`adding a new record without a key should throw an error`, (done) => {
         store.addRecord({x: 0, y: 850})
            .then(done)
            .catch(() => {done()});
      });
      it(`getting the record at key 'a' should give back the correct record {x: -5, y: 10}`, async () => {
         chai.expect(await store.getRecord('a')).to.eql({x: -5, y: 10})
      });
      it(`getting the record at key 'fake-key' should throw an error`, (done) => {
         store.getRecord('fake-key')
            .then(done)
            .catch(() => {done()});
      });
      it(`getting all records at this point should give a single record`, async () => {
         chai.expect(await store.getAllRecords()).to.be.eql([{x: -5, y: 10}]);
      });
      it(`getting all keys at this point should give an array containing 'a' only`, async () => {
         chai.expect(await store.getAllKeys()).to.be.eql(['a']);
      });
      it(`getting all keys-record pairs (using getAllRecordsWithKeys()) should give an array containing ['a', {x: -5, y: 10}]`, async () => {
         chai.expect(await store.getAllRecordsWithKeys()).to.be.eql([['a', {x: -5, y: 10}]]);
      });
      it(`updating the record {x: -5, y: 10} (at key 'a') with {x: 1000} should complete without any errors`, (done) => {
         store.updateRecord('a', {x: 1000})
            .then(() => {done()})
            .catch(done);
      });
      it(`getting the record with key 'a' should now give {x: 1000, y: 10}`, async () => {
         chai.expect(await store.getRecord('a')).to.be.eql({x: 1000, y: 10});
      });
      it(`copying the store should eventually complete without any errors`, (done) => {
         store.copy('test-store-manual-copy')
            .then(() => {done()})
            .catch(done);
      });
      it(`the copied store should match the key-record pairs of the original store, i.e. an array containing ['a', {x: 1000, y: 10}]`, async () => {
         chai.expect(await store.getAllRecordsWithKeys()).to.be.eql([['a', {x: 1000, y: 10}]]);
      });
      it(`deleting the record with key 'a' should complete without any errors`, (done) => {
         store.deleteRecord('a')
            .then(() => {done()})
            .catch(done);
      });
      it(`deleting the record with key 'a' should now throw an error`, (done) => {
         store.deleteRecord('a')
            .then(done)
            .catch(() => {done()});
      });
      it(`getting the record with key 'a' should now throw an error`, (done) => {
         store.deleteRecord('a')
            .then(done)
            .catch(() => {done()});
      });
   });

   describe(`Store with autoIncrement keys`, function() {
      var returnedKey;
      var copiedStore;

      before(async function() {
         store = await db.createStore('test-store-autoIncrement', {}, true);
      });

      it(`getting all records at this point should give an empty array`, async () => {
         chai.expect(await store.getAllRecords()).to.eql([]);
      });
      it(`adding a new record {x: -5, y: 10} with key 'a' should complete without any errors and return 'a'`, async () => {
         chai.expect(await store.addRecord({x: -5, y: 10}, 'a')).to.equal('a');
      });
      it(`adding a new record with key 'a' should throw an error`, (done) => {
         store.addRecord({x: 850, y: -333}, 'a')
            .then(done)
            .catch(() => {done()});
      });
      it(`adding a new record {x: 240, y: -300} without a key should complete without any errors and return a number (call this KEY)`, async () => {
         chai.expect(returnedKey = await store.addRecord({x: 240, y: -300})).to.be.a('number');
      });
      it(`getting the record at key 'a' should give back the correct record {x: -5, y: 10}`, async () => {
         chai.expect(await store.getRecord('a')).to.eql({x: -5, y: 10});
      });
      it(`getting the record at key KEY should give back the correct record {x: 240, y: -300}`, async () => {
         chai.expect(await store.getRecord(returnedKey)).to.eql({x: 240, y: -300});
      });
      it(`getting the record at key 'fake-key' should throw an error`, (done) => {
         store.getRecord('fake')
            .then(done)
            .catch(() => {done()});
      });
      it(`getting all records at this point should give an array of two records`, async () => {
         chai.expect(await store.getAllRecords()).to.have.length(2);
      });
      it(`getting all keys at this point should give an array containing 'a' and KEY`, async () => {
         chai.expect(await store.getAllKeys()).to.contains(returnedKey).and.contains('a');
      });
      it(`getting all key-record pairs (using getAllRecordsWithKeys()) should give an array containing two entries`, async () => {
         chai.expect(await store.getAllRecordsWithKeys()).to.have.length(2);
      });
      it(`updating the record {x: -5, y: 10} (at key 'a') with {x: 1000} should complete without any errors`, (done) => {
         store.updateRecord('a', {x: 1000})
            .then(() => {done()})
            .catch(done);
      });
      it(`getting the record with key 'a' should now give {x: 1000, y: 10}`, async () => {
         chai.expect(await store.getRecord('a')).to.eql({x: 1000, y: 10});
      });
      it(`updating the record {x: 240, y: -300} (at key KEY) with {x: -1, y: -1} should complete without any errors`, (done) => {
         store.updateRecord(returnedKey, {x: -1, y: -1})
            .then(() => {done()})
            .catch(done);
      });
      it(`getting this record (with key KEY) should now give {x: -1, y: -1}`, async () => {
         chai.expect(await store.getRecord(returnedKey)).to.eql({x: -1, y: -1});
      });
      it(`copying the store should eventually complete without any errors and return a FrontendDBStore instance`, async () => {
         copiedStore = await store.copy('test-store-autoIncrement-copy');
         chai.expect(copiedStore).to.be.instanceOf(FrontendDBStore);
      });
      it(`the copied store should match the key-record pairs of the original store`, async () => {
         chai.expect(await store.getAllRecordsWithKeys()).to.eql(await copiedStore.getAllRecordsWithKeys());
      });
      it(`deleting the record with key 'a' should complete without any errors`, (done) => {
         store.deleteRecord('a')
            .then(() => {done()})
            .catch(done);
      });
      it(`deleting the record with key 'a' should now throw an error`, (done) => {
         store.deleteRecord('a')
            .then(done)
            .catch(() => {done()});
      });
      it(`deleting the record with key KEY should complete without any errors`, (done) => {
         store.deleteRecord(returnedKey)
            .then(() => {done()})
            .catch(done);
      });
      it(`getting the record with key 'a' should now throw an error`, (done) => {
         store.getRecord('a')
            .then(done)
            .catch(() => {done()});
      });
      it(`getting the record with key KEY should now throw an error`, (done) => {
         store.getRecord(returnedKey)
            .then(done)
            .catch(() => {done()});
      });
      it(`getting all records at this point should give an empty array`, async () => {
         chai.expect(await store.getAllRecords()).to.eql([]);
      });
   });
});