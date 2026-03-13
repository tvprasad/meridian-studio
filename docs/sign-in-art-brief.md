# Meridian Studio — Sign-In Background Art Brief

## Purpose
Background illustration for the Meridian Studio sign-in screen. The art sits behind a centered glass-morphism login card on a pure black (#000000) background. It must feel premium, dark, and alive — evoking an AI knowledge engine at work.

## Inspiration
Hand-drawn / organic line art (think gum-wrapper illustration style) combined with technical AI/neural network motifs. Not sterile or corporate — expressive, layered, slightly chaotic but beautiful.

## Layout & Dimensions
- **Viewport**: Full-screen (100vw x 100vh), responsive
- **Safe zone**: Center 400x500px area is occupied by the login card — art should frame it, not compete
- **Format**: SVG preferred (scales to any resolution). PNG/WebP at 3840x2160 acceptable as fallback
- **File size target**: Under 200KB (SVG) or 500KB (compressed raster)

## Color Palette (dark theme)
| Role | Color | Hex |
|------|-------|-----|
| Background | Pure black | `#000000` |
| Primary accent | Violet | `#a78bfa` (violet-400) |
| Secondary accent | Teal | `#2dd4bf` (teal-400) |
| Warm accent | Orange | `#fb923c` (orange-400) |
| Lines / details | White at low opacity | `rgba(255,255,255,0.05–0.15)` |
| Glow / halos | Violet at low opacity | `rgba(167,139,250,0.1–0.4)` |

The three accent colors (orange, violet, teal) form the product's "iridescent" identity — they should appear in gradients, not as solid blocks.

## Visual Elements to Include

### 1. Neural Network / Constellation Map
- 20–30 nodes scattered across the canvas, connected by thin lines
- Nodes as small glowing dots (2–4px) with soft radial halos
- Connections as hair-thin lines (0.5–1.5px) in white or violet at very low opacity
- Some connections should curve organically, not just straight lines
- Cluster density higher in corners/edges, sparser near center (safe zone)

### 2. Floating AI Keywords (hand-lettered feel)
Scatter these terms across the background in varying sizes (10–18px equivalent), rotations (-5 to +5 degrees), and opacities (5–20%):

**Core**: RAG, Agents, Orchestration, Guardrails, Hallucination, Embeddings, Chunking, Confidence, Governance, Retrieval, Grounding, Reasoning, Citations, ReAct, Tool Use, Semantic Search

**Models**: GPT-4o, Claude, LLaMA, Mistral, Phi

**Tech**: Vector DB, Transformers, Attention, Fine-Tuning, RLHF, Tokenizer, Context Window

**Techniques**: Prompt Engineering, Chain of Thought, Few-Shot, Zero-Shot, Knowledge Graph

Style: Uppercase, monospace or condensed sans-serif. Should look like marginalia / annotations — not headlines.

### 3. Organic Line Art Overlay
- Flowing, hand-drawn curves that weave between the neural network nodes
- Think: topographic contour lines, circuit traces drawn by hand, or river deltas
- Lines should vary in weight (0.5–2px) and opacity (3–10%)
- Some lines could form loose spirals or infinity-like loops
- Violet-to-teal gradient along some curves

### 4. Aurora / Atmospheric Glow
- 2–3 large soft blobs of color (violet, teal, orange) with heavy blur
- Positioned in corners / edges, NOT center
- Very low opacity (8–15%) — subtle mood, not attention-grabbing
- These already exist as CSS-animated divs; the illustration should complement, not duplicate

### 5. Micro Details (optional, adds richness)
- Tiny dot grids or stipple patterns in corners
- Small mathematical notation fragments (summation symbols, partial derivatives) at 3–5% opacity
- Binary / hex strings running along some connection lines
- Small arrow markers on some edges (directed graph feel)

## What to Avoid
- Bright, saturated areas that compete with the login card
- Corporate clip-art or stock illustration feel
- Symmetrical / rigid grid layouts — this should feel organic
- Any text that looks like it should be read (keywords are texture, not content)
- Human faces, robots, or literal AI imagery (no HAL 9000 eyes)

## Integration Notes
- The image will be placed as `position: absolute; inset: 0` behind the login card
- The login card has `backdrop-blur-md` so slight detail behind center is OK (it gets frosted)
- Current animated layers (aurora blobs, SVG constellation, floating keywords) may remain on top of the static art — design should work with or without them
- An iridescent gradient bar (orange -> violet -> teal, 4px tall) runs across the top edge

## Delivery
- **Preferred**: Single SVG file (`/public/sign-in-bg.svg`) with all elements
- **Alternative**: PNG/WebP at 3840x2160, optimized
- Place in `/public/` directory — will be referenced as `background-image: url('/sign-in-bg.svg')`

## Brand Context
**Meridian Studio** is a governed AI platform for enterprise RAG (Retrieval-Augmented Generation). The brand identity is premium, technical, and trustworthy — violet as the primary color, with teal and orange accents. The tagline is "Governed AI Platform."
