# MERITS Messaging - Quick Start Guide

This guide will help you get messaging up and running in KERITS.

## Installation

### 1. Install Dependencies

```bash
cd ui
bun install
```

This installs the new dependencies:
- `convex@^1.16.0` - Convex client library
- `sonner@^1.4.0` - Toast notifications

### 2. Configure Environment

Create a `.env` file in the `ui/` directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and set your Convex URL (or use the default):

```env
VITE_CONVEX_URL=https://accurate-penguin-901.convex.cloud
```

### 3. Start the Backend (Convex)

In the `server/` directory:

```bash
cd ../server
bun install
bunx convex dev
```

This will:
- Start the Convex development server
- Set up the database schema
- Provide a local development URL (or use the cloud URL)

### 4. Start the UI

Back in the `ui/` directory:

```bash
cd ../ui
bun run dev
```

## First Time Usage

### 1. Create a User

1. Navigate to `http://localhost:5173` (or your dev server URL)
2. Click "Create User"
3. Enter a username (e.g., "alice")
4. User is created with an auto-generated account

### 2. Share Your KEL

1. Click on your profile dropdown (top right)
2. Click "Share"
3. Your account KEL is copied to clipboard (CESR format)
4. Send this to your contact via another channel (email, chat, etc.)

### 3. Add a Contact

1. Navigate to "Contacts" in the sidebar
2. Click "Add Contact"
3. Enter contact's name
4. Paste their KEL (CESR or JSON format)
5. Click "Add Contact"

### 4. Start Messaging

1. Navigate to "Messages" in the sidebar
2. Your contacts appear in the left panel
3. Click a contact to open the conversation
4. Type a message and click "Send"

## Testing Locally

To test messaging with two users on the same machine:

### Option A: Two Browser Windows

1. Open two browser windows/tabs
2. Create "User 1" in window 1
3. Create "User 2" in window 2
4. Share KELs between them
5. Add each other as contacts
6. Send messages!

### Option B: Two Browser Profiles

1. Open Chrome/Firefox with two different profiles
2. Follow the same steps as Option A
3. This better simulates real multi-user scenarios

## Verifying Installation

### Check UI Dependencies

```bash
cd ui
bun list | grep -E "(convex|sonner)"
```

Expected output:
```
├── convex@1.16.0
├── sonner@1.4.0
```

### Check Server Dependencies

```bash
cd server
bun list | grep convex
```

Expected output:
```
├── convex@1.16.0
```

### Check Messaging Initialization

1. Open browser DevTools (F12)
2. Navigate to Messages page
3. Look for console logs:

```
[Messaging Bridge] Initializing messaging for: alice
[Messaging Bridge] Identity extracted: { aid: '...', alias: 'alice', ksn: 0 }
[Contact Sync] Syncing KERITS → MERITS contacts
[Contact Sync] Found 2 KERITS contacts
[Contact Sync] Sync complete: 2 added, 0 updated
[Connection] Initializing MessageBus for: ...
[Connection] MessageBus connected successfully
[Messaging Bridge] Messaging initialized successfully
```

## Troubleshooting

### "Account is locked" Error

**Problem**: Cannot access private key for messaging

**Solution**:
- The account was created without storing the mnemonic
- Create a new account (it will auto-store the mnemonic)
- Or manually unlock via KeyManager (advanced)

### "Not connected to MessageBus" Error

**Problem**: Cannot send messages

**Solution**:
- Check `VITE_CONVEX_URL` in `.env`
- Verify Convex server is running (`bunx convex dev`)
- Check browser console for connection errors
- Try refreshing the page

### Contacts Not Showing

**Problem**: KERITS contacts don't appear in Messages

**Solution**:
- Navigate away from Messages and back
- Check contact has valid AID (not just alias)
- Wait 5 minutes for auto-sync
- Check console for sync errors

### Messages Not Sending

**Problem**: Messages stuck in "sending" status

**Solution**:
- Check Convex connection status (top left panel)
- Verify recipient AID is correct
- Check browser console for errors
- Try the "Retry" button on failed messages

### Browser Console Errors

**Problem**: TypeScript or module errors

**Solution**:
```bash
# Rebuild UI
cd ui
bun run build:check

# If errors persist, clear caches
rm -rf node_modules .vite
bun install
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       KERITS UI                              │
│                                                              │
│  ┌────────────┐      ┌──────────────┐     ┌──────────────┐ │
│  │ Dashboard  │──────│ Messages Page│─────│ MyContact    │ │
│  │ (Sidebar)  │      │ (Standalone) │     │ (Detail View)│ │
│  └────────────┘      └──────────────┘     └──────────────┘ │
│                             │                                │
│                             ▼                                │
│                    ┌─────────────────┐                       │
│                    │ Messaging Bridge│                       │
│                    │   (Identity +   │                       │
│                    │    Storage +    │                       │
│                    │  Contact Sync)  │                       │
│                    └─────────────────┘                       │
│                             │                                │
│         ┌───────────────────┼───────────────────┐            │
│         ▼                   ▼                   ▼            │
│  ┌──────────┐        ┌──────────┐       ┌──────────┐       │
│  │ KERITS   │        │ MERITS   │       │  MERITS  │       │
│  │   DSL    │◄───────│  Stores  │───────│   UI     │       │
│  │ (KeyMgr, │        │(Contacts,│       │Components│       │
│  │Contacts, │        │Messages, │       │          │       │
│  │  Store)  │        │Connection)       │          │       │
│  └──────────┘        └──────────┘       └──────────┘       │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Convex Backend  │
                    │  (MessageBus +   │
                    │   Auth + DB)     │
                    └──────────────────┘
```

## Next Steps

- **Read**: [`INTEGRATION.md`](./INTEGRATION.md) for detailed architecture
- **Customize**: Configure Convex URL, add custom message handlers
- **Extend**: Add file attachments, read receipts, typing indicators
- **Deploy**: Set up production Convex instance and update `.env`

## Support

- **Issues**: Report bugs at your issue tracker
- **Documentation**: See `INTEGRATION.md` for full details
- **MERITS Code**: Located in `ui/src/merits/`
- **KERI Spec**: https://github.com/WebOfTrust/keri

## Success Checklist

- [ ] Dependencies installed (`convex`, `sonner`)
- [ ] `.env` configured with Convex URL
- [ ] Convex backend running (`bunx convex dev`)
- [ ] UI running (`bun run dev`)
- [ ] Two users created
- [ ] KELs shared between users
- [ ] Contacts added in both directions
- [ ] Messages sent and received
- [ ] Connection status shows "Connected"

If all items are checked, you're ready to go! 🎉
