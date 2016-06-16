# Vry

### Warning! Experimental: cool, but in progress of being built and figured out

Defining models using [Immutable.js][immutablejs], making it easier to define defaults, parsing, serialisation, merging, identifiying entities, etc. Models are stateless (anaemic), meaning the instances ([Immutable.Map](https://facebook.github.io/immutable-js/docs/#/Map)s) are passed to the Model's methods as the first argument and a new / updated version is returned. This makes them a great fit to implement [Redux reducers][redux].

This documentation is still incredibly sparse, but I'm tired of copying / pasting this between projects. Having a look at or running the tests is probably your best bet to get an idea of how it's supposed to work. While experimental the basic behaviours have been developed throughout a sequence of various projects, so **semver will be respected**.

Use in your project:

```
npm install --save vry
```

To run tests in vry root:

```
npm install --dev
npm test
```


### Example

```js
const Invariant = require('invariant')
const Immutable = require('immutable');
const { State } = require('vry')

// define entities, by name and with defaults
const User = State.create('user', {
  id: null
  email: null,
  name: ''
})

// the factory accepts attributes and returns an instance 
const homer = User.factory({
  name: 'Homer Simpson'
})

Invariant(Immutable.Map.isMap(homer), 'instance is an Immutable.Map, plain and simple')

// add your own methods
User.hasEmail = function(user) {
  // make sure an actual user was passed
  Invariant(User.instanceOf(user), 'User required to check whether user has an email')
  
  return !!user.get('email')
}

const Post = State.create('post', {
  title: 'Untitled',
  author: null
})

const homersPost = Post.factory({
  // nest entities
  author: homer,

  // use any type of Immutable.Iterable
  tags: Immutable.Set(['homer', 'springfield', 'yellow'])
})

// serialize
const rawPost = Post.serialize(homersPost);

// anaemic models are great when combined with functional programming paradigms
const users = Immutable.List([homer]);

const usersWithEmails = users.filter(User.hasEmail);
```

### Motivation

Working with a single state tree for your application state (like [Redux][redux]) is great, but requires changes to be immutable. Using [Immutable.js][immutablejs] makes for a great fit, however, all you get are basic constructs like `Map`, `List`, `Set`. And while there is a `Record` construct, it still means that a lot of generic behaviour for entities has to be written by hand. Through a sequence of projects this represents the basics that keep coming back.

### Ideas for future expansion

In addition to `State`:

- `Model` / `Schema` allowing for things like computed properties
- `Graph` / `Ref` making it easier to model state as graphs instead of trees
- `Collection` abstracting basic collection behaviour like storing lists of entities under multiple indexes, merging behaviour, etc.

[redux]: http://redux.js.org/
[immutablejs]: https://facebook.github.io/immutable-js/

# API

## State

State is the most basic type in Vry. It allows you to create instances of a type with defaults in place, identify instances, merge them, serialize them back to plain javascript objects as well as spec.


### var type = State.create(name, defaults)

Create a new type of State. Returns an object with methods to work with the created state type. 

- `name` - (required) name of the state type
- `defaults` - plain object or `Immutable.Iterable` of default key-value pairs that are used as the base of every instance

```
const Vry = require('vry')

const User = Vry.State.create('user', {
  name: 'New user',
  email: null,
  activated: false
})
```

Note: All methods are bound to the state itself, so you can call them without binding them manually. For the unbound versions, see the prototype of the created type (`state.prototype`). Methods added after creation are not bound automatically.

### var isStateInstance = State.isState(maybeState)

Returns a boolean indicating whether the passed value is an instance of **any** state type. It's useful where `Immutable.Map.isMap` is not sufficient for your logic, for example when you need to know the meta attributes are present.

- `maybeState` - any value

```
const notStateUser = Immutable.Map({ name: 'Homer '})
const user = User.factory(notStateUser)

console.log(State.isState(notStateUser)) // false
console.log(State.isState(user)) // true
```

### var defaults = type.defaults()

Returns the defaults as defined with `State.create`, represented as an `Immutable.Map`.

```
const User = Vry.State.create('user', {
  name: 'New user',
  email: null,
  activated: false
})

const defaults = User.defaults()

console.log(defaults)
//  Immutable.Map {
//    name: 'New user',
//    email: null,
//    activated: false
//  }
```

### var name = type.typeName()

Returns the name (string) as defined with `State.create`.

```
const User = Vry.State.create('user', {
  name: 'New user',
  email: null,
  activated: false
})

const name = User.typeName()

console.log(name) // 'user'
```

### var instance = type.factory(attributes, options)

Returns a new instance (`Immutable.Map`) of the state type using the type's defaults as a base and populated with the passed attributes. It also adds some meta data to keep track of the instance identity.

- `attributes` - `object` or any `Immutable.Iterable` of key-value pairs with which the type defaults will be overridden and amended. Nested `object`s and `array`s are converted to `Immutable.Map`and `Immutable.List` respectively, while any `Immutable.Iterable`s will be left untouched. 
- `options` - `object` with the following keys
  - `parse` - `function` as described by `type.parse` that is to be used instead of `type.parse` to transform the passed in `attributes`.

```
const User = Vry.State.create('user', {
  name: 'New user',
  email: null,
  activated: false
})

const user = User.factory({
  name: 'Homer'
})

console.log(user)
//  Immutable.Map {
//    name: 'Homer',
//    email: null,
//    activated: false
//  }
```

### var isTypeInstance = type.instanceOf(maybeInstance)

Returns a boolean indicating whether the passed value is an "instance" of this type. 

- `maybeInstance` - any value

```
const user = User.factory()
const post = Post.factory()

console.log(User.instanceOf(user)) // true
console.log(User.instanceOf(post)) // false
```

### var isCollectionOfType = type.collectionOf(maybeCollection)

Returns a boolean indicating whether the passed value is an `Immutable.Collection` (and so by extension things like `Immutable.List`, `Immutable.Set`, etc) of which all values are an instance of that type. Basically `collection.every(type.instanceOf)`.

- `maybeCollection` - any value

```
const users = Immutable.List([
  User.factory(),
  User.factory()
])

const posts = Immutable.List([
  Post.factory(),
  Post.factory()
])

const mixed = Immutable.List([
  User.factory(),
  Post.factory()
])

console.log(User.collectionOf(users)) // true
console.log(User.collectionOf(posts)) // false
console.log(User.collectionOf(mixed)) // false
```

### var transformedMap = type.parse(attributes)

A place to implement custom parsing behaviour. This method gets called by `type.factory` unless it got called with a `parse` option, in which case `type.parse` will be ignored. 

Must return a `Immutable.Iterable`. Any `Immutable.Seq`s returned are converted into `Immutable.Map` and `Immutable.List`. By default this method is a no-op, simply returning the attributes passed in.

- `attributes` - (required) `Immutable.Map` of attributes. Any plain `object`s or `array`s are represented as `Immutable.Seq`s (`Keyed` and `Indexed` respectively), making it easy to deal with nested collections with a uniform API and giving you the opportunity to convert them to something else like a `Set`.

```
const User = Vry.State.create('user', {
  name: 'New user',
  email: null,
  activated: false
})

User.parse = (attributes) => {
  // Make sure names start with a capital
  const name = attributes.get('name')

  return attributes.set('name', name.charAt(0).toUpperCase() + name.slice(1))
}

const user = User.factory({
  name: 'homer'
})

console.log(user.get('name')) // "Homer"
```

### var serialized = type.serialize(instance, options)

Returns the passed instance as a plain object. 

- `instance` - (required) `Immutable.Iterable` that represents an instance created with `type.factory`
- `options` - `object` with the following keys
  - `omitMeta` - when falsey the identity meta data will be included in the result. Defaults to `true`

```
const user = User.factory({
  name: 'Homer'
})

const plainUser = User.serialize(user)

console.log(plainUser)
// {
//  name: 'Homer',
//  email: null,
//  activated: false
// }
```
