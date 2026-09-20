# Trello Board - React Native

A small Trello-style board built with React Native, TypeScript, Firebase Authentication, and Cloud Firestore.

## Features

- Email/password authentication.
- Realtime board updates through a Firestore listener.
- Create, edit, delete, and drag cards between columns.
- Drag overlay outside the horizontal scroll view, with edge auto-scroll.
- Optimistic local updates with offline persistence.
- Queued `CREATE_CARD`, `UPDATE_CARD`, `DELETE_CARD`, and `MOVE_CARD` mutations.
- Automatic retry for transient Firestore failures.

## Architecture

```text
src/
  components/board/       Card, column, and drag interaction UI
  navigation/             Auth and authenticated navigation
  screens/                Login and board screens
  services/               Firebase, cache, queue, and sync services
  store/                  BoardContext and boardReducer
  types/                  Board, auth, and sync contracts
  utils/                  Shared ordering and error helpers
```

`BoardContext` owns board state and commands. `boardReducer` applies optimistic changes. `boardCache.service.ts` persists cards locally, `mutationQueue.service.ts` persists pending work, `syncManager.service.ts` processes the queue, and `board.service.ts` is the Firestore boundary.

## Installation

Requirements:

- Node.js 22 or newer.
- Android Studio and an Android emulator/device, or Xcode and an iOS simulator/device.
- Ruby and CocoaPods for iOS.

```sh
npm install
```

For iOS:

```sh
bundle install
bundle exec pod install --project-directory=ios
```

## Firebase Setup

Android is configured by `android/app/google-services.json`. For iOS, add the matching `GoogleService-Info.plist` to the iOS app target.

1. Create or select the Firebase project.
2. Enable Email/Password Authentication.
3. Create a Cloud Firestore database.
4. Register the Android and iOS apps with their native identifiers.
5. Deploy the rules from this repository:

```sh
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project kanbanapp-2919f
```

The checked-in rules allow authenticated access to `boards/demo-board` and its `cards` subcollection. Tighten these rules before using a multi-board production model.

## Running Android/iOS

Start Metro:

```sh
npm start
```

Run Android:

```sh
npm run android
```

Run iOS:

```sh
npm run ios
```

Reset Metro's cache when needed:

```sh
npx react-native start --reset-cache
```

## Offline Architecture

The board is hydrated from AsyncStorage before the Firestore listener is applied:

1. Cached cards are loaded from `boardCache.service.ts`.
2. Pending mutations are loaded from `mutationQueue.service.ts`.
3. User actions update the UI immediately and write to the local cache.
4. Mutations remain queued until an authenticated connection is available.
5. `useNetworkStatus` triggers queue processing when connectivity returns.

Transient Firestore errors retry up to three times with backoff. Permanent failures, such as permission errors, stay in the queue with their status, attempt count, and error message so they are not silently lost.

## Realtime Synchronization

`subscribeToBoardCards` listens to `boards/demo-board/cards`. Remote snapshots replace the local board only when there are no pending local mutations. This prevents an older snapshot from overwriting an optimistic local change while the queue is being processed.

## Conflict Strategy

The current strategy is intentionally simple:

- Local actions are optimistic.
- Mutations are processed in queue order.
- Card moves use the current card state and calculated order values.
- Remote snapshots are deferred while pending local mutations exist.
- Firestore's last successful write wins when multiple clients update the same card.

This works for a small single-board app, but it is not a full collaborative editing protocol. A production version should add server timestamps, revision checks, or an explicit conflict-resolution policy.

## Drag-and-Drop Implementation

Cards use `react-native-gesture-handler` and report absolute pointer coordinates. The active card is rendered in a screen-level overlay, preventing clipping inside horizontally scrollable columns. The board screen measures card and column rectangles, highlights the current drop column, calculates insertion indexes from card midpoints, and auto-scrolls when the pointer enters an edge zone.

## Trade-offs

- AsyncStorage keeps the implementation small, but it is not a transactional database.
- The demo uses one fixed board ID instead of a board membership model.
- Failed mutations are retained for diagnosis rather than silently discarded.
- The current UI supports basic title and description editing, not rich text or attachments.
- The Firestore rules are suitable for the demo board, not unrestricted multi-tenant data.

## Testing

Available commands:

```sh
npm test
npm run lint
npx tsc --noEmit
```

Focused lint checks for the board, queue, and sync code pass. The project still has existing React Native native-ref typing issues, and the starter Jest configuration may require a transform adjustment for ESM dependencies such as `react-native-gesture-handler`.

## Future Improvements

- Add board creation, membership, and per-user Firestore security rules.
- Add a visible failed-mutation retry action and queue diagnostics.
- Add automated reducer, queue, sync, and drag behavior tests.
- Replace AsyncStorage queue updates with a transactional local database.
- Use server timestamps and revision-based conflict detection.
- Add labels, due dates, comments, attachments, and search.
- Improve accessibility and keyboard/desktop interaction support.
