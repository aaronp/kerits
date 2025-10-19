/**
 * Tests for Transport interface implementations
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { Transport, Message, Channel } from './transport';
import type { AID, Bytes } from './types';

// Mock implementation for testing
class MockTransport implements Transport {
    private channels = new Map<string, Set<(m: Message) => void>>();
    private inbox = new Map<string, Message[]>();

    async send(msg: Message): Promise<void> {
        const key = msg.to.uri;
        this.inbox.set(key, [...(this.inbox.get(key) ?? []), msg]);
        this.channels.get(key)?.forEach(fn => fn(msg));
    }

    channel(aid: AID): Channel {
        const key = aid.uri;
        if (!this.channels.has(key)) {
            this.channels.set(key, new Set());
        }
        return {
            subscribe: (onMessage) => {
                this.channels.get(key)!.add(onMessage);
                return () => this.channels.get(key)!.delete(onMessage);
            }
        };
    }

    async readUnread(aid: AID, limit = 100): Promise<Message[]> {
        const key = aid.uri;
        const messages = this.inbox.get(key) ?? [];
        this.inbox.set(key, []);
        return messages.slice(0, limit);
    }

    async ack(aid: AID, ids: string[]): Promise<void> {
        // Mock implementation - just acknowledge
    }
}

describe('Transport', () => {
    let transport: Transport;
    let alice: AID;
    let bob: AID;

    beforeEach(() => {
        transport = new MockTransport();
        alice = { uri: 'Ealice123' };
        bob = { uri: 'Ebob456' };
    });

    it('should send and receive messages', async () => {
        const message: Message = {
            id: 'Emsg123',
            from: alice,
            to: bob,
            typ: 'test.message',
            body: new TextEncoder().encode('Hello Bob!'),
            dt: new Date().toISOString()
        };

        await transport.send(message);
        const received = await transport.readUnread?.(bob);

        expect(received).toHaveLength(1);
        expect(received![0]).toEqual(message);
    });

    it('should handle multiple messages', async () => {
        const message1: Message = {
            id: 'Emsg1',
            from: alice,
            to: bob,
            typ: 'test.message1',
            body: new TextEncoder().encode('Message 1'),
            dt: new Date().toISOString()
        };

        const message2: Message = {
            id: 'Emsg2',
            from: alice,
            to: bob,
            typ: 'test.message2',
            body: new TextEncoder().encode('Message 2'),
            dt: new Date().toISOString()
        };

        await transport.send(message1);
        await transport.send(message2);
        const received = await transport.readUnread?.(bob);

        expect(received).toHaveLength(2);
        expect(received![0]).toEqual(message1);
        expect(received![1]).toEqual(message2);
    });

    it('should limit unread messages', async () => {
        // Send 5 messages
        for (let i = 0; i < 5; i++) {
            const message: Message = {
                id: `Emsg${i}`,
                from: alice,
                to: bob,
                typ: 'test.message',
                body: new TextEncoder().encode(`Message ${i}`),
                dt: new Date().toISOString()
            };
            await transport.send(message);
        }

        const received = await transport.readUnread?.(bob, 3);
        expect(received).toHaveLength(3);
    });

    it('should clear inbox after reading', async () => {
        const message: Message = {
            id: 'Emsg123',
            from: alice,
            to: bob,
            typ: 'test.message',
            body: new TextEncoder().encode('Hello Bob!'),
            dt: new Date().toISOString()
        };

        await transport.send(message);
        await transport.readUnread?.(bob);
        const receivedAgain = await transport.readUnread?.(bob);

        expect(receivedAgain).toHaveLength(0);
    });

    it('should handle acknowledgments', async () => {
        const message: Message = {
            id: 'Emsg123',
            from: alice,
            to: bob,
            typ: 'test.message',
            body: new TextEncoder().encode('Hello Bob!'),
            dt: new Date().toISOString()
        };

        await transport.send(message);
        await transport.ack?.(bob, ['Emsg123']);

        // Should not throw
        expect(true).toBeTrue();
    });
});

describe('Channel', () => {
    let transport: Transport;
    let alice: AID;
    let bob: AID;

    beforeEach(() => {
        transport = new MockTransport();
        alice = { uri: 'Ealice123' };
        bob = { uri: 'Ebob456' };
    });

    it('should subscribe to messages', async () => {
        const channel = transport.channel(bob);
        const receivedMessages: Message[] = [];

        const unsubscribe = channel.subscribe((msg) => {
            receivedMessages.push(msg);
        });

        const message: Message = {
            id: 'Emsg123',
            from: alice,
            to: bob,
            typ: 'test.message',
            body: new TextEncoder().encode('Hello Bob!'),
            dt: new Date().toISOString()
        };

        await transport.send(message);

        expect(receivedMessages).toHaveLength(1);
        expect(receivedMessages[0]).toEqual(message);

        unsubscribe();
    });

    it('should handle multiple subscribers', async () => {
        const channel = transport.channel(bob);
        const received1: Message[] = [];
        const received2: Message[] = [];

        const unsubscribe1 = channel.subscribe((msg) => {
            received1.push(msg);
        });

        const unsubscribe2 = channel.subscribe((msg) => {
            received2.push(msg);
        });

        const message: Message = {
            id: 'Emsg123',
            from: alice,
            to: bob,
            typ: 'test.message',
            body: new TextEncoder().encode('Hello Bob!'),
            dt: new Date().toISOString()
        };

        await transport.send(message);

        expect(received1).toHaveLength(1);
        expect(received2).toHaveLength(1);
        expect(received1[0]).toEqual(message);
        expect(received2[0]).toEqual(message);

        unsubscribe1();
        unsubscribe2();
    });

    it('should unsubscribe correctly', async () => {
        const channel = transport.channel(bob);
        const receivedMessages: Message[] = [];

        const unsubscribe = channel.subscribe((msg) => {
            receivedMessages.push(msg);
        });

        const message1: Message = {
            id: 'Emsg1',
            from: alice,
            to: bob,
            typ: 'test.message',
            body: new TextEncoder().encode('Message 1'),
            dt: new Date().toISOString()
        };

        await transport.send(message1);
        expect(receivedMessages).toHaveLength(1);

        unsubscribe();

        const message2: Message = {
            id: 'Emsg2',
            from: alice,
            to: bob,
            typ: 'test.message',
            body: new TextEncoder().encode('Message 2'),
            dt: new Date().toISOString()
        };

        await transport.send(message2);
        expect(receivedMessages).toHaveLength(1); // Should not receive second message
    });

    it('should handle messages with signatures', async () => {
        const channel = transport.channel(bob);
        const receivedMessages: Message[] = [];

        channel.subscribe((msg) => {
            receivedMessages.push(msg);
        });

        const message: Message = {
            id: 'Emsg123',
            from: alice,
            to: bob,
            typ: 'test.message',
            body: new TextEncoder().encode('Hello Bob!'),
            dt: new Date().toISOString(),
            sigs: [
                { keyIndex: 0, sig: 'mock-signature-123' }
            ]
        };

        await transport.send(message);

        expect(receivedMessages).toHaveLength(1);
        expect(receivedMessages[0].sigs).toEqual([
            { keyIndex: 0, sig: 'mock-signature-123' }
        ]);
    });

    it('should handle messages with references', async () => {
        const channel = transport.channel(bob);
        const receivedMessages: Message[] = [];

        channel.subscribe((msg) => {
            receivedMessages.push(msg);
        });

        const message: Message = {
            id: 'Emsg123',
            from: alice,
            to: bob,
            typ: 'test.message',
            body: new TextEncoder().encode('Hello Bob!'),
            dt: new Date().toISOString(),
            refs: ['Eref1', 'Eref2']
        };

        await transport.send(message);

        expect(receivedMessages).toHaveLength(1);
        expect(receivedMessages[0].refs).toEqual(['Eref1', 'Eref2']);
    });
});
