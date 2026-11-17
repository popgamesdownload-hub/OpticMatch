# Mobile builder architecture

OpticMatch now has two surfaces:

1. **Control plane:** the React web app in `src/`. It is intentionally designed like a portrait mobile app, with Build, Preview, Access, and Project tabs. It lets a user describe the app, choose cloud AI or local Ollama, review storage, inspect permissions, and open an Expo Go QR handoff.
2. **Native runtime:** an Expo Router / React Native / TypeScript project created locally by the consent-gated bootstrap script. This is where camera, filesystem, native permissions, Metro, and device previews live.

## Trust boundaries

The browser cannot self-install software or grant OS permissions. The UI must ask the user to review and approve each class of action. The local companion can then create an isolated project folder and run the installer with explicit flags. API keys, Ollama URLs, model caches, and local media belong to the user’s machine and are excluded from the repository.

## Provider cards

The interactive provider model is:

- **Google Gemini:** cloud vision/image editing through a user-owned key.
- **OpenAI compatible:** user-owned API endpoint and key.
- **Local Ollama:** a local network endpoint such as `http://localhost:11434`, with optional model cache storage.

The app should never require a cloud key when the user chooses Ollama, and it should explain the storage impact before model downloads.

## GitHub / Expo

The repository is designed to remain open source and self-hostable. GitHub sync is an optional connector boundary and should require the user’s own authorization. Expo Go preview should use the current Metro session’s QR URL and never persist a temporary preview address in the project.
