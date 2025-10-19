# Status

We'll keep this status document up-to-date and terse.

The purpose of this 'status' document is to serve as a link between our [model](./model.md) and [plan](./plan.md) with the actual deliverables -- that is, links to test code which demonstrates our use-cases.

## Key Status
About Keys: creating key pairs from seeds or mnumonics

## DB Status
About DB: Being able to store and retreive data (kels by ID, tels by ID, acdc by ID, etc)

something that can fetch data by an ID,
and which can write data by an ID

## Transport Status
About: sending events to recipients, and receiving events from recipients (both event-driven callbacks and pull models)

## KEL Status
About Kels: 
 * modeling the data structures in a type-safe way
 * modeling the operations on those data structures in a purely functional way (representing results as events, separate from side-effects)
 * combining the Kel operations with a DB and Transport instance to produce a KelAPI 

## Schema Status
About Schemas: A 'Data' operations which can derive schemas from json, validate json and schemas, saidify data

## TEL Status
About Tels: 
 * modeling the data structures in a type-safe way
 * modeling the operations on those data structures in a purely functional way (representing results as events, separate from side-effects)
 * combining the Kel operations with a DB and Transport instance to produce a TelAPI 

## ACDC Status
About ACDCs: 
 * modeling the data structures in a type-safe way
 * modeling the operations on those data structures in a purely functional way (representing results as events, separate from side-effects)
 * combining the Kel operations with a DB and Transport instance to produce an ACDCApi 