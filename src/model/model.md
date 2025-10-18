# Model

This model describes how we can leverage SAIDs and our keri schemas work to ensure we have a SAID (unique ID) representing all of our core data structures.

We should be sure to follow the [KERI specification](./reference.md) any time we're not sure what to do.

This also should let us easily store these as ACDCs if we need to (but we don't have to). Ulimatley that would just be an implementation detail behind some clean, simple APIs.

# Contacts

Contacts are represented as AIDs (unique IDs). 
My contacts are just literally a set of unique IDs [abc, 123, xyz].

# Groups

Groups are just collections of those IDs. 

Groups should be modelled as TELs (they have a unique ID based on their inception event), and their membership is just the list of IDs contained in that group. We treat the "latest" (most recent) entry in that group as the "winner". 

E.g., group "foo" (where 'foo' is just an alias for the TEL Id), may start with the membership at seq 0 with value [].
We then append to that TEL to have seq no 1 to be [x,y], seq no 2 to be [x,b], showing that group 'foo' currently has membership [x,b]

# Aliases

Aliases are just bidirectional associations of friendly names against IDs.

These are modeled in a similar was as groups, where we can have any number of alias TELs, which give us a kind of 'namespaces'.

My 'friends' aliases might map nicknames against contact IDs - things like "booger" or "stinky" are associated with contact IDS (and those contact IDs map back to the names).

This map is just another data structure where the 'latest' in the TEL is the current representation.

Because these are just mappings of names to IDs, I can have a base 'aliases' TEL which maps aliases of TELs to their names (e.g. 'friends', 'colleagues', 'group-A')

# Networks and Attributes modeled as Relationships

We want to map relationships as associations of SAIDs. For any given SAID, we can get the array of SAIDs associated with that Id.

Because all data is represented by SAIDs, this will allow us to:

1. association other arbitrary data against a SAID (e.g. contact details, messages, notes). This allows us to build up data as we discover it about any entity.

2. model tree structures. e.g., parent nodes are one-to-many associations of a node to a child. We can model cyclic relationships with the same one-to-many relationship, but call that "parents" rather than "children". In a practical sense, this can allow us to map out networks (groups of groups ..)

