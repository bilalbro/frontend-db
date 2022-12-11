(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.FrontendDB = factory());
})(this, (function () { 'use strict';

  function _regeneratorRuntime() {
    _regeneratorRuntime = function () {
      return exports;
    };
    var exports = {},
      Op = Object.prototype,
      hasOwn = Op.hasOwnProperty,
      defineProperty = Object.defineProperty || function (obj, key, desc) {
        obj[key] = desc.value;
      },
      $Symbol = "function" == typeof Symbol ? Symbol : {},
      iteratorSymbol = $Symbol.iterator || "@@iterator",
      asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator",
      toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
    function define(obj, key, value) {
      return Object.defineProperty(obj, key, {
        value: value,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), obj[key];
    }
    try {
      define({}, "");
    } catch (err) {
      define = function (obj, key, value) {
        return obj[key] = value;
      };
    }
    function wrap(innerFn, outerFn, self, tryLocsList) {
      var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator,
        generator = Object.create(protoGenerator.prototype),
        context = new Context(tryLocsList || []);
      return defineProperty(generator, "_invoke", {
        value: makeInvokeMethod(innerFn, self, context)
      }), generator;
    }
    function tryCatch(fn, obj, arg) {
      try {
        return {
          type: "normal",
          arg: fn.call(obj, arg)
        };
      } catch (err) {
        return {
          type: "throw",
          arg: err
        };
      }
    }
    exports.wrap = wrap;
    var ContinueSentinel = {};
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}
    var IteratorPrototype = {};
    define(IteratorPrototype, iteratorSymbol, function () {
      return this;
    });
    var getProto = Object.getPrototypeOf,
      NativeIteratorPrototype = getProto && getProto(getProto(values([])));
    NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype);
    var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
    function defineIteratorMethods(prototype) {
      ["next", "throw", "return"].forEach(function (method) {
        define(prototype, method, function (arg) {
          return this._invoke(method, arg);
        });
      });
    }
    function AsyncIterator(generator, PromiseImpl) {
      function invoke(method, arg, resolve, reject) {
        var record = tryCatch(generator[method], generator, arg);
        if ("throw" !== record.type) {
          var result = record.arg,
            value = result.value;
          return value && "object" == typeof value && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) {
            invoke("next", value, resolve, reject);
          }, function (err) {
            invoke("throw", err, resolve, reject);
          }) : PromiseImpl.resolve(value).then(function (unwrapped) {
            result.value = unwrapped, resolve(result);
          }, function (error) {
            return invoke("throw", error, resolve, reject);
          });
        }
        reject(record.arg);
      }
      var previousPromise;
      defineProperty(this, "_invoke", {
        value: function (method, arg) {
          function callInvokeWithMethodAndArg() {
            return new PromiseImpl(function (resolve, reject) {
              invoke(method, arg, resolve, reject);
            });
          }
          return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
        }
      });
    }
    function makeInvokeMethod(innerFn, self, context) {
      var state = "suspendedStart";
      return function (method, arg) {
        if ("executing" === state) throw new Error("Generator is already running");
        if ("completed" === state) {
          if ("throw" === method) throw arg;
          return doneResult();
        }
        for (context.method = method, context.arg = arg;;) {
          var delegate = context.delegate;
          if (delegate) {
            var delegateResult = maybeInvokeDelegate(delegate, context);
            if (delegateResult) {
              if (delegateResult === ContinueSentinel) continue;
              return delegateResult;
            }
          }
          if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) {
            if ("suspendedStart" === state) throw state = "completed", context.arg;
            context.dispatchException(context.arg);
          } else "return" === context.method && context.abrupt("return", context.arg);
          state = "executing";
          var record = tryCatch(innerFn, self, context);
          if ("normal" === record.type) {
            if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue;
            return {
              value: record.arg,
              done: context.done
            };
          }
          "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg);
        }
      };
    }
    function maybeInvokeDelegate(delegate, context) {
      var method = delegate.iterator[context.method];
      if (undefined === method) {
        if (context.delegate = null, "throw" === context.method) {
          if (delegate.iterator.return && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel;
          context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method");
        }
        return ContinueSentinel;
      }
      var record = tryCatch(method, delegate.iterator, context.arg);
      if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel;
      var info = record.arg;
      return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel);
    }
    function pushTryEntry(locs) {
      var entry = {
        tryLoc: locs[0]
      };
      1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry);
    }
    function resetTryEntry(entry) {
      var record = entry.completion || {};
      record.type = "normal", delete record.arg, entry.completion = record;
    }
    function Context(tryLocsList) {
      this.tryEntries = [{
        tryLoc: "root"
      }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0);
    }
    function values(iterable) {
      if (iterable) {
        var iteratorMethod = iterable[iteratorSymbol];
        if (iteratorMethod) return iteratorMethod.call(iterable);
        if ("function" == typeof iterable.next) return iterable;
        if (!isNaN(iterable.length)) {
          var i = -1,
            next = function next() {
              for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next;
              return next.value = undefined, next.done = !0, next;
            };
          return next.next = next;
        }
      }
      return {
        next: doneResult
      };
    }
    function doneResult() {
      return {
        value: undefined,
        done: !0
      };
    }
    return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", {
      value: GeneratorFunctionPrototype,
      configurable: !0
    }), defineProperty(GeneratorFunctionPrototype, "constructor", {
      value: GeneratorFunction,
      configurable: !0
    }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) {
      var ctor = "function" == typeof genFun && genFun.constructor;
      return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name));
    }, exports.mark = function (genFun) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun;
    }, exports.awrap = function (arg) {
      return {
        __await: arg
      };
    }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
      return this;
    }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) {
      void 0 === PromiseImpl && (PromiseImpl = Promise);
      var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
      return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) {
        return result.done ? result.value : iter.next();
      });
    }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () {
      return this;
    }), define(Gp, "toString", function () {
      return "[object Generator]";
    }), exports.keys = function (val) {
      var object = Object(val),
        keys = [];
      for (var key in object) keys.push(key);
      return keys.reverse(), function next() {
        for (; keys.length;) {
          var key = keys.pop();
          if (key in object) return next.value = key, next.done = !1, next;
        }
        return next.done = !0, next;
      };
    }, exports.values = values, Context.prototype = {
      constructor: Context,
      reset: function (skipTempReset) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined);
      },
      stop: function () {
        this.done = !0;
        var rootRecord = this.tryEntries[0].completion;
        if ("throw" === rootRecord.type) throw rootRecord.arg;
        return this.rval;
      },
      dispatchException: function (exception) {
        if (this.done) throw exception;
        var context = this;
        function handle(loc, caught) {
          return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught;
        }
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i],
            record = entry.completion;
          if ("root" === entry.tryLoc) return handle("end");
          if (entry.tryLoc <= this.prev) {
            var hasCatch = hasOwn.call(entry, "catchLoc"),
              hasFinally = hasOwn.call(entry, "finallyLoc");
            if (hasCatch && hasFinally) {
              if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
              if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
            } else if (hasCatch) {
              if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
            } else {
              if (!hasFinally) throw new Error("try statement without catch or finally");
              if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
            }
          }
        }
      },
      abrupt: function (type, arg) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
            var finallyEntry = entry;
            break;
          }
        }
        finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null);
        var record = finallyEntry ? finallyEntry.completion : {};
        return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record);
      },
      complete: function (record, afterLoc) {
        if ("throw" === record.type) throw record.arg;
        return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel;
      },
      finish: function (finallyLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel;
        }
      },
      catch: function (tryLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc === tryLoc) {
            var record = entry.completion;
            if ("throw" === record.type) {
              var thrown = record.arg;
              resetTryEntry(entry);
            }
            return thrown;
          }
        }
        throw new Error("illegal catch attempt");
      },
      delegateYield: function (iterable, resultName, nextLoc) {
        return this.delegate = {
          iterator: values(iterable),
          resultName: resultName,
          nextLoc: nextLoc
        }, "next" === this.method && (this.arg = undefined), ContinueSentinel;
      }
    }, exports;
  }
  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }
    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }
  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
        args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);
        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }
        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }
        _next(undefined);
      });
    };
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _createForOfIteratorHelper(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (!it) {
      if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
        if (it) o = it;
        var i = 0;
        var F = function () {};
        return {
          s: F,
          n: function () {
            if (i >= o.length) return {
              done: true
            };
            return {
              done: false,
              value: o[i++]
            };
          },
          e: function (e) {
            throw e;
          },
          f: F
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var normalCompletion = true,
      didErr = false,
      err;
    return {
      s: function () {
        it = it.call(o);
      },
      n: function () {
        var step = it.next();
        normalCompletion = step.done;
        return step;
      },
      e: function (e) {
        didErr = true;
        err = e;
      },
      f: function () {
        try {
          if (!normalCompletion && it.return != null) it.return();
        } finally {
          if (didErr) throw err;
        }
      }
    };
  }

  function intersection(a,b){// If intersecting an array with undefined, return that array as it is.
  if(!b){return a;}var intersectionArray=[];var setA=new Set(a);b.forEach(function(key){if(setA.has(key)){intersectionArray.push(key);}});return intersectionArray;}var PUBLIC_METHOD_NAMES=['getIndexes','copy','addRecord','clearAllRecords','getRecord','getAllRecords','getAllKeys','getAllRecordsWithKeys','existsRecord','deleteRecord','updateRecord','searchRecords','searchRecordsAdvanced'];var FrontendDBStore=/*#__PURE__*/function(){// Public methods
  function FrontendDBStore(db,name,schema){_classCallCheck(this,FrontendDBStore);_defineProperty(this,"db",void 0);_defineProperty(this,"schema",void 0);_defineProperty(this,"idbObjectStore",void 0);_defineProperty(this,"name",void 0);_defineProperty(this,"getIndexes",void 0);_defineProperty(this,"copy",void 0);_defineProperty(this,"addRecord",void 0);_defineProperty(this,"clearAllRecords",void 0);_defineProperty(this,"getRecord",void 0);_defineProperty(this,"getAllRecords",void 0);_defineProperty(this,"getAllKeys",void 0);_defineProperty(this,"getAllRecordsWithKeys",void 0);_defineProperty(this,"existsRecord",void 0);_defineProperty(this,"deleteRecord",void 0);_defineProperty(this,"updateRecord",void 0);_defineProperty(this,"searchRecords",void 0);_defineProperty(this,"searchRecordsAdvanced",void 0);this.db=db;this.name=name;this.schema=schema;this.idbObjectStore=null;this.definePublicMethods();}_createClass(FrontendDBStore,[{key:"definePublicMethods",value:function definePublicMethods(){var _iterator=_createForOfIteratorHelper(PUBLIC_METHOD_NAMES),_step;try{for(_iterator.s();!(_step=_iterator.n()).done;){var methodName=_step.value;this[methodName]=this.db.getPublicMethodFunction(this['_'+methodName],this);}}catch(err){_iterator.e(err);}finally{_iterator.f();}}},{key:"_prepare",value:function(){var _prepare2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(){var mode,_args=arguments;return _regeneratorRuntime().wrap(function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:mode=_args.length>0&&_args[0]!==undefined?_args[0]:'readonly';_context.next=3;return this.db.getIDBObjectStore(this.name,mode);case 3:this.idbObjectStore=_context.sent;case 4:case"end":return _context.stop();}}},_callee,this);}));function _prepare(){return _prepare2.apply(this,arguments);}return _prepare;}()},{key:"_getIndexes",value:function(){var _getIndexes2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(){return _regeneratorRuntime().wrap(function _callee2$(_context2){while(1){switch(_context2.prev=_context2.next){case 0:_context2.next=2;return this._prepare();case 2:return _context2.abrupt("return",this.idbObjectStore.indexNames);case 3:case"end":return _context2.stop();}}},_callee2,this);}));function _getIndexes(){return _getIndexes2.apply(this,arguments);}return _getIndexes;}()},{key:"_copy",value:function(){var _copy2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(newStoreName){var newEmptyStore,recordsWithKeys,_iterator2,_step2,recordWithKey;return _regeneratorRuntime().wrap(function _callee3$(_context3){while(1){switch(_context3.prev=_context3.next){case 0:_context3.next=2;return this._prepare();case 2:_context3.next=4;return this.db._createStore(newStoreName,{},this.idbObjectStore.autoIncrement,this.idbObjectStore.indexNames);case 4:newEmptyStore=_context3.sent;_context3.next=7;return this._getAllRecordsWithKeys();case 7:recordsWithKeys=_context3.sent;_iterator2=_createForOfIteratorHelper(recordsWithKeys);_context3.prev=9;_iterator2.s();case 11:if((_step2=_iterator2.n()).done){_context3.next=17;break;}recordWithKey=_step2.value;_context3.next=15;return newEmptyStore._addRecord(recordWithKey[1],recordWithKey[0]);case 15:_context3.next=11;break;case 17:_context3.next=22;break;case 19:_context3.prev=19;_context3.t0=_context3["catch"](9);_iterator2.e(_context3.t0);case 22:_context3.prev=22;_iterator2.f();return _context3.finish(22);case 25:return _context3.abrupt("return",newEmptyStore);case 26:case"end":return _context3.stop();}}},_callee3,this,[[9,19,22,25]]);}));function _copy(_x){return _copy2.apply(this,arguments);}return _copy;}()},{key:"_addRecord",value:function _addRecord(record,key){var _this=this;return new Promise(/*#__PURE__*/function(){var _ref=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(resolve,reject){var request;return _regeneratorRuntime().wrap(function _callee4$(_context4){while(1){switch(_context4.prev=_context4.next){case 0:_context4.next=2;return _this._prepare('readwrite');case 2:try{request=_this.idbObjectStore.add(record,key);request.onsuccess=function(e){resolve(e.target.result);};request.onerror=function(e){reject(e.target.error);};}catch(e){reject(e);}case 3:case"end":return _context4.stop();}}},_callee4);}));return function(_x2,_x3){return _ref.apply(this,arguments);};}());}},{key:"_clearAllRecords",value:function(){var _clearAllRecords2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(){var _this2=this;return _regeneratorRuntime().wrap(function _callee6$(_context6){while(1){switch(_context6.prev=_context6.next){case 0:_context6.next=2;return this._prepare('readwrite');case 2:return _context6.abrupt("return",new Promise(/*#__PURE__*/function(){var _ref2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(resolve,reject){var request;return _regeneratorRuntime().wrap(function _callee5$(_context5){while(1){switch(_context5.prev=_context5.next){case 0:try{request=_this2.idbObjectStore.clear();request.onsuccess=function(e){resolve();};request.onerror=function(e){reject(e.target.error);};}catch(e){reject(e);}case 1:case"end":return _context5.stop();}}},_callee5);}));return function(_x4,_x5){return _ref2.apply(this,arguments);};}()));case 3:case"end":return _context6.stop();}}},_callee6,this);}));function _clearAllRecords(){return _clearAllRecords2.apply(this,arguments);}return _clearAllRecords;}()},{key:"_getRecord",value:function _getRecord(key){var _this3=this;return new Promise(/*#__PURE__*/function(){var _ref3=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(resolve,reject){var request;return _regeneratorRuntime().wrap(function _callee7$(_context7){while(1){switch(_context7.prev=_context7.next){case 0:_context7.next=2;return _this3._prepare();case 2:request=_this3.idbObjectStore.get(key);request.onsuccess=function(e){var record=e.target.result;if(record!==undefined){resolve(record);}else {reject(new DOMException("Key '".concat(key,"' doesn't exist in store '").concat(_this3.name,"'. To add a record with this key, use addRecord().")));}};request.onerror=function(e){reject(e.target.error);};case 5:case"end":return _context7.stop();}}},_callee7);}));return function(_x6,_x7){return _ref3.apply(this,arguments);};}());}},{key:"_getAllRecords",value:function _getAllRecords(){var _this4=this;return new Promise(/*#__PURE__*/function(){var _ref4=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(resolve,reject){var request;return _regeneratorRuntime().wrap(function _callee8$(_context8){while(1){switch(_context8.prev=_context8.next){case 0:_context8.next=2;return _this4._prepare();case 2:request=_this4.idbObjectStore.getAll();request.onsuccess=function(e){var records=e.target.result;resolve(records);};request.onerror=function(e){reject(e.target.error);};case 5:case"end":return _context8.stop();}}},_callee8);}));return function(_x8,_x9){return _ref4.apply(this,arguments);};}());}},{key:"_getAllKeys",value:function _getAllKeys(){var _this5=this;return new Promise(/*#__PURE__*/function(){var _ref5=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9(resolve,reject){var request;return _regeneratorRuntime().wrap(function _callee9$(_context9){while(1){switch(_context9.prev=_context9.next){case 0:_context9.next=2;return _this5._prepare();case 2:request=_this5.idbObjectStore.getAllKeys();request.onsuccess=function(e){var keys=e.target.result;resolve(keys);};request.onerror=function(e){reject(e.target.error);};case 5:case"end":return _context9.stop();}}},_callee9);}));return function(_x10,_x11){return _ref5.apply(this,arguments);};}());}},{key:"_getAllRecordsWithKeys",value:function(){var _getAllRecordsWithKeys2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee10(){var records,keys;return _regeneratorRuntime().wrap(function _callee10$(_context10){while(1){switch(_context10.prev=_context10.next){case 0:_context10.next=2;return this._getAllRecords();case 2:records=_context10.sent;_context10.next=5;return this._getAllKeys();case 5:keys=_context10.sent;return _context10.abrupt("return",records.map(function(record,i){return [keys[i],record];}));case 7:case"end":return _context10.stop();}}},_callee10,this);}));function _getAllRecordsWithKeys(){return _getAllRecordsWithKeys2.apply(this,arguments);}return _getAllRecordsWithKeys;}()},{key:"_existsRecord",value:function(){var _existsRecord2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee11(key){return _regeneratorRuntime().wrap(function _callee11$(_context11){while(1){switch(_context11.prev=_context11.next){case 0:_context11.prev=0;_context11.next=3;return this._getRecord(key);case 3:return _context11.abrupt("return",true);case 6:_context11.prev=6;_context11.t0=_context11["catch"](0);return _context11.abrupt("return",false);case 9:case"end":return _context11.stop();}}},_callee11,this,[[0,6]]);}));function _existsRecord(_x12){return _existsRecord2.apply(this,arguments);}return _existsRecord;}()},{key:"_deleteRecord",value:function _deleteRecord(key){var _this6=this;return new Promise(/*#__PURE__*/function(){var _ref6=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee12(resolve,reject){var request;return _regeneratorRuntime().wrap(function _callee12$(_context12){while(1){switch(_context12.prev=_context12.next){case 0:_context12.next=2;return _this6._existsRecord(key);case 2:if(_context12.sent){_context12.next=5;break;}reject(new DOMException("Key '".concat(key,"' doesn't exist in store '").concat(_this6.name,"'. To add a record with this key, use addRecord().")));return _context12.abrupt("return");case 5:_context12.next=7;return _this6._prepare('readwrite');case 7:request=_this6.idbObjectStore["delete"](key);request.onsuccess=function(e){resolve();};request.onerror=function(e){reject(e.target.error);};case 10:case"end":return _context12.stop();}}},_callee12);}));return function(_x13,_x14){return _ref6.apply(this,arguments);};}());}},{key:"_updateRecord",value:function _updateRecord(key,newDetails){var _this7=this;return new Promise(/*#__PURE__*/function(){var _ref7=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee13(resolve,reject){var record,newRecord,request;return _regeneratorRuntime().wrap(function _callee13$(_context13){while(1){switch(_context13.prev=_context13.next){case 0:_context13.next=2;return _this7._existsRecord(key);case 2:if(_context13.sent){_context13.next=5;break;}reject(new DOMException("Key '".concat(key,"' doesn't exist in store '").concat(_this7.name,"'. To add a record with this key, use addRecord().")));return _context13.abrupt("return");case 5:if(!(_typeof(newDetails)!=='object')){_context13.next=8;break;}reject(new DOMException("Second argument to updateRecord() must be an object. Currently, a '".concat(_typeof(newDetails),"' was provided.")));return _context13.abrupt("return");case 8:_context13.next=10;return _this7._getRecord(key);case 10:record=_context13.sent;newRecord=Object.assign(record,newDetails);_context13.next=14;return _this7._prepare('readwrite');case 14:request=_this7.idbObjectStore.put(newRecord,key);request.onsuccess=function(e){resolve();};request.onerror=function(e){reject(e.target.error);};case 17:case"end":return _context13.stop();}}},_callee13);}));return function(_x15,_x16){return _ref7.apply(this,arguments);};}());}},{key:"_searchRecords",value:function _searchRecords(prop,searcher){var _this8=this;var recordsInstead=arguments.length>2&&arguments[2]!==undefined?arguments[2]:false;return new Promise(/*#__PURE__*/function(){var _ref8=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee14(resolve,reject){var isPropIndex,matchingKeysOrRecords;return _regeneratorRuntime().wrap(function _callee14$(_context14){while(1){switch(_context14.prev=_context14.next){case 0:_context14.next=2;return _this8._getIndexes();case 2:isPropIndex=_context14.sent.contains(prop);_context14.next=5;return _this8._prepare();case 5:_context14.next=7;return searcher.run(_this8.idbObjectStore,prop,isPropIndex,recordsInstead);case 7:matchingKeysOrRecords=_context14.sent;resolve(matchingKeysOrRecords);case 9:case"end":return _context14.stop();}}},_callee14);}));return function(_x17,_x18){return _ref8.apply(this,arguments);};}());}},{key:"_searchRecordsAdvanced",value:function(){var _searchRecordsAdvanced2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee15(filters){var recordsInstead,matchingKeys,prop,searcher,localMatchingKeys,matchingRecords,_iterator3,_step3,matchingKey,_args15=arguments;return _regeneratorRuntime().wrap(function _callee15$(_context15){while(1){switch(_context15.prev=_context15.next){case 0:recordsInstead=_args15.length>1&&_args15[1]!==undefined?_args15[1]:false;_context15.t0=_regeneratorRuntime().keys(filters);case 2:if((_context15.t1=_context15.t0()).done){_context15.next=11;break;}prop=_context15.t1.value;searcher=filters[prop];_context15.next=7;return this._searchRecords(prop,searcher);case 7:localMatchingKeys=_context15.sent;matchingKeys=intersection(localMatchingKeys,matchingKeys);_context15.next=2;break;case 11:if(recordsInstead){_context15.next=13;break;}return _context15.abrupt("return",matchingKeys);case 13:matchingRecords=[];_iterator3=_createForOfIteratorHelper(matchingKeys);_context15.prev=15;_iterator3.s();case 17:if((_step3=_iterator3.n()).done){_context15.next=26;break;}matchingKey=_step3.value;_context15.t2=matchingRecords;_context15.next=22;return this._getRecord(matchingKey);case 22:_context15.t3=_context15.sent;_context15.t2.push.call(_context15.t2,_context15.t3);case 24:_context15.next=17;break;case 26:_context15.next=31;break;case 28:_context15.prev=28;_context15.t4=_context15["catch"](15);_iterator3.e(_context15.t4);case 31:_context15.prev=31;_iterator3.f();return _context15.finish(31);case 34:return _context15.abrupt("return",matchingRecords);case 35:case"end":return _context15.stop();}}},_callee15,this,[[15,28,31,34]]);}));function _searchRecordsAdvanced(_x19){return _searchRecordsAdvanced2.apply(this,arguments);}return _searchRecordsAdvanced;}()}]);return FrontendDBStore;}();

  var DatabaseSearcher=/*#__PURE__*/function(){function DatabaseSearcher(isIndexSearchCompatible,arg,arg2){_classCallCheck(this,DatabaseSearcher);_defineProperty(this,"isIndexSearchCompatible",void 0);_defineProperty(this,"idbKeyRange",void 0);_defineProperty(this,"recordMatcher",void 0);this.isIndexSearchCompatible=isIndexSearchCompatible;if(arg instanceof IDBKeyRange){this.idbKeyRange=arg;this.recordMatcher=arg2;}else {this.recordMatcher=arg;}}_createClass(DatabaseSearcher,[{key:"runForIndexing",value:function runForIndexing(idbObjectStore,prop,recordsInstead){var _this=this;return new Promise(function(resolve,reject){var request=idbObjectStore.index(prop)[recordsInstead?'getAll':'getAllKeys'](_this.idbKeyRange);request.onsuccess=function(e){resolve(e.target.result);};request.onerror=function(e){reject(e);};});}},{key:"runForLinearSearch",value:function runForLinearSearch(idbObjectStore,prop,recordsInstead){var _this2=this;return new Promise(function(resolve,reject){var matches=[];var cursor=idbObjectStore.openCursor();cursor.onsuccess=/*#__PURE__*/function(){var _ref=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(e){var internalCursor,recordDoesMatch;return _regeneratorRuntime().wrap(function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:internalCursor=e.target.result;if(internalCursor){recordDoesMatch=_this2.recordMatcher(prop,internalCursor.value);if(recordDoesMatch){matches.push(recordsInstead?internalCursor.value:internalCursor.key);}internalCursor["continue"]();}else {resolve(matches);}case 2:case"end":return _context.stop();}}},_callee);}));return function(_x){return _ref.apply(this,arguments);};}();cursor.onerror=function(e){reject(e);};});}},{key:"run",value:function(){var _run=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(idbObjectStore,prop,isPropIndex,recordsInstead){var matches;return _regeneratorRuntime().wrap(function _callee2$(_context2){while(1){switch(_context2.prev=_context2.next){case 0:if(!(isPropIndex&&this.isIndexSearchCompatible)){_context2.next=6;break;}_context2.next=3;return this.runForIndexing(idbObjectStore,prop,recordsInstead);case 3:matches=_context2.sent;_context2.next=9;break;case 6:_context2.next=8;return this.runForLinearSearch(idbObjectStore,prop,recordsInstead);case 8:matches=_context2.sent;case 9:return _context2.abrupt("return",matches);case 10:case"end":return _context2.stop();}}},_callee2,this);}));function run(_x2,_x3,_x4,_x5){return _run.apply(this,arguments);}return run;}()}]);return DatabaseSearcher;}();function valueCheckingWrapper(searcherFunction,recordMatcher){return function(value){if(typeof value==='number'||typeof value==='string'){return new DatabaseSearcher(true,searcherFunction(value),recordMatcher.bind(null,value));}else {throw new DOMException("".concat(searcherFunction.name,"() can only be called with a number or a string."));}};}var isGreaterThan=valueCheckingWrapper(function isGreaterThan(value){return IDBKeyRange.lowerBound(value,true);},function(value,prop,record){return record[prop]>value;});var isGreaterThanEqualTo=valueCheckingWrapper(function isGreaterThanEqualTo(value){return IDBKeyRange.lowerBound(value);},function(value,prop,record){return record[prop]>=value;});var isLessThan=valueCheckingWrapper(function isLessThan(value){return IDBKeyRange.upperBound(value,true);},function(value,prop,record){return record[prop]<value;});var isLessThanEqualTo=valueCheckingWrapper(function isLessThanEqualTo(value){return IDBKeyRange.upperBound(value);},function(value,prop,record){return record[prop]<=value;});var isEqualTo=valueCheckingWrapper(function isEqualTo(value){return IDBKeyRange.only(value);},function(value,prop,record){return record[prop]===value;});function isLike(value){var caseInsensitive=arguments.length>1&&arguments[1]!==undefined?arguments[1]:false;// Only string values can be provided, hence, if the value argument is not a
  // a string, throw an error rightaway.
  if(typeof value!=='string'){throw new DOMException("isLike() can only be called with strings.");}// Convert the given value into a regular expression.
  // The rule is as follows. Any sequence of % is converted into .*, since %
  // means any piece of text (including an empty one).
  var pattern=new RegExp('^'+value.replace(/%+/g,'.*')+'$',caseInsensitive?'i':'');return new DatabaseSearcher(false,function(prop,record){return pattern.test(record[prop]);});}function hasKeys(){for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}return new DatabaseSearcher(false,function(prop,record){var obj=record[prop];var _iterator=_createForOfIteratorHelper(args),_step;try{for(_iterator.s();!(_step=_iterator.n()).done;){var arg=_step.value;if(!(arg in obj)){return false;}}}catch(err){_iterator.e(err);}finally{_iterator.f();}return true;});}

  var FrontendDB=/*#__PURE__*/function(){function FrontendDB(idb){_classCallCheck(this,FrontendDB);_defineProperty(this,"idb",void 0);_defineProperty(this,"name",void 0);_defineProperty(this,"storeNames",void 0);_defineProperty(this,"stores",void 0);_defineProperty(this,"deleted",void 0);_defineProperty(this,"closed",void 0);_defineProperty(this,"databaseActions",[]);_defineProperty(this,"processingOn",false);_defineProperty(this,"resolvingActionPromise",false);_defineProperty(this,"delete",void 0);_defineProperty(this,"existsStore",void 0);_defineProperty(this,"createStore",void 0);_defineProperty(this,"getStore",void 0);_defineProperty(this,"deleteStore",void 0);this.idb=idb;this.name=idb.name;this.storeNames=idb.objectStoreNames;this.stores={};this.deleted=false;this.closed=false;this.definePublicMethods();}_createClass(FrontendDB,[{key:"definePublicMethods",value:function definePublicMethods(){this["delete"]=this.getPublicMethodFunction(this._delete);this.existsStore=this.getPublicMethodFunction(this._existsStore);this.createStore=this.getPublicMethodFunction(this._createStore);this.getStore=this.getPublicMethodFunction(this._getStore);this.deleteStore=this.getPublicMethodFunction(this._deleteStore);}},{key:"getPublicMethodFunction",value:function getPublicMethodFunction(internalFunction,store){var _this=this;return function(){var _arguments=arguments;var databaseAction={};var promise=new Promise(function(resolve,reject){databaseAction={"function":internalFunction,store:store,arguments:Array.prototype.slice.call(_arguments),resolve:resolve,reject:reject};});_this.queueDatabaseAction(databaseAction);return promise;};}},{key:"processNextDatabaseActionWhenFree",value:function processNextDatabaseActionWhenFree(){var _this2=this;setTimeout(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(){var databaseAction,returnValue;return _regeneratorRuntime().wrap(function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:databaseAction=_this2.databaseActions.shift();_context.prev=1;_context.next=4;return databaseAction["function"].apply(// If the action has an associated store, we ought to invoke its 
  // corresponding function with 'this' configured to that very
  // DatabaseStore instance.
  databaseAction.store||_this2,databaseAction.arguments);case 4:returnValue=_context.sent;_this2.resolvingActionPromise=true;databaseAction.resolve(returnValue);_context.next=12;break;case 9:_context.prev=9;_context.t0=_context["catch"](1);databaseAction.reject(_context.t0);case 12:_context.prev=12;setTimeout(function(){_this2.resolvingActionPromise=false;if(!_this2.databaseActions.length){_this2.processingOn=false;}else {_this2.processNextDatabaseActionWhenFree();}},0);return _context.finish(12);case 15:case"end":return _context.stop();}}},_callee,null,[[1,9,12,15]]);})),0);}},{key:"queueDatabaseAction",value:function queueDatabaseAction(databaseAction){if(!this.resolvingActionPromise){this.databaseActions.push(databaseAction);}else {this.databaseActions.unshift(databaseAction);}if(!this.processingOn){this.processingOn=true;this.processNextDatabaseActionWhenFree();}}},{key:"throwIfDeletedOrClosed",value:function throwIfDeletedOrClosed(){if(this.deleted){throw new DOMException("The underlying IndexedDB database '".concat(this.name,"' has been deleted. You'll have to create the database using Database.open(), and then use the returned Database instance to perform any further actions on the underlying database."));}if(this.closed){throw new DOMException("The underlying IndexedDB database '".concat(this.name,"' has been closed. You'll have to open a new connection using Database.open(), and then use the returned Database instance to perform any further actions on the underlying database."));}}},{key:"removeFromOpenConnections",value:function removeFromOpenConnections(){FrontendDB.openConnections.splice(FrontendDB.openConnections.indexOf(this.name),1);}},{key:"close",value:function close(){this.throwIfDeletedOrClosed();this.removeFromOpenConnections();this.idb.close();}},{key:"_delete",value:function _delete(){var _this3=this;this.throwIfDeletedOrClosed();return new Promise(function(resolve,reject){// The close() method here is necessary because, as stated in the spec,
  // if the underlying IndexedDB database has open connections (that don't
  // close in response to the versionchange event triggered by
  // deleteDatabase()), the deletion of the database, and likewise, it's
  // 'success' event would be blocked until the closure happens.
  _this3.close();var request=indexedDB.deleteDatabase(_this3.name);request.onsuccess=function(e){_this3.removeFromOpenConnections();_this3.idb=null;_this3.stores={};_this3.deleted=true;resolve();};request.onerror=function(e){reject(e.target.error);};});}},{key:"_versionChange",value:function _versionChange(versionChangeHandler){var _this4=this;return new Promise(function(resolve,reject){_this4.close();var request=indexedDB.open(_this4.name,_this4.idb.version+1);request.onupgradeneeded=function(e){_this4.idb=e.target.result;try{var returnValue=versionChangeHandler();_this4.storeNames=_this4.idb.objectStoreNames;e.target.transaction.oncomplete=function(e){resolve(returnValue);};}catch(e){reject(e);}};request.onerror=function(e){reject(e);};});}},{key:"createIDBStore",value:function createIDBStore(storeName,autoIncrementOrKeyPath,indexes){var options={};if(typeof autoIncrementOrKeyPath==='boolean'){options.autoIncrement=autoIncrementOrKeyPath;}else if(typeof autoIncrementOrKeyPath==='string'){options.keyPath=autoIncrementOrKeyPath;}var store=this.idb.createObjectStore(storeName,options);// If provided, create all the desired indexes on the store.
  if(indexes){var _iterator=_createForOfIteratorHelper(indexes),_step;try{for(_iterator.s();!(_step=_iterator.n()).done;){var index=_step.value;store.createIndex(index,index);}}catch(err){_iterator.e(err);}finally{_iterator.f();}}return store;}// This method is deliberately made public, since it's used by the store.ts
  // file — specifically in the copy() method.
  },{key:"_createStore",value:function(){var _createStore2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(storeName,schema,autoIncrementOrKeyPath,indexes){var dbStore;return _regeneratorRuntime().wrap(function _callee2$(_context2){while(1){switch(_context2.prev=_context2.next){case 0:this.throwIfDeletedOrClosed();_context2.next=3;return this._versionChange(this.createIDBStore.bind(this,storeName,autoIncrementOrKeyPath,indexes));case 3:dbStore=new FrontendDBStore(this,storeName,schema);this.stores[storeName]=dbStore;return _context2.abrupt("return",dbStore);case 6:case"end":return _context2.stop();}}},_callee2,this);}));function _createStore(_x,_x2,_x3,_x4){return _createStore2.apply(this,arguments);}return _createStore;}()},{key:"getIDBObjectStore",value:function(){var _getIDBObjectStore=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(storeName,mode){return _regeneratorRuntime().wrap(function _callee3$(_context3){while(1){switch(_context3.prev=_context3.next){case 0:return _context3.abrupt("return",this.idb.transaction(storeName,mode).objectStore(storeName));case 1:case"end":return _context3.stop();}}},_callee3,this);}));function getIDBObjectStore(_x5,_x6){return _getIDBObjectStore.apply(this,arguments);}return getIDBObjectStore;}()// When a request is made to obtain a store, via this method, only then must
  // the internal stores map be populated with a DatabaseStore instance for
  // that IndexedDB object store. Hence, we could say that our computation of
  // stores is 'lazy'.
  },{key:"_getStore",value:function(){var _getStore2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(storeName){return _regeneratorRuntime().wrap(function _callee4$(_context4){while(1){switch(_context4.prev=_context4.next){case 0:this.throwIfDeletedOrClosed();if(!this.existsStore(storeName)){_context4.next=4;break;}if(!this.stores[storeName]){this.stores[storeName]=new FrontendDBStore(this,storeName);}return _context4.abrupt("return",this.stores[storeName]);case 4:throw new DOMException("Object store '".concat(storeName,"' doesn't exist. Create it first using createStore()."));case 5:case"end":return _context4.stop();}}},_callee4,this);}));function _getStore(_x7){return _getStore2.apply(this,arguments);}return _getStore;}()},{key:"deleteIDBObjectStore",value:function deleteIDBObjectStore(storeName){return this.idb.deleteObjectStore(storeName);}},{key:"_deleteStore",value:function(){var _deleteStore2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(storeName){return _regeneratorRuntime().wrap(function _callee5$(_context5){while(1){switch(_context5.prev=_context5.next){case 0:this.throwIfDeletedOrClosed();_context5.next=3;return this._versionChange(this.deleteIDBObjectStore.bind(this,storeName));case 3:delete this.stores[storeName];case 4:case"end":return _context5.stop();}}},_callee5,this);}));function _deleteStore(_x8){return _deleteStore2.apply(this,arguments);}return _deleteStore;}()},{key:"_existsStore",value:function(){var _existsStore2=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(storeName){return _regeneratorRuntime().wrap(function _callee6$(_context6){while(1){switch(_context6.prev=_context6.next){case 0:this.throwIfDeletedOrClosed();return _context6.abrupt("return",this.storeNames.contains(storeName));case 2:case"end":return _context6.stop();}}},_callee6,this);}));function _existsStore(_x9){return _existsStore2.apply(this,arguments);}return _existsStore;}()}],[{key:"open",value:/**
      * Opens a new connection to the given database. If the database doesn't
      * exist already, a new one is created. Otherwise, the existing database is
      * returned back (asynchronously). This is purely the default behavior of
      * the IndexedDB API's open() method.
      */function open(dbName){if(FrontendDB.openConnections.includes(dbName)){throw new DOMException("Connection to database '".concat(dbName,"' already exists. A connection to a database must be closed before a new one can be opened."));}FrontendDB.openConnections.push(dbName);return new Promise(function(resolve,reject){var request=indexedDB.open(dbName);request.onsuccess=function(e){resolve(new FrontendDB(e.target.result));};request.onerror=function(e){reject(e);};});}},{key:"exists",value:function(){var _exists=_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(dbName){var databaseInfoList;return _regeneratorRuntime().wrap(function _callee7$(_context7){while(1){switch(_context7.prev=_context7.next){case 0:_context7.next=2;return indexedDB.databases();case 2:databaseInfoList=_context7.sent;return _context7.abrupt("return",databaseInfoList.some(function(database){return database.name===dbName;}));case 4:case"end":return _context7.stop();}}},_callee7);}));function exists(_x10){return _exists.apply(this,arguments);}return exists;}()}]);return FrontendDB;}();_defineProperty(FrontendDB,"openConnections",[]);

  FrontendDB.isGreaterThan=isGreaterThan,FrontendDB.isGreaterThanEqualTo=isGreaterThanEqualTo;FrontendDB.isLessThan=isLessThan;FrontendDB.isLessThanEqualTo=isLessThanEqualTo;FrontendDB.isEqualTo=isEqualTo;FrontendDB.isLike=isLike;FrontendDB.hasKeys=hasKeys;FrontendDB.FrontendDBStore=FrontendDBStore;

  return FrontendDB;

}));
