import FrontendDB, {
   isGreaterThan,
   isGreaterThanEqualTo,
   isLessThan,
   isLessThanEqualTo,
   isEqualTo,
   isLike,
   hasKeys,
   FrontendDBStore
} from '../src';

FrontendDB.isGreaterThan = isGreaterThan,
FrontendDB.isGreaterThanEqualTo = isGreaterThanEqualTo;
FrontendDB.isLessThan = isLessThan;
FrontendDB.isLessThanEqualTo = isLessThanEqualTo;
FrontendDB.isEqualTo = isEqualTo;
FrontendDB.isLike = isLike;
FrontendDB.hasKeys = hasKeys;
FrontendDB.FrontendDBStore = FrontendDBStore;

export default FrontendDB;