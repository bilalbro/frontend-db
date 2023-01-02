FrontendDB.exists('another-db').then((v) => {
   FrontendDB.exists('xyz');
});
var db;
FrontendDB.open('another-db').then((_db) => {
   db = _db;
   db.createStore('xyz').then(() => {
   });
   // db.createStore('abc').then(() => {
   //    console.log('INSIDE ABC');
   // });
   db.exportToJSON();
});

FrontendDB.open('another-db2');