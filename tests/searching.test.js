describe('Searching records', () => {
   var db;
   var store;

   before(async () => {
      db = await FrontendDB.open('test-db');
      await db.delete();
      db = await FrontendDB.open('test-db');
   });

   after(async () => {
      console.log('we are here')
      db.close();
   });

   describe(`Store with manual keys and indexes 'x' and 'y': [{x: 10, y: 0}, {x: -5, y: 0}, {x: 50, y: 100}, {x: 11, y: 9999}]`, () => {
      var records = [
         {x: 10, y: 0},
         {x: -5, y: 0},
         {x: 50, y: 100},
         {x: 11, y: 9999}
      ];
      var keys = 'abcd';

      before(async () => {
         store = await db.createStore('test-store', {}, null);
         for (var i = 0; i < records.length; i++) {
            await store.addRecord(records[i], keys[i]);
         }
      });

      it(`store should have four records to start with`, async () => {
         chai.expect(await store.getAllKeys()).to.have.length(4);
      });
      it(`searching for (x = 10) should give an array containing the key 'a'`, async () => {
         chai.expect(await store.searchRecords('x', isEqualTo(10))).to.eql(['a']);
      });
      it(`searching for (y = 0) should give an array containing the keys 'a' and 'b'`, async () => {
         chai.expect(await store.searchRecords('y', isEqualTo(0))).to.eql(['a', 'b']);
      });
      it(`searching for (y = 10000) should give an empty array`, async () => {
         chai.expect(await store.searchRecords('y', isEqualTo(10000))).to.eql([]);
      });
      it(`searching for (y <= 9999) should give ['a', 'b', 'c', 'd']`, async () => {
         chai.expect(await store.searchRecords('y', isLessThanEqualTo(9999))).to.eql(['a', 'b', 'c', 'd']);
      });
      it(`searching for (y < 9999) should give ['a', 'b', 'c']`, async () => {
         chai.expect(await store.searchRecords('y', isLessThan(9999))).to.eql(['a', 'b', 'c']);
      });
      it(`searching for (y >= 9999) should give ['d']`, async () => {
         chai.expect(await store.searchRecords('y', isGreaterThanEqualTo(9999))).to.eql(['d']);
      });
      it(`searching for (y > 9999) should give []`, async () => {
         chai.expect(await store.searchRecords('y', isGreaterThan(9999))).to.eql([]);
      });
      it(`searching for (x >= 11 and y >= 100) should give ['c', 'd']`, async () => {
         chai.expect(await store.searchRecordsAdvanced({
            'x': isGreaterThanEqualTo(11),
            'y': isGreaterThanEqualTo(100)
         })).to.eql(['c', 'd']);
      });
      it(`searching for (x > 11 and y >= 100) should give ['c']`, async () => {
         chai.expect(await store.searchRecordsAdvanced({
            'x': isGreaterThan(11),
            'y': isGreaterThanEqualTo(100)
         })).to.eql(['c']);
      });
   })

   describe(`Store with keyPath and indexes 'rating': (refer to code to see the list of records)`, () => {
      var a = 0;
      var records = [
         {name: 'Banana Bread', rating: 5, id: a++},
         {name: 'Whole Wheat Bread', rating: 2, id: a++},
         {name: 'White Bread', rating: 3, id: a++},
         {name: 'Channa Biryani', rating: 4, id: a++},
         {name: 'Chicken Biryani', rating: 4, id: a++},
         {name: 'Gulab Jamun', rating: 5, id: a++},
         {name: 'Bread Sticks', rating: 4, id: a++},
      ]

      before(async () => {
         store = await db.createStore('test-store-keyPath', {}, 'id');
         for (var i = 0; i < records.length; i++) {
            await store.addRecord(records[i]);
         }
      });

      it(`store should have 7 records to start with`, async () => {
         chai.expect(await store.getAllKeys()).to.have.length(7);
      });
      it(`searching for (name = 'Gulab Jamun') should give an array containing the key 5`, async () => {
         chai.expect(await store.searchRecords('name', isEqualTo('Gulab Jamun'))).to.eql([5]);
      });
      it(`searching for (name = 'gulab jamun') case-insensitively should give an array containing the keys 'a' and 'b'`, async () => {
         chai.expect(await store.searchRecords('name', isLike('gulab jamun', true))).to.eql([5]);
      });
      it(`searching for (name = 'gulab jamun') case-insensitively should give an empty array`, async () => {
         chai.expect(await store.searchRecords('name', isLike('gulab jamun'))).to.eql([]);
      });
      it(`searching for (name = '%bread') case-insensitively should give [0, 1, 2]`, async () => {
         chai.expect(await store.searchRecords('name', isLike('%bread', true))).to.eql([0, 1, 2]);
      });
      it(`searching for (name = '%bread' and rating >= 4) case-insensitively should give [0]`, async () => {
         chai.expect(await store.searchRecordsAdvanced({
            'name': isLike('%bread', true),
            'rating': isGreaterThanEqualTo(4)
         })).to.eql([0]);
      });
      it(`searching for (name = '%bread%' and rating >= 4) case-insensitively should give [0, 6]`, async () => {
         chai.expect(await store.searchRecordsAdvanced({
            'name': isLike('%bread%', true),
            'rating': isGreaterThanEqualTo(4)
         })).to.eql([0, 6]);
      });
   })
});