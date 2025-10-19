/**
 * Types for Social Network / Contacts API
 */

import type { SAID, AID } from '../../types';

// ---------- Core domain ----------
export type Contact = {
  id: AID;
  name: string;            // alias; mutable via a contact profile fact
};

export type Schema = {
  id: SAID;
  title: string;
  description?: string;
  // optional: jsonSchema, version, etc.
};

export type Fact<T = any> = {
  id: SAID;                // SAID of the fact body (stable content id)
  schemaId: SAID;          // SAID of schema
  label: string;           // e.g. "profile.name", "dob", "email.home"
  data: T;                 // schema-validated payload (opaque to API)
  createdAt: string;       // ISO, supplied by caller; API won't set time in model
};

// A FactChain is an append-only TEL per (contactId, chainId). Latest head is current view.
export type FactChainInfo = {
  id: SAID;                // TEL id (SAID of inception)
  label: string;           // human label for the chain (e.g. "profile", "contact-details")
  contactId: AID;
};

export interface FactChain {
  readonly info: FactChainInfo;

  addFact(fact: Fact): Promise<void>;                 // append to TEL
  removeFact(factId: SAID): Promise<void>;            // append a tombstone entry
  getFact(factId: SAID): Promise<Fact | undefined>;
  listFacts(): Promise<Fact[]>;                       // head view (respect tombstones)
  getFactsForSchema(schemaId: SAID): Promise<Fact[]>;
}

// ContactDetails is a namespace of chains for a contact (multiple chains allowed).
export interface ContactDetails {
  contactId: AID;

  createFactChain(label: string): Promise<FactChainInfo>;
  getFactChain(chainId: SAID): Promise<FactChain>;
  listFactChains(): Promise<FactChainInfo[]>;
}

// Lightweight CRUD for contacts; *id* is the AID.
export interface Contacts {
  list(): Promise<Contact[]>;
  add(contact: Contact): Promise<void>;              // idempotent on same AID
  remove(id: AID): Promise<void>;                    // soft-remove (append)
  get(id: AID): Promise<Contact | undefined>;
}

// ---------- Groups ----------
export type Group = {
  id: SAID;                 // TEL id
  name: string;
  parentGroup?: SAID;       // tree or DAG; omit for roots
  members: AID[];           // computed view = head state (latest TEL entry)
};

export type ResolvedGroup = {
  group: Group;
  children: ResolvedGroup[];
};

export interface Groups {
  list(): Promise<Group[]>;
  save(group: Group): Promise<Group>;                // upsert: append new head for TEL
  remove(id: SAID): Promise<void>;                   // append tombstone head
  get(id: SAID): Promise<Group | undefined>;
  resolve(id: SAID): Promise<ResolvedGroup>;         // recursively expand via parent/children
}

// ---------- Graph export (for viz) ----------
export type GraphNode =
  | { type: 'contact'; id: AID; label: string }
  | { type: 'group';   id: SAID; label: string };

export type GraphEdge =
  | { type: 'memberOf'; from: AID;  to: SAID }       // contact -> group
  | { type: 'childOf'; from: SAID; to: SAID }        // group -> parent group
  | { type: 'hasFact'; from: AID;  to: SAID };       // contact -> fact SAID

export interface SocialGraphExport {
  nodes(): Promise<GraphNode[]>;
  edges(): Promise<GraphEdge[]>;
}

// ---------- Facade ----------
export interface SocialNetworkApi {
  contacts: Contacts;
  groups: Groups;
  details(contactId: AID): Promise<ContactDetails>;
  schemas: {
    add(schema: Schema): Promise<void>;
    get(id: SAID): Promise<Schema | undefined>;
    list(): Promise<Schema[]>;
  };
  graph: SocialGraphExport;
}
