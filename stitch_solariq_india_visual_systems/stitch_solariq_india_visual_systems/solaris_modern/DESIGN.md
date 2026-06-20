---
name: Solaris Modern
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#404944'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#6d5e00'
  on-secondary: '#ffffff'
  secondary-container: '#fcdf46'
  on-secondary-container: '#726200'
  tertiary: '#00333d'
  on-tertiary: '#ffffff'
  tertiary-container: '#004b59'
  on-tertiary-container: '#29c1df'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#ffe24c'
  secondary-fixed-dim: '#e2c62d'
  on-secondary-fixed: '#211b00'
  on-secondary-fixed-variant: '#524600'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 60px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Sora
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Sora
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-display:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system embodies a premium, high-fidelity aesthetic tailored for the renewable energy sector in India. It balances the authoritative weight of institutional investment with the agility of AI-driven technology. The style is a hybrid of **Clean Minimalism** and **Vibrant Glassmorphism**, creating a digital environment that feels "airy" yet data-dense.

The emotional response should be one of confidence, transparency, and technological sophistication. We utilize heavy whitespace and high-contrast editorial typography to frame complex solar data, making it accessible and aspirational. Interactive elements leverage a "Solaris Modern" signature: semi-transparent surfaces that mimic the reflective properties of silicon wafers, paired with tactile, soft-depth controls for simulation-heavy workflows.

## Colors
The palette is rooted in **Deep Emerald**, symbolizing sustainable growth and the lush landscapes of India. This is punctuated by **Solar Gold**, used exclusively as an accent for energy-related calls to action, active data states, and "sunlight" indicators.

The interface primarily uses a high-key light mode. **Surface layers** are composed of pure white or ultra-light grey (#F8FAFC) with varied opacities (80-95%) to enable background blurs. Semantic colors (Emerald, Amber, Cyan) are used with precision for system status and health indices, ensuring they do not compete with the primary brand Emerald.

## Typography
This design system uses a high-contrast typographic pairing. **Playfair Display** provides an editorial, premium feel for large headings and hero sections, signifying authority. For technical data and body copy, **Sora** offers a geometric, tech-forward clarity that ensures legibility in complex dashboards.

- **Headlines:** Use tight tracking (-1% to -2%) for a more cohesive, high-end look.
- **Data Display:** Specialized Sora style for large numerical indices (e.g., kW output), utilizing tabular figures to ensure alignment in data tables.
- **Labels:** Always uppercase with generous tracking to contrast against serif headlines.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Dashboards utilize a 12-column grid with a maximum content width of 1440px to maintain readability on ultra-wide monitors. 

- **Desktop:** 64px outer margins with 24px gutters. Use "Inner-Page Padding" of 48px for glass cards to create a sense of breathability.
- **Mobile:** 16px outer margins. Complex data visualizations should reflow into vertical stacks or horizontally scrollable "Snap Cards."
- **Rhythm:** All spacing (padding, margins) must be increments of 8px to maintain a strict mathematical grid.

## Elevation & Depth
Depth is created through a combination of **Glassmorphism** and **Soft Neomorphism**. 

1.  **Level 0 (Base):** Subtle grey-to-white gradient (#F1F5F9 to #FFFFFF).
2.  **Level 1 (Cards):** White background at 85% opacity with a `24px` backdrop blur. 1px solid border (White, 20% opacity).
3.  **Level 2 (Interactive Controls):** Sliders and "What-If" input containers use a soft neomorphic inset shadow (light source from top-left) to feel tactile and physically "pressed" into the glass surface.
4.  **Level 3 (Modals/Wizards):** High-opacity glass cards with a deep, diffused shadow (Primary Color, 10% opacity, 40px blur) to pull focus.

## Shapes
The shape language is sophisticated and modern. Standard UI elements (cards, inputs) use a **0.5rem (8px)** base radius. Larger layout containers and primary call-to-action cards use **1rem (16px)** to feel softer and more approachable.

- **Buttons:** Fully rounded (pill) for primary actions to contrast against the structured grid.
- **Data Gauges:** Circular or semi-circular with thin (2px-4px) stroke weights to maintain the "airy" feel.

## Components
### Buttons
- **Primary:** Deep Emerald background, white text, pill-shaped. Subtle lift on hover.
- **Secondary:** Solar Gold background, Emerald text. Used for "Calculate" or "Generate Report."
- **Ghost:** Transparent background with an Emerald border (1px).

### Cards & Containers
Cards are the primary unit of the design system. They must feature a subtle glass effect. The header of the card should use a `label-md` style for the category and `headline-md` for the title.

### Input Fields & Sliders
- **Inputs:** Soft-grey background with no border, becoming Emerald-bordered on focus.
- **Sliders:** Neomorphic tracks (inset shadow) with a high-contrast Solar Gold "thumb" for tactile feedback.

### Data Visualization
- **Line Charts:** Use thin strokes (1.5px) with an Emerald primary line and a soft cyan area fill at 5% opacity.
- **Health Indices:** Represented by semi-circular gauges using a "Solar Gold to Deep Emerald" gradient to show optimization levels.

### Iconography
Icons are 24px, 1.5px stroke weight, "Thin-line" style. They should never be filled unless they represent an active toggle state.