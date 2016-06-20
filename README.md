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

State is the most basic type in Vry. It allows you to create instances of a type with defaults in place, identify instances, merge them and serialize them back to plain javascript objects.

### var state = State.create(name, defaults)

Create a new type of State. Returns an object with methods to work with the created state type. 

- `name` - (required) name of the state type
- `defaults` - plain object or `Immutable.Iterable` of default key-value pairs that are used as the base of every instance

```js
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

**Note:** with the current implementation a `Model` instance will also pass this test.

```js
const notStateUser = Immutable.Map({ name: 'Homer '})
const user = User.factory(notStateUser)

console.log(State.isState(notStateUser)) // false
console.log(State.isState(user)) // true
```

### var defaults = state.defaults()

Returns the defaults as defined with `State.create`, represented as an `Immutable.Map`.

```js
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

### var name = state.typeName()

Returns the name (string) as defined with `State.create`.

```js
const User = Vry.State.create('user', {
  name: 'New user',
  email: null,
  activated: false
})

const name = User.typeName()

console.log(name) // 'user'
```

### var instance = state.factory(attributes, options)

Returns a new instance (`Immutable.Map`) of the state type using the type's defaults as a base and populated with the passed attributes. It also adds some meta data to keep track of the instance identity.

- `attributes` - `object` or any `Immutable.Iterable` of key-value pairs with which the type defaults will be overridden and amended. Nested `object`s and `array`s are converted to `Immutable.Map`and `Immutable.List` respectively, while any `Immutable.Iterable`s will be left untouched. 
- `options` - `object` with the following keys
  - `parse` - `function` as described by `state.parse` that is to be used instead of `state.parse` to transform the passed in `attributes`.

```js
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

### var isTypeInstance = state.instanceOf(maybeInstance)

Returns a boolean indicating whether the passed value is an "instance" of this state. 

- `maybeInstance` - any value

```js
const user = User.factory()
const post = Post.factory()

console.log(User.instanceOf(user)) // true
console.log(User.instanceOf(post)) // false
```

### var isCollectionOfType = state.collectionOf(maybeCollection)

Returns a boolean indicating whether the passed value is an `Immutable.Collection` (and so by extension things like `Immutable.List`, `Immutable.Set`, etc) of which all values are an instance of that state. Basically `collection.every(state.instanceOf)`.

- `maybeCollection` - any value

```js
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

### var transformedMap = state.parse(attributes)

A place to implement custom parsing behaviour. This method gets called by `state.factory` unless it got called with a `parse` option, in which case `state.parse` will be ignored. 

Must return a `Immutable.Iterable`. Any `Immutable.Seq`s returned are converted into `Immutable.Map` and `Immutable.List`. By default this method is a no-op, simply returning the attributes passed in.

- `attributes` - (required) `Immutable.Map` of attributes. Any plain `object`s or `array`s are represented as `Immutable.Seq`s (`Keyed` and `Indexed` respectively), making it easy to deal with nested collections with a uniform API and giving you the opportunity to convert them to something else like a `Set`.

```js
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

### var serialized = state.serialize(instance, options)

Returns the passed instance as a plain object. 

- `instance` - (required) `Immutable.Iterable` that represents an instance created with `state.factory`
- `options` - `object` with the following keys
  - `omitMeta` - when falsey the identity meta data will be included in the result. Defaults to `true`

```js
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

### var mergedInstance = state.merge(target, source)

Merges anything from plain attributes to other instances (even of a different type) with an existing instance. Any attributes present in the `source` will override the ones in `target`, except for the meta data of `target`.

- `target` - (required) `Immutable.Iterable` that represents an instance created with `state.factory` which will be the target of this merge
- `source` - (required) `object` or `Immutable.Iterable` of attributes to be merged with the target

```js
const homer = User.factory({
  name: 'Homer'
})

const activatedHomer = User.merge(homer, {
  activated: true
})

console.log(activatedHomer)
//  Immutable.Map {
//    name: 'Homer',
//    email: null,
//    activated: true
//  }
```

## Model

The `Model` is a lot like `State`, but goes beyond the basics of just maintaining an entity's identity and defaults. So far that means enhanced parsing and serialising of nested models within other models by use of a `Schema`. Soon merging will join that club too, as well the concept of comparing instances by id attributes. Any other enhancements to working with entities that go beyond the logic of a single depth entity (`State`) that we'll make in the future will probably end up on `Model` too. 

### var model = Model.create(spec)

Create a new type of Model. Returns an object with methods to work with the created model type.

- `spec` - (required) string or object - either a string with the name of the model type or an object with values for the following properties:
  - `typeName` - (required) name of the model type
  - `defaults` - plain object or `Immutable.Iterable` of default key-value pairs that are used as the base of every instance. Same as `defaults` argument for `State.create(name, defaults)`
  - `schema` - schema definition that describes any nested models. See the documentation for [`Schema`](#schema).

```js
const Vry = require('vry')

const User = Vry.Model.create({
  typeName: 'user',

  defaults: {
    name: 'New user',
    email: null,
    activated: false
  }
})

const Post = Vry.Model.create({
  typeName: 'post',

  defaults: {
    title: 'Untitled post',
    body: '',
    author: null
  },

  schema: {
    author: User
  }
})
```

Note: All methods are bound to the model itself, so you can call them without binding them manually. For the unbound versions, see the prototype of the created type (`model.prototype`). Methods added after creation are not bound automatically.

### var isModelInstance = Model.isModel(maybeModel)

Returns a boolean indicating whether the passed value is an instance of **any** model type. It's useful where `Immutable.Map.isMap` is not sufficient for your logic, for example when you need to know the meta attributes are present.

**Note:** with the current implementation a `State` instance will also pass this test.

- `maybeModel` - any value

```js
const notStateUser = Immutable.Map({ name: 'Homer '})
const user = User.factory(notStateUser)

console.log(Model.isModel(notStateUser)) // false
console.log(Model.isModel(user)) // true
```

### var defaults = model.defaults()

Returns the defaults as defined with `Model.create`, represented as an `Immutable.Map`.

```js
const User = Vry.Model.create({
  typeName: 'user',

  defaults: {
    name: 'New user',
    email: null,
    activated: false
  }
})

const defaults = User.defaults()

console.log(defaults)
//  Immutable.Map {
//    name: 'New user',
//    email: null,
//    activated: false
//  }
```

### var typeName = model.typeName()

Returns the name (string) as defined with `Model.create`.

```js
const User = Vry.Model.create({
  typeName: 'user',

  defaults: {
    name: 'New user',
    email: null,
    activated: false
  }
})

const typeName = User.typeName()

console.log(typeName) // 'user'
```

### var instance = model.factory(attributes, options)

Returns a new instance (`Immutable.Map`) of the model using the model's defaults as a base and populated with the passed attributes. It also adds some meta data to keep track of the instance identity and uses the defined schema to defer creating nested models with their own `factory` methods.

- `attributes` - `object` or any `Immutable.Iterable` of key-value pairs with which the type defaults will be overridden and amended. The model's schema is used to handle the creation of nested types. Nested `object`s and `array`s are converted to `Immutable.Map`and `Immutable.List` respectively, while any `Immutable.Iterable`s will be left untouched. 
- `options` - `object` with the following keys
  - `parse` - `function` as described by `state.parse` that is to be used instead of `state.parse` to transform the passed in `attributes`.

```js

const User = Vry.Model.create({
  typeName: 'user',

  defaults: {
    name: 'New user',
    email: null,
    activated: false
  }
})

const Post = Vry.Model.create({
  typeName: 'post',

  defaults: {
    title: 'Untitled post',
    body: '',
    author: null
  },

  schema: {
    author: User
  }
})

const post = Post.factory({
  title: 'A Totally Great Post',
  author: {
    name: 'Homer'
  }
})

console.log(post)
//  Immutable.Map {
//    title: 'A Totally Great Post',
//    body: '',
//    author: Immutable.Map {
//      name: 'Homer',
//      email: null,
//      activated: false
//    }
//  }
```

### var isTypeInstance = model.instanceOf(maybeInstance)

Returns a boolean indicating whether the passed value is an "instance" of this type. 

- `maybeInstance` - any value

```js
const user = User.factory()
const post = Post.factory()

console.log(User.instanceOf(user)) // true
console.log(User.instanceOf(post)) // false
```

### var isCollectionOfType = model.collectionOf(maybeCollection)

Returns a boolean indicating whether the passed value is an `Immutable.Collection` (and so by extension things like `Immutable.List`, `Immutable.Set`, etc) of which all values are an instance of that type. Basically `collection.every(model.instanceOf)`.

- `maybeCollection` - any value

```js
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

### var transformedMap = model.parse(attributes)

A place to implement custom parsing behaviour. This method gets called by `type.factory` unless it got called with a `parse` option, in which case `type.parse` will be ignored. 

Must return a `Immutable.Iterable`. Any `Immutable.Seq`s returned are converted into `Immutable.Map` and `Immutable.List`.

By default it uses the `Schema` of the model to defer the parsing of other nested models to their own methods. 

- `attributes` - (required) `Immutable.Map` of attributes. Any plain `object`s or `array`s are represented as `Immutable.Seq`s (`Keyed` and `Indexed` respectively), making it easy to deal with nested collections with a uniform API and giving you the opportunity to convert them to something else like a `Set`.
- `options` - `object` with values for the following keys
  - `schema` - schema definition that describes any nested models, to be used instead of the schema defined for the model. See the documentation for [`Schema`](#schema).

```js
const User = Vry.Model.create({
  typeName: 'user',

  defaults: {
    name: 'New user',
    email: null,
    activated: false
  }
})

User.parse = (attributes) => {
  // Make sure names start with a capital
  const name = attributes.get('name')

  return attributes.set('name', name.charAt(0).toUpperCase() + name.slice(1))
}

const Post = Vry.Model.create({
  typeName: 'post',

  defaults: {
    title: 'Untitled post',
    body: '',
    author: null
  },

  schema: {
    author: User
  }
})

const post = Post.factory({
  title: 'Nice post',
  author: {
    name: 'homer'
  }
})

console.log(post.get('user').get('name')) // "Homer"
```

### var serialized = model.serialize(instance, options)

Returns the passed instance as a plain object. Defers the serialising of nested types to their `serialize` methods when defined (see [`Schema`](#schema)).

- `instance` - (required) `Immutable.Iterable` that represents an instance created with `state.factory`
- `options` - `object` with the following keys
  - `omitMeta` - when falsey the identity meta data will be included in the result. Defaults to `true`
  - `schema` - schema definition that describes any nested models, to be used instead of the schema defined for the model. See the documentation for [`Schema`](#schema).

```js
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

### var mergedInstance = model.merge(target, source)

Merges anything from plain attributes to other instances (even of a different type) with an existing instance. Any attributes present in the `source` will override the ones in `target`, except for the meta data of `target`.

- `target` - (required) `Immutable.Iterable` that represents an instance created with `model.factory` which will be the target of this merge
- `source` - (required) `object` or `Immutable.Iterable` of attributes to be merged with the target

```js
const homer = User.factory({
  name: 'Homer'
})

const activatedHomer = User.merge(homer, {
  activated: true
})

console.log(activatedHomer)
//  Immutable.Map {
//    name: 'Homer',
//    email: null,
//    activated: true
//  }
```

## Ref

### var ref = Ref.create(path)

### var subject = Ref.resolve(ref, source)

### var collection = Ref.resolveCollection(ref, source)

### var subject = Ref.replaceIn(source, subject, ...paths)


## Schema 

A `Schema` is an object to describe how other types are embedded within a given type. It specifies the shape, as well as how the embedded types should be created, identified and serialized back to plain objects and arrays. 

Each `Model` type has one, detailing what other `Model` types are embedded within it.

Schema's are plain javascript objects with either a type definition (see `Schema.isType`) or a nested schema specified as values. There isn't a `Schema.create` method to create schemas (yet).

```js
// user has no embedded types
const postSchema = {
  title: {
    factory(value) { return value.toUpperCase() },
    serialize(value) { return value.toLowerCase() }
  },

  author: User, // Types created with `Model.create` and `State.create` are valid type definitions!

  // use `Schema.listOf` and `Schema.setOf` to convienently create types for nested 
  comments: Schema.listOf(Comment),

  metadata: { // schemas can be nested
    tags: Schema.setOf(Tag)
  }
}
```

### var isSchema = Schema.isSchema(maybeSchema)

Returns whether a value is a valid schema definition. A valid schema is an `object` with either a valid type definition (see `Schema.isType`) or a nested schema. 

- `maybeSchema` - any value

```js
const postSchema = {
  title: { // valid type definition
    factory(value) { return value.toUpperCase() },
    serialize(value) { return value.toLowerCase() }
  }
}

const userSchema = {
  name: "woohoo" // not a valid type definition
}

console.log(Schema.isSchema(postSchema)) // true
console.log(Schema.isSchema(userSchema)) // false
```

### var isType = Schema.isType(maybeType)

Returns whether a value is a valid type definition. 

- `maybeType` - any value

A valid type definition is an `object` with at least one of the following keys defined as described:

- `factory` - function with the signature `var instance = function(plainValue, options)`
- `serialize` - function with the signature `var plainValue = function(isntance, options)`

The following keys can be defined as well

- `instanceOf` - function with signature `var isInstance = function(maybeInstance)`

### var listSchema = Schema.listOf(definition)

Returns a schema definition (`IterableSchema`) describing an `Immutable.List` of a schema or type.

- `definition` - either a valid schema or type definition

### var setSchema =  Schema.setOf(definition)

Returns a schema definition (`IterableSchema`) describing an `Immutable.Set` of a schema or type.

- `definition` - either a valid schema or type definition

### var orderedSetSchema = Schema.orderedSetOf(definition)

Returns a schema definition (`IterableSchema`) describing an `Immutable.OrderedSet` of a schema or type.

- `definition` - either a valid schema or type definition

### var isIterableSchema = Schema.isIterableSchema(maybeSchema)

Returns whether the value is a special `IterableSchema`, which are the special schema definitions returned by methods like `Schema.listOf`.

- `maybeSchema` - any value

