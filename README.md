# AEGIS-FORENSICS · React + Vite Frontend

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Component Architecture

```
src/
├── App.jsx                    # Root — state: evidence object (file, url, hash)
│                              # AnimatePresence: upload ↔ results transition
│
├── components/
│   ├── HyperspeedBackground   # Canvas: animated grid + particle streaks (no deps)
│   ├── TopNav                 # Sticky nav, animated logo, EQ signal bars
│   ├── StatsBar               # 4-cell stats, countup animation on mount
│   ├── AnimatedUploadZone     # Drag-and-drop, electric border, real SHA-256
│   ├── TiltedEvidenceCard     # 3D mouse-tracking tilt via Framer Motion springs
│   ├── LetterGlitchHash       # Character-by-character glitch reveal animation
│   └── ResultsPanel           # Assembles card + hash + CNN bars + timeline
```

## State Flow

```
App.jsx
  │
  ├─ evidence = null  → <AnimatedUploadZone onFile={setEvidence} />
  │                       ↳ Drag or click → computeSHA256() (Web Crypto API)
  │                       ↳ calls onFile({ file, url, hash, name, size })
  │
  └─ evidence = {...} → <ResultsPanel evidence={evidence} />
                          ├─ TiltedEvidenceCard — displays image with 3D tilt
                          ├─ LetterGlitchHash — reveals SHA-256 character by character
                          └─ Mock CNN analysis + environmental context panels
```

## Key Packages

| Package           | Used For                                              |
|-------------------|-------------------------------------------------------|
| `framer-motion`   | All animations: springs, layout, AnimatePresence      |
| `lucide-react`    | SVG icons (UploadCloud, Shield, Cpu, etc.)            |
| `tailwindcss`     | Utility classes — custom tokens in tailwind.config.js |
| `clsx`            | Conditional class merging (utility)                   |

## Design Tokens (tailwind.config.js)

```js
colors.teal       = '#00ffb4'      // primary accent
colors.ink[950]   = '#04080f'      // darkest bg
fontFamily.display = 'Syne'        // headings, UI labels
fontFamily.mono    = 'Space Mono'  // all data / hashes
```

---

## Reference Sites (Frontend Bible)

### Component Registries
- **React Bits** — https://reactbits.dev
  - Tilted Card, Letter Glitch, Hyperspeed background, Electric Border
- **Shadcn UI** — https://ui.shadcn.com (buttons, toasts, fast primitives)

### Animation Engine
- **Framer Motion Docs** — https://framer.com/motion
  - `useSpring`, `useTransform`, `AnimatePresence`, layout animations

### Icons
- **Lucide React** — https://lucide.dev (all icons used in this project)

### Aesthetic Inspiration
| Site | Why |
|------|-----|
| https://linear.app | Dark data UI gold standard |
| https://basement.studio | Aggressive motion + glitch effects |
| https://anduril.com | Defense/forensics HUD aesthetic |
| https://axiom.co | Dark log analytics — identical use case |
| https://palantir.com | Intelligence product design reference |
| https://lusion.co | WebGL / Three.js animation techniques |
| https://vercel.com | Dark dashboard, monospaced data |

### CSS Techniques Used
- **Noise grain overlay** via SVG feTurbulence (body::after)
- **Scanline effect** via repeating-linear-gradient on image overlay
- **Glass morphism topbar** via `backdrop-filter: blur(20px)`
- **3D card tilt** via `rotateX/rotateY` + `perspective: 900px` + `useSpring`
- **Glitch text** via requestAnimationFrame cycling through hex chars

---

## Next Steps

1. **Real face detection** — connect Python SightVision service via `/api/detect`
2. **Real blockchain** — replace mock hash display with Ethers.js + Hardhat smart contract
3. **IPFS upload** — integrate `web3.storage` SDK to actually pin the image
4. **CNN endpoint** — Flask microservice exposing wound analysis at `/api/analyze`
5. **Three.js scene** — 3D crime scene viewer using `@react-three/fiber`
