# Secret Hitler Adaptation - Design Document

**Date:** 2025-12-27
**Status:** Approved
**Goal:** Strip down forked repo, add discussion round, prepare for theming, integrate with games.zitti.ro

---

## Overview

Adapt the forked Secret Hitler Online codebase for hosting at `games.zitti.ro/secret-hitler` with:
- Aggressive cleanup (remove author branding, analytics, bots)
- New host-controlled discussion round
- Theming system for future re-skinning
- Vercel (frontend) + Hetzner (backend) architecture

---

## Architecture

```
Vercel (games.zitti.ro)              Hetzner
├── Next.js frontend                 └── Java backend (separate repo)
│   └── /secret-hitler page              └── WebSocket server (port 4040)
│                                        └── REST endpoints
│                                        └── PostgreSQL database

Browser loads UI from Vercel, connects directly to Hetzner for gameplay
```

**DNS Setup:**
- `games.zitti.ro` → Vercel
- `game-api.zitti.ro` → Hetzner IP (Java backend)

---

## Phase 1: Cleanup

### Files to Remove

| File/Directory | Reason |
|----------------|--------|
| `backend/src/main/java/game/CpuPlayer.java` | Bot system not needed |
| `backend/src/test/java/game/testCpuPlayer.java` | Bot tests |
| `frontend/src/assets/twitter-icon.svg` | Twitter integration |
| `frontend/src/util/AnnouncementBox.tsx` | Author announcements |
| `.github/workflows/` | Firebase deployment workflows |
| `frontend/firebase.json` | Firebase config |

### Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/App.tsx:223-224` | Remove Google Analytics initialization |
| `frontend/src/App.tsx:736-758` | Remove announcement box and bot announcement |
| `frontend/src/App.tsx:746-757` | Remove GitHub issues link |
| `frontend/src/App.tsx:949-969` | Remove "About this project" and "Issues page" links |
| `frontend/src/LoginPageContent.js:50-64` | Remove ShrimpCryptid credits and GitHub links |
| `frontend/src/custom-alert/IconSelection.tsx` | Remove Twitter sharing functionality |
| `frontend/package.json` | Remove `react-twitter-embed`, `@types/twitter-for-web` |
| `backend/src/main/java/server/util/Lobby.java` | Remove CpuPlayer references |
| `backend/src/main/java/server/SecretHitlerServer.java:131` | Update CORS allowed origins |

### Search & Replace

| Find | Replace With |
|------|--------------|
| `secret-hitler.online` | `games.zitti.ro/secret-hitler` (frontend) |
| `secret-hitler.online` | `game-api.zitti.ro` (backend connections) |
| `ShrimpCryptid` | Remove or replace |
| `UA-166327773-1` | Remove (Google Analytics ID) |

---

## Phase 2: Game Modifications - Discussion Round

### New Game Flow

```
CHANCELLOR_NOMINATION
       ↓
CHANCELLOR_VOTING
       ↓
LEGISLATIVE_PRESIDENT
       ↓
LEGISLATIVE_CHANCELLOR
       ↓
(PRESIDENTIAL_POWER_* if triggered)
       ↓
POST_LEGISLATIVE
       ↓
DISCUSSION          ← NEW: Host-controlled discussion phase
       ↓
CHANCELLOR_NOMINATION (next round)
```

### Backend Changes

**`backend/src/main/java/game/GameState.java`:**
```java
// Add new state after POST_LEGISLATIVE
DISCUSSION,  // Host-controlled discussion phase before next round
```

**`backend/src/main/java/game/SecretHitlerGame.java`:**

1. Modify `endPresidentialTerm()` (line ~594):
```java
public void endPresidentialTerm() {
    if (this.state != GameState.POST_LEGISLATIVE) {
        throw new IllegalStateException();
    }
    // ... existing president rotation logic ...

    this.lastState = this.state;
    this.state = GameState.DISCUSSION;  // Changed from CHANCELLOR_NOMINATION
    this.round++;
}
```

2. Add new method:
```java
public void endDiscussion() {
    if (this.state != GameState.DISCUSSION) {
        throw new IllegalStateException("Cannot end discussion when not in discussion phase.");
    }
    this.lastState = this.state;
    this.state = GameState.CHANCELLOR_NOMINATION;
}
```

**`backend/src/main/java/server/SecretHitlerServer.java`:**

1. Add constant:
```java
public static final String COMMAND_END_DISCUSSION = "end-discussion";
```

2. Add command handler in `onWebSocketMessage()`:
```java
case COMMAND_END_DISCUSSION:
    verifyIsVIP(ctx, lobby);  // New method to check if user is host
    lobby.game().endDiscussion();
    break;
```

3. Add VIP verification:
```java
private static void verifyIsVIP(WsContext ctx, Lobby lobby) {
    if (!lobby.isVIP(ctx)) {
        throw new RuntimeException("Only the host can perform this action.");
    }
}
```

**`backend/src/main/java/server/util/Lobby.java`:**
- Add `isVIP(WsContext ctx)` method to check if user is the first player (VIP/host)

### Frontend Changes

**`frontend/src/types/lobby_state.ts`:**
```typescript
export enum LobbyState {
  // ... existing states ...
  DISCUSSION = "DISCUSSION",
}
```

**`frontend/src/constants/index.ts`:**
```typescript
export const STATE_DISCUSSION = "DISCUSSION";
export const COMMAND_END_DISCUSSION = "end-discussion";
```

**New component `frontend/src/custom-alert/DiscussionPrompt.tsx`:**
```typescript
interface DiscussionPromptProps {
  isVIP: boolean;
  onEndDiscussion: () => void;
}

const DiscussionPrompt: React.FC<DiscussionPromptProps> = ({ isVIP, onEndDiscussion }) => {
  return (
    <div className="discussion-prompt">
      <h2>DISCUSSION</h2>
      <p>Discuss the events of this round with other players.</p>
      {isVIP ? (
        <button onClick={onEndDiscussion}>END DISCUSSION</button>
      ) : (
        <p>Waiting for host to continue...</p>
      )}
    </div>
  );
};
```

**`frontend/src/App.tsx` - in `onGameStateChanged()`:**
```typescript
case STATE_DISCUSSION:
  this.queueEventUpdate("DISCUSSION");
  this.queueStatusMessage("Discussion phase - talk about what happened.");

  const isVIP = this.state.usernames[0] === this.state.name;
  this.queueAlert(
    <DiscussionPrompt
      isVIP={isVIP}
      onEndDiscussion={() => {
        this.sendWSCommand({ command: WSCommandType.END_DISCUSSION });
      }}
    />,
    true
  );
  break;
```

---

## Phase 3: Integration with games.zitti.ro

### Frontend (Your Next.js Repo)

1. **Create page:** `app/secret-hitler/page.tsx`
2. **Copy components:** Migrate from `frontend/src/` to your Next.js structure
3. **Copy assets:** Move to `public/secret-hitler/`
4. **Update imports:** Adjust paths for Next.js conventions
5. **Update constants:** Set `SERVER_ADDRESS` to `game-api.zitti.ro`

### Backend (This Repo - Hetzner)

1. **Update CORS** in `SecretHitlerServer.java`:
```java
cors.add(it -> {
    it.allowHost("https://games.zitti.ro");
});
```

2. **SSL Setup:** Configure Let's Encrypt for `game-api.zitti.ro`

3. **Run command:**
```bash
./gradlew runLocal  # or create production run script
```

### Environment Variables (Hetzner)

```bash
DATABASE_URL=postgres://user:pass@localhost:5432/secrethitler
PORT=4040
DEBUG_MODE=false
```

---

## Phase 4: Theming Preparation

### Asset Reorganization

**New structure:**
```
frontend/src/assets/
├── themes/
│   └── default/
│       ├── boards/
│       │   ├── liberal.png
│       │   ├── fascist-5-6.png
│       │   ├── fascist-7-8.png
│       │   └── fascist-9-10.png
│       ├── policies/
│       │   ├── liberal.png
│       │   └── fascist.png
│       ├── roles/
│       │   ├── liberal-1.png through liberal-6.png
│       │   ├── fascist-1.png through fascist-3.png
│       │   └── hitler.png
│       ├── players/
│       │   └── portraits/ (all SVGs)
│       └── ui/
│           ├── vote-yes.png
│           ├── vote-no.png
│           └── ...
├── index.ts
└── theme.config.ts
```

### Theme Configuration

**`frontend/src/assets/theme.config.ts`:**
```typescript
export interface ThemeConfig {
  id: string;
  name: string;

  // Terminology
  terms: {
    goodTeam: string;      // "Liberal"
    evilTeam: string;      // "Fascist"
    evilLeader: string;    // "Hitler"
    goodPolicy: string;    // "Liberal Policy"
    evilPolicy: string;    // "Fascist Policy"
  };

  // Colors
  colors: {
    good: string;          // "#4a90d9"
    evil: string;          // "#c94a4a"
  };

  // Asset paths (relative to theme folder)
  assets: {
    boards: { ... };
    policies: { ... };
    roles: { ... };
    ui: { ... };
  };
}

export const DEFAULT_THEME: ThemeConfig = {
  id: 'default',
  name: 'Classic',
  terms: {
    goodTeam: 'Liberal',
    evilTeam: 'Fascist',
    evilLeader: 'Hitler',
    goodPolicy: 'Liberal Policy',
    evilPolicy: 'Fascist Policy',
  },
  colors: {
    good: '#4a90d9',
    evil: '#c94a4a',
  },
  assets: { ... }
};
```

**`frontend/src/assets/index.ts`:**
```typescript
import { DEFAULT_THEME, ThemeConfig } from './theme.config';

// Active theme - change this to switch themes
export const CURRENT_THEME: ThemeConfig = DEFAULT_THEME;

// Export assets based on current theme
export const getAsset = (category: string, name: string): string => {
  return `/themes/${CURRENT_THEME.id}/${category}/${name}`;
};

export const getTerm = (key: keyof ThemeConfig['terms']): string => {
  return CURRENT_THEME.terms[key];
};
```

---

## Implementation Order

1. **Phase 1: Cleanup** - Remove all author/branding elements
2. **Phase 2: Discussion Round** - Backend first, then frontend
3. **Phase 3: Integration** - Deploy backend to Hetzner, integrate frontend
4. **Phase 4: Theming** - Reorganize assets, create config system

---

## Testing Checklist

- [ ] Game starts with 5-10 players
- [ ] All game phases work (nomination, voting, legislative, powers)
- [ ] Discussion round appears after each policy
- [ ] Only host can end discussion
- [ ] WebSocket connects from Vercel-hosted frontend to Hetzner backend
- [ ] No references to original author/domain remain
- [ ] Assets load correctly from new structure

---

## Future Considerations

- Custom theme creation (Phase 4 enables this)
- Timer option for discussion round
- Spectator mode
- Game history/replay
