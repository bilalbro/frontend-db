import { Action } from './types';

class ActionQueue
{
   private actionsList: Action[][] = [];
   private isQueueing = false;
   private isProcessing = false;

   getActionWrapper(internalFunction: Function, thisValue: any)
   {
      var _this = this;
      return function(): Promise<any> {
         var action: Action = {} as Action;
         var promise = new Promise((resolve, reject) => {
            action = {
               function: internalFunction,
               thisValue: thisValue,
               arguments: Array.prototype.slice.call(arguments),
               resolve: resolve,
               reject: reject
            }
         });
         _this.queueAction(action);
         return promise;
      }
   }

   private queueAction(action: Action)
   {
      if (!this.isQueueing) {
         this.isQueueing = true;
         this.actionsList.unshift([]);
      }
      this.actionsList[0].push(action);

      if (!this.isProcessing) {
         this.isProcessing = true;
         this.processNextActionWhenFree();
      }
   }

   private dequeueAction()
   {
      var action = this.actionsList[0].shift() as Action;

      // If the array gets empty after dequeuing the action, remove it as well.
      if (this.actionsList[0].length === 0) {
         this.actionsList.shift();
      }

      return action;
   }

   private processNextActionWhenFree()
   {
      setTimeout(async () => {
         this.isQueueing = false;
         var action = this.dequeueAction();

         try {
            var returnValue = await action.function.apply(
               action.thisValue,
               action.arguments
            );
            action.resolve(returnValue);
         }

         // If an error occurs while executing an operation, then the entire
         // chain of actions must be brought down to keep the integrity of the 
         // application. This might be changed in the future, but for now, this
         // is the most sensible approach.
         catch (e) {
            this.actionsList = [];
            action.reject(e);
         }

         finally {
            setTimeout(() => {
               if (!this.actionsList.length) {
                  this.isProcessing = false;
               }
               else {
                  this.processNextActionWhenFree();
               }
            }, 0);
         }
      }, 0);
   }
}

export default ActionQueue;