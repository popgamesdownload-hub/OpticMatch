# Native target contract

The default generated runtime is Expo Router / React Native because it gives the fastest QR preview through Expo Go. SwiftUI and Kotlin/Jetpack Compose targets can be added as alternative renderers against the same local API and storage contract:

- `POST /api/meter` for EXIF and EV100 extraction
- `POST /api/solve` for deterministic camera recipes
- local filesystem media paths under the user-approved data directory
- provider configuration kept in the user-owned environment

The open-source repository does not claim to ship signed iOS or Android binaries. A contributor can add `native/ios` and `native/android` projects without changing the control plane, permissions model, or provider cards.
