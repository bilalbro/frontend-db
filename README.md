# FrontendDB

> ## Table of contents
> - [What exactly is it?](#What_exactly_is_it)
> - [Motivation](#Motivation)
> - [Why re-invent the wheel?](#Why_re-invent_the_wheel)
> - [Technologies used](#Technologies_used)
> - [API](#API)
>- [A little about the library](#API)


## What exactly is it?
`FrontendDB` is a very simple and intuitive wrapper over the arguably complex and low-level `IndexedDB` API.

## Motivation
As you may know, `IndexedDB` is a relatively-modern browser API to allow for storing web app data on the client-side. However, it is a bit complex and low-level if we compare it to other browser APIs and therefore does require a nice wrapper for us to be able to intuitively work with it.

Digging into this idea more, `IndexedDB` is entirely based on **events**, which makes sense because there is much more to it than *just* a success or error occurence for a given operation.

However, working with events, in a nested style, is not always the simplest thing to do, is it? It can often lead to ***spaghetti code*** due to the nature of nested callbacks, which can further lead to difficult-to-read code and difficult-to-debug errors. Such a code can *never* be DRY, and that's a fact!

Any intuitive wrapper over `IndexedDB` would always turn to using the extremely powerful and expressive `Promise` API to simplify the overall interface.

And that's exactly what I did.

Along with the usage of promises, creating an intuitive wrapper class over `IndexedDB` with easy-to-reason methods drastically reduces the complexity of working with this powerful frontend storage medium and thereby improves the developer experience in working with it.

## Why re-invent the wheel?

At this stage, you might be thinking as to why exactly did I spend my time re-inventing the wheel for a wrapper over `IndexedDB` when there are already many useful libraries out there for this purpose.

Yes, there are libraries out there. Yes, I could've used them instead of creating my own. Yes, they might be better than mine.

But my goal wasn't to get something *just done*. My goal wasn't to *just* store data easily using `IndexedDB`.

My goal was to learn.

My goal was to truly understand the `IndexedDB` API.

My goal was to experience and possibly appreciate the power of TypeScript.

My goal was to abstract a complex API into a simple wrapper.

My goal was to create something which I could thereafter test using some testing framework. 

My goal was to create software.

My goal was to improve as a software developer.

And with the development of `FrontendDB`, all these goals have been accomplished. That I can say for sure. 🙂

I strongly believe that using libraries created by other people, and therefore keeping yourself from re-inventing the wheel, is a damn good thing.

But this only holds if you are damn confident with the underlying concepts used by the library. Or stated another way, this only holds if you know that, given the time, you could build a similar library yourself.

In the back of your mind, you should be able to automatically reason how a given feature in the library works, or might work.

As a simple example to help clarify my point: React is a jaw-dropping innovation in the JavaScript world, which newbies MUST surely learn. But if you start using React, and yet you don't know what closures, the event loop, DOM mutation methods, the Events API, and all other nice JavaScript-things are, there's absolutely no point of using, even learning, React.

Anyhow, this is really nice topic for debate, which I can engage in at CodeGuage's blog at Medium some other day, so let's keep it till here. 🙂

## Technologies used

### 1. **TypeScript**

For a long time, I had been thinking about using TypeScript in some project of mine, but not without a good reason to use it. Yes, somewhere I did feel that using TypeScript might increase the overall development complexity and time, but still I wanted to experience it at least once before giving off any decisive judgements.

And `FrontendDB` was the best place to start off.

As it turns out, I thoroughly enjoyed coding in TypeScript. Contrary to my feelings, it actually reduced the overall complexity of the library and reduced the time to code it.

So clearly, for the future, if I ever want to create a library for JavaScript, I'd go hands-down with TypeScript. The benefits it offers are immense and quite necessary for complex program development.

### 2. **`IndexedDB`**

Obviously, since `FrontendDB` is a wrapper over `IndexedDB`, it's quite clear that the library internally uses `IndexedDB` to carry out given operations.

### 3. **rollup.js**

For the bundling, I used **rollup.js**, which I've been using for quite a while now, and kind-of enjoy using. It's simple, arguably quick enough for me, and capable of fitting to my needs.

*So why not stick to it for the time being?*

## API

The documentation of the API will be done in `API.md`. (I haven't created it now, but will do so very soon.)

## A little about the library

It's worthwhile to talk here about the architecture of this library.

- At a time, there can be **one and only one connection** to a given database.

   For `IndexedDB`, it's possible to have multiple connections to a given database, but this can lead to a few problems in `FrontendDB`, likewise I sticked to the rule of allowing only one connection at a time.

- If another connection is desired, the previous one must be **closed**.

- All operations should ideally be performed using the **`await` keyword**, to simplify the code using `FrontendDB`.

- If, somehow, using `await` isn't possible, the API can be **used in a synchronous fashion** as well. However, there is no need to nest operations within each other, since the operations are all queued up and executed in the order they are called, with preference being given to nested calls.

- First, stores are created, and then records are added.

- Any **errors occuring in any operation whatsoever are thrown** by `FrontendDB`. Hence, if you're using `await`, wrap the entire code in `try...catch`, or if you're using `Promise` directly, add a `catch()` block.
