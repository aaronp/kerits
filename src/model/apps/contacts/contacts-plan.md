# KERI-Based Contacts API Implementation Plan

## 🎯 **Vision**

Transform the current in-memory contacts API into a **KERI-native implementation** where contacts are self-sovereign KERI identifiers (AIDs) with their own Key Event Logs (KELs) and Transaction Event Logs (TELs) for managing contact data and relationships.

## 🏗️ **Architecture Overview**

### **Core Components**

1. **Contact KELs** - Each contact is a KERI identifier with its own key lifecycle
2. **Contact TELs** - TEL chains manage contact profile data and relationships  
3. **Fact Chains** - Schema-validated data stored as TEL events
4. **Verification Layer** - Cryptographic integrity and authenticity verification
5. **Storage Layer** - Persistent storage for KEL and TEL data

### **Data Flow**

```
Contact Creation → KEL Inception → TEL Inception → Fact Chains → Verification
     ↓                ↓              ↓              ↓            ↓
  AID Generated → Key Management → Data Storage → Schema Validation → Integrity Check
```

## 📋 **Implementation Phases**

### **Phase 1: TEL Foundation** ✅ **COMPLETED**

**1.1 TEL Types and Operations**
- ✅ `TelEvent` types (inception, transaction, tombstone, update)
- ✅ `TEL` operations class with SAID generation and verification
- ✅ TEL chain management and state computation
- ✅ Conflict resolution ("winner = highest sequence number")

**1.2 TEL Features**
- ✅ Append-only event sequences
- ✅ Cryptographic integrity via SAIDs
- ✅ Anchoring to KEL events
- ✅ Tombstone support for data deletion
- ✅ State computation from event history

### **Phase 2: Contact KEL Operations**

**2.1 Contact-Specific KEL Events**
```typescript
// Contact inception with initial profile data
interface ContactInceptionEvent extends InceptionEvent {
  // Anchored profile data as interaction event
}

// Contact profile updates via interaction events
interface ContactProfileEvent extends InteractionEvent {
  a: SAID[]; // Anchored TEL event SAIDs
}
```

**2.2 Contact KEL Operations**
```typescript
class ContactKEL {
  // Create contact with initial profile
  static createContact(profileData: ContactProfileData): {
    kelEvent: InceptionEvent;
    telEvent: TelInceptionEvent;
  };
  
  // Update contact profile
  static updateProfile(aid: AID, updates: ContactProfileData): InteractionEvent;
  
  // Add contact relationship
  static addRelationship(aid: AID, relationship: ContactRelationship): InteractionEvent;
}
```

### **Phase 3: Contact Fact Chains**

**3.1 Profile Fact Chain**
- **Purpose**: Store mutable contact profile data (name, avatar, etc.)
- **Structure**: TEL chain with facts for each profile field
- **Schema**: Contact profile schema with validation

**3.2 Contact Details Fact Chain**
- **Purpose**: Store additional contact information (email, phone, etc.)
- **Structure**: Schema-validated facts with SAIDs
- **Operations**: Add/query facts by schema

**3.3 Relationship Fact Chain**
- **Purpose**: Store contact relationships and group memberships
- **Structure**: Facts linking to other AIDs and group SAIDs
- **Operations**: Add/remove relationships

### **Phase 4: KERI Contacts API Implementation**

**4.1 Core Contacts Interface**
```typescript
interface KeriContacts extends Contacts {
  // Standard CRUD operations
  list(): Promise<Contact[]>;
  add(contact: Contact): Promise<void>;
  remove(id: AID): Promise<void>;
  get(id: AID): Promise<Contact | undefined>;
  
  // KERI-specific operations
  createContact(profileData: ContactProfileData): Promise<AID>;
  updateProfile(aid: AID, updates: Partial<ContactProfileData>): Promise<void>;
  verifyContact(aid: AID): Promise<boolean>;
  getContactKEL(aid: AID): Promise<KelEvent[]>;
  getContactTEL(aid: AID): Promise<TelEvent[]>;
}
```

**4.2 Contact Profile Management**
```typescript
interface ContactProfileManager {
  getProfile(aid: AID): Promise<ContactProfile>;
  updateProfile(aid: AID, updates: Partial<ContactProfile>): Promise<void>;
  addFact(aid: AID, fact: Fact): Promise<void>;
  getFacts(aid: AID, schemaId?: SAID): Promise<Fact[]>;
  verifyProfile(aid: AID): Promise<boolean>;
}
```

### **Phase 5: Storage and Verification**

**5.1 KEL Storage**
- Store KEL events for each contact AID
- Maintain event sequence and integrity
- Support event querying and verification

**5.2 TEL Storage**
- Store TEL chains for contact fact chains
- Maintain chain integrity and tombstones
- Support fact querying by schema and time

**5.3 Verification Layer**
- Verify KEL event signatures
- Validate TEL chain integrity
- Check SAID consistency
- Validate fact schemas

## 🔧 **Technical Integration**

### **With Existing KEL Operations**
- Use `KEL.inceptionFrom()` for contact creation
- Use `KEL.inception()` for custom contact setups
- Extend with contact-specific event types

### **With TEL Operations**
- Use `TEL.inception()` for contact profile chains
- Use `TEL.transaction()` for profile updates
- Use `TEL.tombstone()` for data deletion

### **With Data Operations**
- Use `Data.saidify()` for fact SAID generation
- Use `Data.generateSchema()` for fact validation
- Use `Data.validateWith()` for schema validation

### **With CESR Operations**
- Use `CESR.getPublicKey()` for AID management
- Use `CESR.keypairFrom()` for deterministic testing
- Use CESR encoding for all cryptographic operations

## 🎯 **Contact Data Model**

### **Contact Profile Schema**
```typescript
interface ContactProfile {
  name: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}
```

### **Contact Relationship Schema**
```typescript
interface ContactRelationship {
  type: 'friend' | 'colleague' | 'family' | 'group';
  targetAid: AID;
  groupId?: SAID;
  createdAt: string;
}
```

### **Contact Fact Schema**
```typescript
interface ContactFact {
  id: SAID;
  schemaId: SAID;
  label: string;
  data: any;
  createdAt: string;
}
```

## 🚀 **Implementation Steps**

### **Step 1: Contact KEL Operations** (Next)
```typescript
// Extend KEL operations for contacts
class ContactKEL {
  static createContact(profileData: ContactProfileData): ContactCreationResult;
  static updateProfile(aid: AID, updates: ContactProfileData): InteractionEvent;
  static addRelationship(aid: AID, relationship: ContactRelationship): InteractionEvent;
}
```

### **Step 2: Contact Fact Chain Implementation**
```typescript
// TEL-based fact chain for contact data
class ContactFactChain implements FactChain {
  // Store facts as TEL events
  // Maintain chain integrity
  // Support tombstoning
}
```

### **Step 3: KERI Contacts API**
```typescript
// Main KERI contacts implementation
class KeriContacts implements Contacts {
  // Integrate KEL and TEL operations
  // Provide standard contacts interface
  // Add KERI-specific functionality
}
```

### **Step 4: Storage Layer**
```typescript
// Persistent storage for KEL and TEL data
class KeriContactStorage {
  // Store and retrieve KEL events
  // Store and retrieve TEL chains
  // Maintain indexes
}
```

### **Step 5: Comprehensive Testing**
```typescript
// Test KERI contacts API
describe('KERI Contacts API', () => {
  // Test contact creation and management
  // Test fact chain operations
  // Test verification and integrity
  // Test relationship management
});
```

## 🎯 **Expected Benefits**

1. **Cryptographic Integrity**: All contact data is cryptographically verifiable
2. **Decentralized Identity**: Contacts are self-sovereign KERI identifiers
3. **Audit Trail**: Complete history of all contact changes via KEL
4. **Schema Validation**: Structured, validated contact data via TEL chains
5. **Relationship Management**: Rich relationship modeling via KERI delegation
6. **Interoperability**: Standard KERI format for cross-system compatibility
7. **Conflict Resolution**: Built-in conflict resolution via TEL sequence numbers
8. **Data Integrity**: Append-only logs with cryptographic verification

## 🔄 **Migration Strategy**

### **From In-Memory to KERI**
1. **Phase 1**: Implement KERI backend alongside in-memory
2. **Phase 2**: Add migration utilities to convert existing contacts
3. **Phase 3**: Switch to KERI backend as default
4. **Phase 4**: Remove in-memory implementation

### **Backward Compatibility**
- Maintain existing `Contacts` interface
- Add KERI-specific methods as extensions
- Provide migration utilities for existing data

## 📊 **Success Metrics**

1. **Functionality**: All existing contacts API tests pass
2. **Integrity**: All contact data cryptographically verifiable
3. **Performance**: Comparable performance to in-memory implementation
4. **Security**: No data corruption or unauthorized modifications
5. **Interoperability**: Contacts can be shared across KERI systems

## 🎯 **Next Actions**

1. **Implement Contact KEL Operations** - Extend KEL operations for contact-specific events
2. **Create Contact Fact Chains** - Implement TEL-based fact storage for contact data
3. **Build KERI Contacts API** - Create the main contacts interface with KERI backing
4. **Add Comprehensive Tests** - Ensure all functionality works correctly
5. **Performance Optimization** - Optimize for production use

---

*This plan provides a comprehensive roadmap for implementing a KERI-based contacts API that leverages the existing KEL and TEL foundations while maintaining compatibility with the current contacts interface.*
