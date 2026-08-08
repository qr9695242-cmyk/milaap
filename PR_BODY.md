# PR: feat: add Agora voice rooms + premium moderation (anonymous auth, participant registration, host mute/kick)

This file contains the full PR body to use when creating a pull request from feat/voice-rooms-agora → main.

## Summary

This PR adds a basic Agora-based group voice rooms MVP plus premium moderation capabilities and Firestore rules to enforce host/admin actions.

### What this adds

- Client
  - `app/rooms/page.jsx` — rooms list + create UI (anonymous sign-in support)
  - `app/rooms/[roomId]/page.jsx` — resolves room → passes channel to `VoiceRoom`
  - `components/VoiceRoom.jsx` — Agora client integration, join/publish audio, mute/unmute, participant registration, host mute/kick UI, participant listeners
  - `lib/firebase/client.js` — Firebase client init + anonymous auth helpers
  - `lib/firestore/rooms.js` — list/create/get room, register/listen participants, setParticipantMute
  - `.env.example` — required env vars placeholders

- Server
  - `app/api/agora-token/route.js` — token endpoint using `agora-access-token` (short TTL)

- Security
  - `firestore.rules` — tightened rules so host/admin can toggle `isMuted` and delete participant docs (kick). Participants may create/update/delete their own presence.

### Files changed (high level)

Added/updated: `.env.example`, `app/rooms/*`, `components/VoiceRoom.jsx`, `lib/firebase/client.js`, `lib/firestore/rooms.js`, `app/api/agora-token/route.js`, `firestore.rules`

## How to test (local)

1. Create an Agora project and copy App ID + App Certificate.
2. Create Firebase project with Firestore enabled; enable anonymous auth.
3. In repo root create `.env.local` with values from `.env.example`:
   - `NEXT_PUBLIC_AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
4. `npm install`
5. `npm run dev`
6. Open `http://localhost:3000/rooms` — create a room (you become host if signed-in anon), then open the room in two different browsers/devices:
   - Join from both (enter display names).
   - Host can toggle “Toggle mute” on participants in the participant list — verify the other device's microphone mutes.
   - Host can delete a participant document (kick) — verify the kicked client is removed/disconnected.
   - Check Firestore: `rooms` collection, `participants` subcollection updates, and that `/api/agora-token` returns `token + uid`.
7. Verify token TTL behavior: tokens expire after ~2 minutes; joining with an expired token should fail.

## Security & production TODOs (must read)

- Keep `AGORA_APP_CERTIFICATE` server-side only (do NOT expose).
- Protect `/api/agora-token` endpoint with auth in production (today it issues tokens to any caller that supplies a channel).
- Add rate-limiting / abuse protection on token endpoint.
- Harden Firestore rules further if you plan to allow guest joins; consider moving sensitive updates (host decisions) to Cloud Functions where possible.
- Monitor Agora usage & costs for larger groups; consider paid plan and recording options for premium users.

## Suggested reviewers, labels, and milestone

- Reviewers: @qr9695242-cmyk (you), a backend person, a security reviewer
- Labels: enhancement, feature/voice-rooms, security
- Milestone: v0.2.0 (optional)

## Screenshots

Optional: attach screenshots of `/rooms` and in-room participant list + mute flow. I can prepare screenshot examples if you want.

---

### Quick PR creation instructions

1) Create in GitHub UI (one click)
   - Open this link and click “Create pull request”:
     https://github.com/qr9695242-cmyk/milaap/compare/main...feat/voice-rooms-agora?expand=1

2) Create via gh CLI (if you have the GitHub CLI installed)
   - Run locally:
     ```bash
     git fetch origin
     git checkout feat/voice-rooms-agora
     git push origin feat/voice-rooms-agora
     gh pr create --base main --head qr9695242-cmyk:feat/voice-rooms-agora --title "feat: add Agora voice rooms + premium moderation (anonymous auth, participant registration, host mute/kick)" --body-file PR_BODY.md
     ```

3) Or copy/paste this PR body into the GitHub PR description when creating it in the web UI.

---

If you want, I can also open a draft PR description file with this content on the main branch or attempt to create a PR via the API (I currently do not have permission to create PRs directly). Tell me if you want the PR file added to a different path or the commit message adjusted.