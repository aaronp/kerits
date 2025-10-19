/**
 * Social Network API - In-memory implementation
 *
 * This is a pure, in-memory implementation that can later be backed by KERI/ACDCs/TELs.
 */

import type {
    SocialNetworkApi,
    Contacts,
    Groups,
    ContactDetails,
    FactChain,
    FactChainInfo,
    SocialGraphExport,
    Contact,
    Group,
    Fact,
    Schema,
    ResolvedGroup,
    GraphNode,
    GraphEdge,
} from './types';
import type { AID, SAID } from '../../types';

// ============================================================================
// In-memory Contacts implementation
// ============================================================================

class InMemoryContacts implements Contacts {
    private contacts = new Map<AID, Contact>();

    async list(): Promise<Contact[]> {
        return Array.from(this.contacts.values());
    }

    async add(contact: Contact): Promise<void> {
        this.contacts.set(contact.id, contact);
    }

    async remove(id: AID): Promise<void> {
        this.contacts.delete(id);
    }

    async get(id: AID): Promise<Contact | undefined> {
        return this.contacts.get(id);
    }
}

// ============================================================================
// In-memory Groups implementation
// ============================================================================

class InMemoryGroups implements Groups {
    private groups = new Map<SAID, Group>();

    async list(): Promise<Group[]> {
        return Array.from(this.groups.values());
    }

    async save(group: Group): Promise<Group> {
        this.groups.set(group.id, group);
        return group;
    }

    async remove(id: SAID): Promise<void> {
        this.groups.delete(id);
    }

    async get(id: SAID): Promise<Group | undefined> {
        return this.groups.get(id);
    }

    async resolve(id: SAID): Promise<ResolvedGroup> {
        const group = this.groups.get(id);
        if (!group) {
            throw new Error(`Group ${id} not found`);
        }

        // Find all children (groups where parentGroup === id)
        const children: ResolvedGroup[] = [];
        for (const g of this.groups.values()) {
            if (g.parentGroup === id) {
                children.push(await this.resolve(g.id));
            }
        }

        return { group, children };
    }
}

// ============================================================================
// In-memory FactChain implementation
// ============================================================================

class InMemoryFactChain implements FactChain {
    readonly info: FactChainInfo;
    private facts = new Map<SAID, Fact>();
    private tombstones = new Set<SAID>();

    constructor(info: FactChainInfo) {
        this.info = info;
    }

    async addFact(fact: Fact): Promise<void> {
        this.facts.set(fact.id, fact);
        this.tombstones.delete(fact.id); // Un-remove if re-added
    }

    async removeFact(factId: SAID): Promise<void> {
        this.tombstones.add(factId);
    }

    async getFact(factId: SAID): Promise<Fact | undefined> {
        if (this.tombstones.has(factId)) {
            return undefined;
        }
        return this.facts.get(factId);
    }

    async listFacts(): Promise<Fact[]> {
        const facts: Fact[] = [];
        for (const [id, fact] of this.facts) {
            if (!this.tombstones.has(id)) {
                facts.push(fact);
            }
        }
        return facts;
    }

    async getFactsForSchema(schemaId: SAID): Promise<Fact[]> {
        const allFacts = await this.listFacts();
        return allFacts.filter(f => f.schemaId === schemaId);
    }
}

// ============================================================================
// In-memory ContactDetails implementation
// ============================================================================

class InMemoryContactDetails implements ContactDetails {
    readonly contactId: AID;
    private chains = new Map<SAID, InMemoryFactChain>();
    private chainCounter = 0;

    constructor(contactId: AID) {
        this.contactId = contactId;
    }

    async createFactChain(label: string): Promise<FactChainInfo> {
        const id = `chain-${this.contactId}-${this.chainCounter++}` as SAID;
        const info: FactChainInfo = {
            id,
            label,
            contactId: this.contactId,
        };

        const chain = new InMemoryFactChain(info);
        this.chains.set(id, chain);

        return info;
    }

    async getFactChain(chainId: SAID): Promise<FactChain> {
        const chain = this.chains.get(chainId);
        if (!chain) {
            throw new Error(`FactChain ${chainId} not found`);
        }
        return chain;
    }

    async listFactChains(): Promise<FactChainInfo[]> {
        return Array.from(this.chains.values()).map(c => c.info);
    }
}

// ============================================================================
// In-memory SocialGraphExport implementation
// ============================================================================

class InMemorySocialGraphExport implements SocialGraphExport {
    constructor(
        private contacts: InMemoryContacts,
        private groups: InMemoryGroups,
        private detailsMap: Map<AID, InMemoryContactDetails>
    ) { }

    async nodes(): Promise<GraphNode[]> {
        const nodes: GraphNode[] = [];

        // Add contact nodes
        const contacts = await this.contacts.list();
        for (const contact of contacts) {
            nodes.push({
                type: 'contact',
                id: contact.id,
                label: contact.name,
            });
        }

        // Add group nodes
        const groups = await this.groups.list();
        for (const group of groups) {
            nodes.push({
                type: 'group',
                id: group.id,
                label: group.name,
            });
        }

        return nodes;
    }

    async edges(): Promise<GraphEdge[]> {
        const edges: GraphEdge[] = [];

        // Add memberOf edges (contact -> group)
        const groups = await this.groups.list();
        for (const group of groups) {
            for (const memberId of group.members) {
                edges.push({
                    type: 'memberOf',
                    from: memberId,
                    to: group.id,
                });
            }
        }

        // Add childOf edges (group -> parent group)
        for (const group of groups) {
            if (group.parentGroup) {
                edges.push({
                    type: 'childOf',
                    from: group.id,
                    to: group.parentGroup,
                });
            }
        }

        // Add hasFact edges (contact -> fact)
        for (const [contactId, details] of this.detailsMap) {
            const chains = await details.listFactChains();
            for (const chainInfo of chains) {
                const chain = await details.getFactChain(chainInfo.id);
                const facts = await chain.listFacts();
                for (const fact of facts) {
                    edges.push({
                        type: 'hasFact',
                        from: contactId,
                        to: fact.id,
                    });
                }
            }
        }

        return edges;
    }
}

// ============================================================================
// Main API Factory
// ============================================================================

export function createSocialNetwork(): SocialNetworkApi {
    const contacts = new InMemoryContacts();
    const groups = new InMemoryGroups();
    const schemas = new Map<SAID, Schema>();
    const detailsMap = new Map<AID, InMemoryContactDetails>();

    return {
        contacts,
        groups,

        async details(contactId: AID): Promise<ContactDetails> {
            let details = detailsMap.get(contactId);
            if (!details) {
                details = new InMemoryContactDetails(contactId);
                detailsMap.set(contactId, details);
            }
            return details;
        },

        schemas: {
            async add(schema: Schema): Promise<void> {
                schemas.set(schema.id, schema);
            },

            async get(id: SAID): Promise<Schema | undefined> {
                return schemas.get(id);
            },

            async list(): Promise<Schema[]> {
                return Array.from(schemas.values());
            },
        },

        graph: new InMemorySocialGraphExport(contacts, groups, detailsMap),
    };
}
