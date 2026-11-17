# Provider adapters

The frontend ships in local demo mode. A production self-hosted deployment can add adapters here without changing the workflow contract.

Each adapter should expose:

- `generate_variations(base_image, prompt) -> list[Variation]`
- `refine_variations(parent_image, instruction) -> list[Variation]`
- `analyze_delta(original_image, approved_edit) -> VisualDelta`

Recommended implementations are Gemini image editing or Fal/Replicate Flux Kontext for cloud mode, and ComfyUI plus Ollama (`qwen2.5-vl`/`llava`) for a fully local mode. Keep provider keys server-side and persist only local media paths in SQLite.
