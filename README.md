# Vry

### Warning! Experimental: cool, but in progress of being built and figured out

Defining models using [Immutable.js][immutablejs], making it easier to define defaults, parsing, serialisation, merging, identifiying entities, etc. Models are stateless (aenemic), meaning the instances ([Immutable.Map](https://facebook.github.io/immutable-js/docs/#/Map)s) are passed to the Model's methods as the first argument and a new / updated version is returned. This makes them a great fit to implement [Redux reducers][redux].

This documentation is still incredibly sparse, but I'm tired of copying / pasting this between projects. Having a look at or running the tests is probably your best bet to get an idea of how it's supposed to work. While experimental the basic behaviours have been developed throughout a sequence of various projects, so **semver will be respected**.

To run tests run in project root:

```
npm install --dev
npm test
```


### Example

TBD

### Motivation

Working with a single state tree for your application state (like [Redux][redux]) is great, but requires changes to be immutable. Using [Immutable.js][immutablejs] makes for a great fit, however, all you get are basic constructs like `Map`, `List`, `Set`. And while there is a `Record` construct, it still means that a lot of generic behaviour for entities has to be written by hand. Through a sequence of projects this represents the basics that keep coming back.

### Ideas for future expansion

In addition to `State`:

- `Model` / `Schema` allowing for things like computed properties
- `Graph` / `Ref` making it easier to model state as graphs instead of trees
- `Collection` abstracting basic collection behaviour like storing lists of entities under multiple indexes, merging behaviour, etc.

	[redux]: http://redux.js.org/
	[immutablejs]: https://facebook.github.io/immutable-js/
