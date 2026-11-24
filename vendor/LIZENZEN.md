# Fremde Bausteine für die Sprachausgabe

Diese Dateien werden nur gebraucht, wenn im Spiel die Stimme **Thorsten** eingeschaltet wird.
Sie sind unverändert aus den genannten npm-Paketen übernommen.

| Datei | Herkunft | Lizenz |
|---|---|---|
| `ort/ort.wasm.min.js`, `ort/ort-wasm-simd.wasm`, `ort/ort-wasm.wasm` | [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) 1.18.0 (npm `onnxruntime-web`), Microsoft | MIT, siehe `ort/LICENSE-MIT.txt` |
| `piper/phonemize.js` | [@mintplex-labs/piper-tts-web](https://github.com/Mintplex-Labs/piper-tts-web) 1.0.5 | MIT |
| `piper/piper_phonemize.wasm`, `piper/piper_phonemize.data` | [@diffusionstudio/piper-wasm](https://github.com/diffusion-studio/piper-wasm) 1.0.0, gebaut aus [piper-phonemize](https://github.com/wide-video/piper-phonemize) (MIT) und [espeak-ng](https://github.com/rhasspy/espeak-ng) samt `espeak-ng-data` | espeak-ng: **GPL-3.0-or-later**, siehe `piper/GPL-3.0.txt` |
| `thorsten-worker.js` | eigener Code des Spiels | – |

## Quellcode von espeak-ng (GPL)

`piper_phonemize.wasm` und `piper_phonemize.data` enthalten espeak-ng. Den vollständigen Quellcode gibt es hier:

- espeak-ng (Piper-Fassung): https://github.com/rhasspy/espeak-ng
- piper-phonemize (WebAssembly-Fassung): https://github.com/wide-video/piper-phonemize
- Bauanleitung der WebAssembly-Dateien: https://github.com/diffusion-studio/piper-wasm

## Die Stimme selbst

Das Stimmmodell `de_DE-thorsten-medium` liegt **nicht** in diesem Repository. Das Spiel lädt es auf Wunsch
einmalig von [Hugging Face (rhasspy/piper-voices)](https://huggingface.co/rhasspy/piper-voices) und speichert es im Browser.
Stimme: [Thorsten-Voice](https://www.thorsten-voice.de) von Thorsten Müller (CC0 1.0), trainiert mit [Piper](https://github.com/rhasspy/piper) (MIT).
