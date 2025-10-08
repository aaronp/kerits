/**
 * IPEX (Issuance and Presentation Exchange) Protocol
 *
 * Implements peer-to-peer credential exchange using exn (exchange) messages.
 *
 * Message Flow:
 * - apply  → request credential
 * - offer  → offer credential (response to apply or initiating)
 * - agree  → accept offered credential (response to offer)
 * - grant  → issue/present credential with attachments (response to agree or initiating)
 * - admit  → acknowledge received credential (response to grant)
 * - spurn  → reject any IPEX message
 */

import { versify, Protocol, VERSION_1_0, Kind } from './versify';
import { saidify } from './saidify';

/**
 * Exchange (exn) message - base structure for IPEX
 */
export interface ExchangeMessage {
  v: string;              // Version string
  t: 'exn';               // Type: exchange
  d: string;              // SAID of this message
  i: string;              // Sender's AID
  rp: string;             // Recipient (usually empty in v1)
  p: string;              // Prior message SAID (empty if starting exchange)
  dt: string;             // ISO 8601 timestamp
  r: string;              // Route (/ipex/apply, /ipex/offer, etc.)
  q: Record<string, any>; // Query modifiers (usually empty)
  a: Record<string, any>; // Attributes/payload
  e?: Record<string, any>; // Embeds (credentials, events)
}

/**
 * IPEX apply message - request a credential
 */
export interface IpexApplyParams {
  sender: string;          // Sender's AID
  recipient?: string;      // Optional recipient AID
  schema: string;          // Schema SAID
  attributes?: Record<string, any>; // Requested attributes
  message?: string;        // Human-readable message
  priorMessage?: string;   // Prior message SAID (if responding)
}

/**
 * IPEX offer message - offer a credential
 */
export interface IpexOfferParams {
  sender: string;
  recipient?: string;
  credential: any;         // ACDC credential object
  message?: string;
  priorMessage?: string;   // Prior message SAID (if responding to apply)
}

/**
 * IPEX agree message - accept an offer
 */
export interface IpexAgreeParams {
  sender: string;
  recipient?: string;
  message?: string;
  priorMessage: string;    // REQUIRED: must respond to an offer
}

/**
 * IPEX grant message - issue/present credential with full attachments
 */
export interface IpexGrantParams {
  sender: string;
  recipient: string;       // Required for grant
  credential: any;         // Full ACDC credential
  issEvent: any;           // TEL issuance event
  ancEvent?: any;          // KEL anchoring event (ixn/rot)
  message?: string;
  priorMessage?: string;   // Prior message SAID (if responding to agree)
}

/**
 * IPEX admit message - acknowledge received credential
 */
export interface IpexAdmitParams {
  sender: string;
  recipient?: string;
  message?: string;
  priorMessage: string;    // REQUIRED: must respond to a grant
}

/**
 * IPEX spurn message - reject any IPEX message
 */
export interface IpexSpurnParams {
  sender: string;
  recipient?: string;
  reason?: string;         // Rejection reason
  priorMessage: string;    // REQUIRED: must respond to existing message
}

/**
 * Get current ISO 8601 timestamp with microsecond precision
 */
function nowIso8601(): string {
  const now = new Date();
  const iso = now.toISOString();
  // Convert to microseconds format: YYYY-MM-DDTHH:MM:SS.ffffff+00:00
  const microseconds = iso.substring(0, 23) + '000+00:00';
  return microseconds;
}

/**
 * Create base exchange message structure
 */
function createBaseExn(params: {
  sender: string;
  route: string;
  attributes: Record<string, any>;
  embeds?: Record<string, any>;
  priorMessage?: string;
  recipient?: string;
}): ExchangeMessage {
  const { sender, route, attributes, embeds, priorMessage, recipient } = params;

  // Create version string
  const vs = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, 0);

  const exn: ExchangeMessage = {
    v: vs,
    t: 'exn',
    d: '',              // Will be computed
    i: sender,
    rp: recipient || '',
    p: priorMessage || '',
    dt: nowIso8601(),
    r: route,
    q: {},
    a: attributes,
  };

  if (embeds) {
    exn.e = embeds;
  }

  // Compute size with placeholder SAID
  exn.d = '#'.repeat(44);
  let serialized = JSON.stringify(exn);
  const size = serialized.length;

  // Update version with actual size
  exn.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

  // Compute SAID
  const saidified = saidify(exn, { label: 'd' });
  exn.d = saidified.d;

  return exn;
}

/**
 * Create IPEX apply message - request a credential
 *
 * Can initiate an exchange (no priorMessage) or respond to an offer.
 */
export function createApply(params: IpexApplyParams): ExchangeMessage {
  const { sender, recipient, schema, attributes = {}, message, priorMessage } = params;

  return createBaseExn({
    sender,
    recipient,
    route: '/ipex/apply',
    attributes: {
      m: message || 'Requesting credential',
      s: schema,
      a: attributes,
      i: recipient,
    },
    priorMessage,
  });
}

/**
 * Create IPEX offer message - offer a credential
 *
 * Can initiate an exchange or respond to an apply.
 */
export function createOffer(params: IpexOfferParams): ExchangeMessage {
  const { sender, recipient, credential, message, priorMessage } = params;

  return createBaseExn({
    sender,
    recipient,
    route: '/ipex/offer',
    attributes: {
      m: message || 'Offering credential',
    },
    embeds: {
      acdc: credential,
    },
    priorMessage,
  });
}

/**
 * Create IPEX agree message - accept an offered credential
 *
 * Must respond to an offer (cannot initiate exchange).
 */
export function createAgree(params: IpexAgreeParams): ExchangeMessage {
  const { sender, recipient, message, priorMessage } = params;

  if (!priorMessage) {
    throw new Error('Agree message must respond to an offer (priorMessage required)');
  }

  return createBaseExn({
    sender,
    recipient,
    route: '/ipex/agree',
    attributes: {
      m: message || 'Accepting credential',
    },
    priorMessage,
  });
}

/**
 * Create IPEX grant message - issue/present full credential with attachments
 *
 * Can initiate an exchange or respond to an agree.
 * Includes full ACDC, issuance event, and anchoring event.
 */
export function createGrant(params: IpexGrantParams): ExchangeMessage {
  const { sender, recipient, credential, issEvent, ancEvent, message, priorMessage } = params;

  const embeds: Record<string, any> = {
    d: '', // Placeholder for SAID
    acdc: credential,
    iss: issEvent,
  };

  if (ancEvent) {
    embeds.anc = ancEvent;
  }

  // Compute embed block SAID
  const embedSaidified = saidify(embeds, { label: 'd' });

  return createBaseExn({
    sender,
    recipient,
    route: '/ipex/grant',
    attributes: {
      m: message || 'Granting credential',
      i: recipient,
    },
    embeds: embedSaidified,
    priorMessage,
  });
}

/**
 * Create IPEX admit message - acknowledge received credential
 *
 * Must respond to a grant (cannot initiate exchange).
 */
export function createAdmit(params: IpexAdmitParams): ExchangeMessage {
  const { sender, recipient, message, priorMessage } = params;

  if (!priorMessage) {
    throw new Error('Admit message must respond to a grant (priorMessage required)');
  }

  return createBaseExn({
    sender,
    recipient,
    route: '/ipex/admit',
    attributes: {
      m: message || 'Acknowledging credential',
    },
    priorMessage,
  });
}

/**
 * Create IPEX spurn message - reject any IPEX message
 *
 * Must respond to existing message (cannot initiate exchange).
 */
export function createSpurn(params: IpexSpurnParams): ExchangeMessage {
  const { sender, recipient, reason, priorMessage } = params;

  if (!priorMessage) {
    throw new Error('Spurn message must respond to an existing message (priorMessage required)');
  }

  return createBaseExn({
    sender,
    recipient,
    route: '/ipex/spurn',
    attributes: {
      m: reason || 'Rejecting request',
    },
    priorMessage,
  });
}

/**
 * Validate IPEX message chaining rules
 *
 * Returns validation result with errors if invalid.
 */
export function validateChain(message: ExchangeMessage, priorMessage?: ExchangeMessage): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const route = message.r;

  // Check if route is valid IPEX route
  const validRoutes = [
    '/ipex/apply',
    '/ipex/offer',
    '/ipex/agree',
    '/ipex/grant',
    '/ipex/admit',
    '/ipex/spurn',
  ];

  if (!validRoutes.includes(route)) {
    errors.push(`Invalid IPEX route: ${route}`);
  }

  // Check prior message requirements
  const requiresPrior = ['/ipex/agree', '/ipex/admit', '/ipex/spurn'];
  const canInitiate = ['/ipex/apply', '/ipex/offer', '/ipex/grant'];

  if (requiresPrior.includes(route) && !message.p) {
    errors.push(`${route} must respond to prior message`);
  }

  // Validate response chains
  if (priorMessage) {
    const priorRoute = priorMessage.r;
    const validResponses: Record<string, string[]> = {
      '/ipex/apply': ['/ipex/offer', '/ipex/spurn'],
      '/ipex/offer': ['/ipex/agree', '/ipex/spurn'],
      '/ipex/agree': ['/ipex/grant', '/ipex/spurn'],
      '/ipex/grant': ['/ipex/admit', '/ipex/spurn'],
    };

    const allowed = validResponses[priorRoute] || [];
    if (!allowed.includes(route)) {
      errors.push(`Invalid response: ${route} cannot respond to ${priorRoute}`);
    }

    // Verify prior SAID matches
    if (message.p !== priorMessage.d) {
      errors.push('Prior message SAID mismatch');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse IPEX exchange message from raw JSON
 */
export function parseExchangeMessage(raw: string): ExchangeMessage {
  const exn = JSON.parse(raw);

  if (!exn.d) {
    throw new Error('Exchange message must have d (SAID) field');
  }

  if (exn.t !== 'exn') {
    throw new Error('Message type must be "exn"');
  }

  if (!exn.r || !exn.r.startsWith('/ipex/')) {
    throw new Error('Invalid IPEX route');
  }

  return exn;
}
