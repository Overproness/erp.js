# Design System Specification: The Technical Prism

## 1. Overview & Creative North Star

**Creative North Star: "The Crystalline Engine"**
This design system moves beyond the standard B2B SaaS template to create a high-performance, developer-centric environment. It is rooted in the concept of "The Crystalline Engine"—where complex data is not hidden, but refracted through layers of translucent glass and precise typography.

The system rejects the "boxed-in" aesthetic of traditional ERPs. Instead of rigid grids and heavy borders, it utilizes **tonal layering**, **isometric depth**, and **intentional asymmetry**. We treat the interface as a physical workspace of stacked glass sheets, where the electric blue primary color acts as a "conductive" energy, highlighting interactive paths and critical data points.

---

## 2. Colors & Surface Philosophy

The palette is dominated by the tension between "Electric Blue" and a range of high-performance grays.

### Surface Hierarchy & The "No-Line" Rule

To achieve a premium, editorial feel, **1px solid borders are prohibited for sectioning.**

- **The Rule:** Boundaries are defined solely through background shifts.
- **The Nesting Logic:**
- **Base:** `surface` (#f8f9fa) for the main application background.
- **Sections:** Use `surface_container_low` (#f3f4f5) to define large content areas.
- **Interactive Components:** Use `surface_container_lowest` (#ffffff) for cards and inputs to create a "lifted" feel against the gray background.

### The "Glass & Gradient" Rule

For floating elements (modals, dropdowns, and hover states), use **Glassmorphism**.

- **Tokens:** Use `surface_container_lowest` at 70% opacity with a `backdrop-blur` of 12px–20px.
- **Visual Polish:** Main CTAs should use a linear gradient: `primary` (#0058c3) to `primary_container` (#0070f3) at a 135° angle. This adds "soul" and depth to an otherwise flat technical interface.

---

## 3. Typography: Editorial Precision

We use **Inter** as the primary typeface. The goal is high-contrast information density without the clutter.

| Level        | Token         | Size      | Weight | Tracking | Purpose                           |
| :----------- | :------------ | :-------- | :----- | :------- | :-------------------------------- |
| **Display**  | `display-lg`  | 3.5rem    | 700    | -0.02em  | Hero marketing/Landing states     |
| **Headline** | `headline-sm` | 1.5rem    | 600    | -0.01em  | Module headers / Dashboard titles |
| **Title**    | `title-md`    | 1.125rem  | 500    | 0        | Sub-section headers               |
| **Body**     | `body-md`     | 0.875rem  | 400    | 0        | Primary data and descriptions     |
| **Label**    | `label-sm`    | 0.6875rem | 600    | 0.05em   | ALL CAPS / Metadata / Small UI    |

**The Typography Logic:** Headlines use tight tracking and heavy weights to feel authoritative. Body text stays at `body-md` for maximum legibility in data-dense tables. Labels provide a technical, "tagged" aesthetic.

---

## 4. Elevation & Depth

Depth is achieved through **Tonal Layering** rather than traditional drop shadows.

- **The Layering Principle:** Place a `surface_container_lowest` object on a `surface_container_low` background. The subtle shift from #f3f4f5 to #ffffff creates a natural, soft lift.
- **Ambient Shadows:** For floating glass elements (Modals/Popovers), use a shadow tinted with the `on_surface` color: `box-shadow: 0 20px 40px rgba(25, 28, 29, 0.06)`. It should feel like light passing through glass, not a dark smudge.
- **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., high-contrast mode), use the `outline_variant` token at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components & Data Density

### Buttons

- **Primary:** Gradient (`primary` to `primary_container`), `on_primary` text. Border-radius: `md` (0.375rem).
- **Secondary:** `surface_container_high` background with `on_surface` text. No border.
- **Tertiary:** Transparent background, `primary` text. Use for low-emphasis actions.

### Glassmorphic Cards

- **Style:** `surface_container_lowest` at 80% opacity.
- **Border:** A "Glass Stroke"—`1px solid rgba(255, 255, 255, 0.4)` on the top/left and `1px solid rgba(0, 0, 0, 0.05)` on the bottom/right. This mimics the edge of a glass pane.

### Data Tables & Lists

- **Spacing:** Use scale `3` (0.6rem) for vertical cell padding to maintain density.
- **No Dividers:** Prohibit the use of horizontal lines between rows. Instead, use a subtle background hover state (`surface_container_high`) and generous white space (Scale `10`) between logical groups.
- **Isometric Elements:** Use small isometric 3D icons (translucent glass style) to represent different ERP modules (e.g., Inventory, Finance).

### Form Inputs

- **Base State:** `surface_container_highest` (#e1e3e4) with a subtle inset shadow to appear "etched" into the surface.
- **Focus State:** Border shift to `primary` (#0058c3) with a 2px `primary_fixed` outer glow.

---

## 6. Do’s and Don’ts

### Do

- **Do** use overlapping elements. Let a glass card partially overlap a background gradient to show off the `backdrop-blur`.
- **Do** use the `2.5` (0.5rem) and `4` (0.9rem) spacing tokens for tight, technical alignments.
- **Do** prioritize `on_surface_variant` (#414754) for secondary text to maintain a sophisticated contrast ratio.

### Don't

- **Don't** use pure black (#000000) for text. Always use `on_surface` (#191c1d).
- **Don't** use rounded corners larger than `xl` (0.75rem). This system is about precision and technicality, not "bubble" friendliness.
- **Don't** use standard "drop shadows" on buttons. If a button needs to pop, use color weight, not shadow depth.
