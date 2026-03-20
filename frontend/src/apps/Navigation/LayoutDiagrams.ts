/**
 * NAVIGATION LAYOUT COMPARISON
 * ============================
 *
 * This file provides ASCII diagrams to visualize the navigation redesign
 */

/*
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OLD NAVIGATION                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Header (Top Bar - 70px height)                                             │
│  Logo | Search | Notifications | Profile                                    │
├────────────────────────┬────────────────────────────────────────────────────┤
│                        │                                                     │
│  Sidebar (280px)       │  Content Area                                      │
│  ┌──────────────────┐  │                                                     │
│  │                  │  │  (Available width = Screen Width - 280px)          │
│  │ 🏠 Dashboard     │  │                                                     │
│  │                  │  │                                                     │
│  │ 🏦 CRM ▼        │  │                                                     │
│  │  • Customers     │  │                                                     │
│  │  • Quotes        │  │                                                     │
│  │  • Invoices      │  │                                                     │
│  │  • Payments      │  │                                                     │
│  │                  │  │                                                     │
│  │ 📊 Marketing ▼   │  │                                                     │
│  │  • Campaigns     │  │                                                     │
│  │  • Social Media  │  │                                                     │
│  │  • Reputation    │  │                                                     │
│  │                  │  │                                                     │
│  │ 💬 Chat          │  │                                                     │
│  │ 🤖 AI Assistant  │  │                                                     │
│  │ 📄 Documents     │  │                                                     │
│  │ ⚙️  Taxes         │  │                                                     │
│  │                  │  │                                                     │
│  └──────────────────┘  │                                                     │
│                        │                                                     │
│  Takes 280px           │                                                     │
│  of screen width       │                                                     │
│                        │                                                     │
└────────────────────────┴────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEW NAVIGATION                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Header (Top Bar - 70px height)                                             │
│  Logo | Search | Notifications | Profile                                    │
├──────┬──────────────────────────────────────────────────────────────────────┤
│      │                                                                       │
│ Icon │  Content Area (MORE SPACE!)                                          │
│ Bar  │                                                                       │
│ 70px │  (Available width = Screen Width - 70px)                             │
│      │                                                                       │
│  🏠  │  ← +210px more space for content!                                    │
│  🏦  │                                                                       │
│  📊  │                                                                       │
│  💬  │                                                                       │
│  🤖  │                                                                       │
│  📄  │                                                                       │
│  ⚙️  │                                                                       │
│      │                                                                       │
│ Only │                                                                       │
│ 70px │                                                                       │
│      │                                                                       │
└──────┴──────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                    NEW NAVIGATION (WITH SUBMENU OPEN)                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Header (Top Bar - 70px height)                                             │
│  Logo | Search | Notifications | Profile                                    │
├──────┬────────────────┬────────────────────────────────────────────────────┤
│      │                │                                                     │
│ Icon │   Submenu      │  Content Area                                       │
│ Bar  │   Panel        │                                                     │
│ 70px │   240px        │  (Still more space than old: -70px vs -280px)      │
│      │                │                                                     │
│  🏠  │                │                                                     │
│ [🏦] │ CRM & SALES    │                                                     │
│  📊  │ ────────────   │                                                     │
│  💬  │ 👤 Customers   │                                                     │
│  🤖  │ 📋 Quotes      │                                                     │
│  📄  │ 📄 Invoices    │                                                     │
│  ⚙️  │ 💳 Payments    │                                                     │
│      │ 💰 Pay Methods │                                                     │
│      │                │                                                     │
│ Only │ Appears        │                                                     │
│ 70px │ when needed    │                                                     │
│      │                │                                                     │
└──────┴────────────────┴────────────────────────────────────────────────────┘
        ↑
        └─ Slides in when parent menu clicked
           Disappears when clicking outside or navigating


┌─────────────────────────────────────────────────────────────────────────────┐
│                         ICON SIDEBAR DETAIL                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐
│          │
│   70px   │  Width: 70px
│          │  Background: White (#ffffff)
├──────────┤  Border-right: 1px solid #e8e8e8
│          │  Shadow: 2px 0 8px rgba(0,0,0,0.06)
│   🏠     │  ← Dashboard (Normal state)
│          │  Icon: 22px, Color: #64748b (gray)
├──────────┤  Height: 56px per item
│          │
│  [🏦]    │  ← CRM (Active state)
│          │  Icon: 22px, Color: #1e3a8a (blue)
│  ┃       │  Background: #eaf4ff (light blue)
│          │  Left border: 3px solid #1e3a8a
├──────────┤
│          │
│   📊     │  ← Marketing (Hover state)
│          │  Icon: 22px, Color: #1e3a8a (blue)
│          │  Background: #f3f4f6 (light gray)
├──────────┤
│          │
│   💬     │  ← Chat
│          │
├──────────┤
│          │
│   🤖     │  ← AI Assistant
│          │
├──────────┤
│          │
│   📄     │  ← Documents
│          │
├──────────┤
│          │
│   ⚙️      │  ← Settings
│          │
└──────────┘

Tooltip on hover:
┌──────────────────────┐
│ 🏦  CRM (Customers   │
│     & Sales)         │
└──────────────────────┘
     ↑
     └─ Appears to the right of icon


┌─────────────────────────────────────────────────────────────────────────────┐
│                       SUBMENU PANEL DETAIL                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐
│  CRM (CUSTOMERS & SALES)        │  ← Title bar
│  ───────────────────────────    │     Font: 14px, bold, uppercase
│                                 │     Color: #1e3a8a (blue)
│  ┌───────────────────────────┐  │     Margin-bottom: 16px
│  │ 👤  Customers             │  │
│  └───────────────────────────┘  │  ← Submenu item (Normal)
│                                 │     Height: 40px
│  ┌───────────────────────────┐  │     Font: 14px, weight: 500
│  │ 📋  Quotes                │  │     Color: #1F2937
│  └───────────────────────────┘  │     Padding: 10px 12px
│                                 │     Border-radius: 8px
│  ┌───────────────────────────┐  │
│  │ 📄  Invoices              │  │  ← Hover state
│  └───────────────────────────┘  │     Background: #f3f4f6
│       ↑ Background: #f3f4f6     │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 💳  Payments              │  │  ← Active state
│  └───────────────────────────┘  │     Background: #dbeafe
│       ↑ Background: #dbeafe     │     Color: #1e3a8a
│         Color: #1e3a8a          │     Font-weight: 600
│                                 │
│  ┌───────────────────────────┐  │
│  │ 💰  Payment Methods       │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘

Width: 240px
Position: Fixed at left: 70px
Animation: slideIn 0.2s ease-out
Shadow: 4px 0 12px rgba(0,0,0,0.08)
Padding: 16px 12px


┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTERACTION FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

For items WITHOUT submenu (Dashboard, Chat, Documents, etc.):
─────────────────────────────────────────────────────────────

   User hovers icon
         ↓
   Tooltip appears
   "Dashboard"
         ↓
   User clicks icon
         ↓
   Navigate to /
   (No submenu)


For items WITH submenu (CRM, Marketing, etc.):
──────────────────────────────────────────────

   User hovers icon
         ↓
   Tooltip appears
   "CRM (Customers & Sales)"
         ↓
   User clicks icon
         ↓
   Submenu panel slides in →
   Shows all sub-options
         ↓
   User clicks sub-option
         ↓
   Navigate to page
   Submenu closes

   OR

   User clicks outside
         ↓
   Submenu closes
   (No navigation)


┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESPONSIVE BEHAVIOR                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Desktop (Screen Width > 768px):
────────────────────────────────
┌──────┬─────────────────────────────┐
│ Icon │  Content                    │
│ 70px │  (Flexible)                 │
└──────┴─────────────────────────────┘

With Submenu:
┌──────┬────────┬────────────────────┐
│ Icon │ Sub    │  Content           │
│ 70px │ 240px  │  (Flexible)        │
└──────┴────────┴────────────────────┘


Mobile (Screen Width ≤ 768px):
───────────────────────────────
┌─────────────────────────────────┐
│  Header [≡ Menu]                │
├─────────────────────────────────┤
│                                 │
│  Content (Full Width)           │
│                                 │
└─────────────────────────────────┘

Menu button clicked → Drawer opens:
┌───────────────────┐
│  Drawer (280px)   │ Slides from left
│  ───────────────  │
│  🏠 Dashboard     │ Full navigation
│  🏦 CRM ▼        │ (Same as old)
│    • Customers    │
│  💬 Chat          │
│  ...              │
└───────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         SPACE COMPARISON                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Example: 1920px wide screen

Old Navigation:
┌────────────────────────┬────────────────────────────────────────────────┐
│  Sidebar: 280px        │  Content: 1640px                               │
└────────────────────────┴────────────────────────────────────────────────┘
                         └─ 85.4% of screen for content


New Navigation (No submenu):
┌──────┬─────────────────────────────────────────────────────────────────┐
│ 70px │  Content: 1850px                                                │
└──────┴─────────────────────────────────────────────────────────────────┘
       └─ 96.4% of screen for content (+11% gain!)


New Navigation (Submenu open):
┌──────┬────────┬────────────────────────────────────────────────────────┐
│ 70px │ 240px  │  Content: 1610px                                       │
└──────┴────────┴────────────────────────────────────────────────────────┘
                └─ 83.9% of screen for content
                └─ Still competitive, but submenu is temporary!


BENEFIT: 210px (12.8%) more space most of the time!


┌─────────────────────────────────────────────────────────────────────────────┐
│                              Z-INDEX LAYERS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

From bottom to top:

┌─────────────────────────────────────────────────────────────────────────────┐
│  Content Area                                             (z-index: auto)    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Header                                                   (z-index: 1000)    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  Backdrop (when submenu open)                             (z-index: 1001)    │
│  Transparent overlay - catches clicks outside submenu                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────┐
│ Icon │                                                     (z-index: 1002)
│ Bar  │
└──────┘

     ┌─────────────────┐
     │  Submenu Panel  │                                    (z-index: 1003)
     └─────────────────┘

This ensures:
- Submenu appears above icon bar
- Backdrop catches outside clicks
- Header stays on top
- No z-index conflicts

*/

export const LAYOUT_DIAGRAMS = 'See comments above for visual reference';
