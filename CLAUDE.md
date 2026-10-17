@AGENTS.md

# MuteBites

Food delivery site for VIT-AP University students.

## Stack

- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (`src/components/ui`)
- **Design tokens** (`src/app/globals.css`): plum `#552C4A` is ink,
  amber carries every action (`--primary` `#99581B` — a shade darker than
  the approved `#A9631F`, which fails AA as text on the ivory ground; it
  was `#A25E1D` until the page sky below needed the headroom),
  rose `#914955` is the secondary accent, blush/lavender are tint surfaces
  only, raw amber `#C07A35` is decorative only (3.5:1, never text). Fixed
  5-step ramps (`plum-`/`rose-`/`amber-`/`ivory-`/`forest-`/`brick-`
  100–900) sit alongside semantic tokens that flip per theme — prefer the
  semantic ones. Surfaces step ground (`--background`) → card → raised
  (`--popover`), with `shadow-card` / `shadow-raised` / `shadow-overlay`
  elevation. Text on a coloured fill uses its `*-foreground` token
  (`text-success-foreground`, `text-destructive-foreground`, …), never
  `text-white` — dark-mode fills are light, so white fails there. Don't
  put `text-primary` on `bg-secondary`/`bg-brand-soft` (below 4.5:1). Use
  `text-brand-soft-foreground` on blush instead.
  **Hero surfaces** (redesign, 14 Oct 2026) — token card, Today card, cart
  bar, member card, closed banner, celebration, 404 card, admin passcode
  tile — are `surface-hero bg-hero text-hero-foreground` with `glow-hero`:
  a lit plum gradient (`--hero-a/-b/-c`, an amber light top-right
  `--hero-glow`, a rose bloom bottom-left `--hero-bloom`), **the same in
  both themes**. On it use `text-hero-accent` / `-hero-success` /
  `-hero-danger`, and secondary lines no fainter than
  `text-hero-foreground/85` (the audit checks every stop). `bg-ink` stays
  for **selected chips** (it flips to lavender at night so a selected chip
  still stands out) — don't use it for new hero surfaces.
  **Lighting kit:** `glow-amber` (the main action's bloom), `glow-hero`,
  `glow-rose`, `rim-light`; one bloom per screen region. Every page sits
  under a soft amber + rose sky (`body`, `--page-glow-a/-b`). Light cards
  cast warm amber-tinted shadows; dark cards carry a 1px rim light inside
  `--elevation-card`. Buttons (`components/ui/button.tsx`) are pills; the
  default one is `surface-primary` (lit amber). **For a red or green button
  use `variant="danger"` / `variant="success"`** (dialog confirms: Cancel
  order, Close ordering, Ban, Sign out, Mark all delivered) — never
  `className="bg-destructive"` on the default variant: its amber gradient is
  a background-image and still paints over any `bg-*` colour (that made
  every red confirm amber until 15 Oct 2026). A one-off colour (Google's
  white sign-in button) uses `variant="ghost"`. Status chips
  (`statusBadge()`): Placed / Preparing `amber-soft`, Confirmed
  `plum-soft`, Out for delivery `brand-soft`, Delivered `success-soft`,
  Cancelled red. Dialog / sheet backdrops are `bg-plum-900/40–50` with a
  blur. Skeletons shimmer with a warm amber band.
  Focus rings are `ring-ring/80` (3.5:1+ on card) and input borders use
  `--input` (3.4:1+) — both chosen to meet WCAG's 3:1 for non-text UI;
  don't drop them back to /40 or the old pale border. `npm run
  audit:contrast` (`scripts/contrast-audit.mjs`) re-checks every token pair
  the app uses in both themes and fails if any pair is below its minimum —
  run it after touching colours, and add a pair when you introduce a new
  text/surface combination.
- **Typography**: Fraunces (`font-heading`, SOFT axis at 50 via a base
  rule in `globals.css`) for display text and big numerals; Plus Jakarta
  (`font-sans`) for body **and buttons** — buttons never use
  `font-heading`. Sizes above body come from the named scale in
  `globals.css` — `text-display` (hero), `text-headline` (page titles),
  `text-title` (card/section titles) — not one-off `text-[2.5rem]`s.
  Small captions above fields/sections use `text-label`: sentence case,
  sans, no letter-spacing. No mono font is loaded any more; don't bring
  back the mono-uppercase eyebrow style, and no `uppercase` anywhere.
- **Themes (palettes)** — two, picked per device (Profile → Settings →
  Theme, and the first-login form's "Pick a theme"), independent of the
  Light / Dark / System switch: **MuteBites Plum** (`plum`, the default —
  everything described above) and **Desi Kaapi** (`kaapi`: cream ground,
  espresso text, coffee-brown actions with cream text, a turmeric → caramel
  → rose-milk hero with espresso text on it, rose-milk selected chips and
  tints, teal focus rings; dark is an espresso night with turmeric actions
  — ported from College Bites' "Kaapi"). Each is a complete light + dark
  token set in `globals.css`: the plum blocks are `:root,
  [data-palette="plum"]` and `.dark, .dark [data-palette="plum"]`; Kaapi's
  are `[data-palette="kaapi"]` and `.dark[data-palette="kaapi"], .dark
  [data-palette="kaapi"]`. `[data-palette]` ties with `.dark` on
  specificity, so Kaapi's light block (later) overrides plum dark and its
  dark block then wins — so **Kaapi must define every token the plum blocks
  do**; `npm run audit:contrast` fails on a missing one and checks all four
  sets (plum / kaapi × light / dark). `data-palette` on `<html>` is set
  before first paint by the theme-init script and kept by `setPalette()` /
  `usePalette()` (`src/lib/theme/store.ts`, localStorage
  `mutebites.palette`, a cross-fade like Light / Dark); names, blurbs and
  each palette's ground live in `src/lib/theme/palettes.ts` (the ground
  also drives the browser-bar `theme-color`). The palette blocks key on
  the attribute alone, so it works on ANY element — the picker's preview
  cards (`PalettePicker`) set `data-palette` on themselves. Per-palette
  tokens for what used to be fixed plum: `--brand-1/2/3` (food ring,
  progress bars, milestone rings), `--scrim` (dialog / sheet backdrops,
  `bg-scrim/40–50`), `--knob-ink` (switch knob icon), `--promo-light`,
  `--confetti-1…5`. **Desi Kaapi looks exactly like College Bites' Kaapi**
  (by the user's request, 15 Oct 2026), so it also switches, per palette:
  the **fonts** (`--app-sans` / `--app-heading`: Plum is Plus Jakarta +
  Fraunces, Kaapi is Inter + Poppins — both loaded in `layout.tsx`, Kaapi's
  with `preload: false` so Plum never downloads them); the **action
  surface** (`--surface-primary`: Plum's lit amber, Kaapi's coffee →
  cinnamon `--primary` → `--primary-2` with a top highlight); the **hero
  surface** (`--hero-surface`: Plum's amber corner + rose bloom, Kaapi's
  coffee wash with crema light); and Home's **headline gradient**
  (`text-heading`, `--heading-a/b/c` — solid ink for Plum). Kaapi-only
  pieces, all from College Bites: `KaapiMotif` (the tumbler in its davara
  with rising steam — campus pass corner, admin Today card, celebration
  overlay, picker), `PassArt` (`src/components/theme/pass-art.tsx`, the
  small steaming tumbler by the "Campus pass" label), the **promo card's
  campus scene and 9 s delivery run** (`PromoCard` renders a Plum and a
  Kaapi version; `public/photos/promo/kaapi-scene.webp` + `kaapi-rider.webp`,
  College Bites' art; `promo-*` CSS in `globals.css`) and the **sign-in
  scene** (`src/app/login/kaapi-login-scene.tsx` + `login.css`: a tumbler
  on a wooden table, beans drifting, three dishes floating as prints — Plum
  keeps the photo mosaic). Shown by `only-kaapi` / `only-plum`
  (`display: var(--show-kaapi|--show-plum)`, which follow the nearest
  data-palette). Icons stay lucide in both (College Bites uses Phosphor). Adding a palette = a light and a dark block in
  `globals.css`, an entry in `palettes.ts`, and its blocks in the audit.
  Never hard-code a brand colour in a component — use a token.
- **Home header mood field**: `HomeHeader` bleeds to the screen edges over
  `.mood-field.mood-<morning|afternoon|evening|night>` (`globals.css`),
  driven by `getTimeOfDayIST()`. Each mood has three `--mood-<time>-a/b/c`
  stops per theme, checked at ≥6.7:1 for the plum heading on top — re-check
  contrast if you change them.
- **Order tracking ticket**: the token card (`order-tracking.tsx`) is a
  ticket stub — up to three distinct photos of the ordered dishes on top,
  a dashed tear line with edge notches (`bg-background` circles), then the
  token and the delivery window. `deliveryWindow()` (`src/lib/date.ts`)
  returns `{ lead, time }` with no-break spaces inside `time`, so "8:15 PM"
  can never wrap apart. Its cut-offs are the old daily schedule's, kept by
  decision when ordering became Open / Closed only (14 Oct 2026): placed
  before 12:45 PM → by 1:30 PM, before 6:00 PM → by 7:30 PM, before 7:00 PM
  → by 8:15 PM, later → "to be confirmed"; they mirror `slotEndTime()` —
  see `app_settings` under Database schema. Once delivered, the ticket page also carries the
  rating card (`RateOrder`, see `order_reviews`).
  Redesign (15 Oct 2026): the stub is the lit plum hero, the token is
  `text-6xl`, the gate line is a pill ("Collect at VIT-AP Main Gate · pay
  on delivery"), the step list sits in a card, and while the order is live
  a footer strip carries **`DeliveryRoad`**
  (`src/components/orders/delivery-road.tsx`): the road from the kitchen
  (chef's hat) to Main Gate (pin), timed by the order's **slot**, not
  minutes — a jiggling `CookingPot` with steam (`animate-cook`,
  `cook-steam`) at the kitchen with a kitchen line (`COOK_LINES`) while
  it's made, then lucide's `Motorbike` (`animate-scooter`) riding for the
  last `RIDE_MINUTES` (35) before `slotEndTime()` (never before 40% of the
  way), reaching just short of the gate at slot end with ride lines; past
  slot end the bubble apologises (`LATE_LINES`). An order after 7 PM (no
  slot) gets a 60-minute run. Re-read every 15 s; lines change every 30 s.
  Status keeps it honest: pending stays at the kitchen with no line, out
  for delivery always shows the rider (from 50%), delivered → a tick at the
  gate (the road stays on the ticket after delivery, "At the gate. Enjoy!";
  only a cancelled order drops it). Before the first tick (and on the server) it shows the pot, so
  hydration matches. Positions are a `--p` custom property moved by CSS
  transitions. The Orders list's in-progress card reuses it (`tone="card"`,
  no message) with its status chip; past rows show the coloured
  Delivered / Cancelled chip. In the step list, done stretches of the
  connector are solid green and the ones still to come are dashed.
- **Profile**: one plum `MemberCard` (`src/components/profile/member-card.tsx`)
  holds identity, the weekly-rank pill and the three stats (cravings
  solved, day streak, no-shows). Since the redesign (15 Oct 2026) it's the
  "campus pass": the lit plum hero, the initials in a plum circle inside a
  turning `food-ring`, stats as lit tiles (`bg-hero-foreground/10
  rim-light`, full-strength labels). Milestone tiles: unlocked = a lit plum
  circle with an amber icon and `animate-shine` (a light band sweeping
  across now and then); locked = a plum → rose → amber progress ring (SVG
  `linearGradient`, one id per tile, `ring-<key>`); the six tiles rise in
  one after another (`animate-slide-up-in`, 50 ms apart). `MilestoneReward`: a
  blush card with a plum → amber "N to go" bar until everything's
  unlocked, then the lit hero with a "Claim it on WhatsApp" pill (until
  an admin marks it claimed). Details and settings rows lead with
  `IconTile`; Edit buttons are blush pills, Save is the lit amber pill;
  switches glow amber when on. **Campus Explorer counts every restaurant
  row** (`getRestaurantCount()`), not just `is_active` ones — Closed turns
  them all off nightly, which made the target 0 ("-5 more restaurants",
  and the badge re-locked overnight) until 15 Oct 2026. Milestones are data-driven in
  `MILESTONES` (`milestone-badges.tsx`) — six tiers, all computed from
  counts that only go up (delivered orders, distinct restaurants), so a
  badge never re-locks; locked tiles show a progress ring and "N to go".
  Under the milestones, **Liked dishes** (`LikedDishes`,
  `src/components/profile/liked-dishes.tsx`, ported from College Bites,
  15 Oct 2026): every dish the student hearted, newest first, as a
  snap-scrolling row of photo cards → the `?dish=` deep link; sold-out
  ones greyed; an empty hint pointing at the heart.
- **Taste profile and avatars** (`public.taste_profiles`, see the schema
  below; `src/lib/taste/`, `src/components/taste/`; ported from College
  Bites, 15 Oct 2026): a student keeps their **initials** until they pick
  one of 11 lucide food avatars (`AVATARS` in `src/lib/taste/options.ts` —
  biryani pot, noodle bowl, chilli heat, drumstick, fried egg, burger,
  chai, juice, grapes, ice cream, donut; with "Your initials" first the
  picker is an even 4 × 3), each on a round tile in an audited palette
  surface (`Avatar`, `src/components/taste/avatar.tsx`: hero / action /
  selected-chip ink / blush / plum-soft / amber-soft; `tone="pass"` on the
  campus pass) — no uploads. Plus three questions: spice 1–5 (Mild …
  Extra spicy), diet (Veg / Egg is fine / Non-veg) and cravings (any of
  Home's `FOOD_TYPES`). One "Your taste" bottom sheet per page
  (`TasteSheetHost` on Home and Profile, opened through
  `src/lib/taste/sheet-store.ts`) by the Home header avatar, the campus
  pass avatar, Profile's "Your taste" row (`tasteSummary()`, e.g. "Gentle
  · Veg · Biryani, Desserts", blush Edit pill) and the nudge; it saves in
  one `saveTasteProfile()` upsert (`src/lib/taste/actions.ts`,
  `revalidatePath("/", "layout")`). `getTasteProfile()`
  (`src/lib/data/taste.ts`, request-cached) returns the defaults when
  there's no row. What the answers do: cravings, then the food types of
  the student's hearted dishes (`heartCravings()` → `cravingOrder()`),
  lead "What's on your mind?" (`RestaurantList`'s `cravings`; the sheet
  marks the heart-derived ones "From your hearts" while no cravings are
  picked); spice 1–2 / 5 offers a one-tap blush "Less spicy please" /
  "Extra spicy please" chip under the cart's notes box (`spiceNote()`,
  passed from Home and the menu through `CartBar` → `CartSheet`) — never
  typed in for them. The **"Finish your profile"** card
  (`FinishProfileNudge`) floats above the bottom bar on Home once the
  student has placed an order (`hasPlacedOrder()`) and hasn't answered all
  three (`answeredCount()`), after the splash plus ~1.8 s; "Later" hides
  it for 3 days, × for good, and saving in the sheet also snoozes it
  (localStorage `mutebites.taste-nudge`); it hides while the cart bar or
  the sheet is showing.
  Under the grid, a blush `MilestoneReward` card carries the client's
  offer: all six milestones = one free biryani of their choice. Earned →
  a WhatsApp link (`SUPPORT_PHONE`) with a prefilled claim message; once
  an admin marks it handed over on `/admin/users` (`milestone_rewards`,
  `setMilestoneRewardClaimed()`) the card says "Free biryani claimed".
  The admin row's "Mark claimed" (confirm dialog, with Undo) only appears
  for students who've unlocked every milestone, computed server-side in
  `getAllUsers()` with the same `getUnlockedMilestones()`; a "Free biryani
  earned" chip filters the list to them.
  A newly unlocked milestone (per device, `mutebites.milestones-seen`)
  plays the same full-screen celebration as "Order placed!" — both use
  `CelebrationOverlay` (`src/components/celebration-overlay.tsx`: plum
  overlay, confetti unless reduced motion, the chime, tap or ~2 s to
  dismiss); several at once share one overlay naming them all. Render it
  outside any `<ViewTransition>`.
- **404 / error pages**: `src/app/not-found.tsx` ("Token #404"),
  `src/app/error.tsx` and a self-contained `src/app/global-error.tsx`, all
  using `LostTicket` (`src/components/lost-ticket.tsx`) where they can. This
  Next.js version passes `retry` (not `reset`) to error boundaries.
  `getRestaurantMenu()` / `getOrder()` return null for a malformed id
  (`isUuid()`, `src/lib/ids.ts`), so a mangled URL is a 404 rather than a
  Postgres error. Empty states go through `EmptyState`
  (`src/components/empty-state.tsx`): `art="plates"` for empty cart /
  orders, an icon for in-place no-match states.
- **Icons**: lucide only — no emoji anywhere in the UI (they render
  differently per OS and clashed with the icon set). Big
  moments get `CelebrationOverlay`, not an emoji-laden toast.
- **Bottom bar** (`TabBar`, `src/components/nav/tab-bar.tsx`, redesign 14
  Oct 2026): mounted once in the **root layout**, not per page, so it stays
  alive across tab changes and its lit amber pill (`surface-primary
  glow-amber`) slides — with a spring and a squash as it lands — to the
  tapped tab while the new icon pops in (`animate-tab-pop` /
  `animate-tab-stretch`; lucide, stroke 2.5 when lit). It shows on exactly
  `/`, `/orders` and `/profile`; on drill-down screens (`/restaurants/*`,
  `/orders/*`) it slides down and is `inert`; elsewhere it renders nothing.
  Tapping the current tab scrolls to the top. It's also a slider: press
  and slide sideways (past 8px) — the pill follows the finger (pointer
  capture), the tab under it lights up with a tiny `navigator.vibrate`
  buzz, and release `router.push`es it; the click after a drag is
  swallowed; `touch-action: pan-y` keeps vertical scrolling. Floating
  (`rounded-full bg-card/85` with blur), so pages keep `pb-28`; Home's
  `CartBar` (`hasTabBar`) sits just above it. Don't add `<TabBar />` to a
  page.
- **Home layout** (redesign, 15 Oct 2026; `src/components/home/`): the
  mood header (logo → About; the student's avatar — their initials in a
  lit plum circle until they pick a food icon — → the "Your taste" sheet;
  a small time-of-day line — "Good morning / afternoon / evening",
  "Still up" — then "Hey, <first name>" as the h1 in `text-heading`, then
  the hour's question), the closed banner while ordering is
  Closed, the pill search, **"What's on your mind?"** (`FoodTypeRail`:
  round photo tiles for `FOOD_TYPES` in `src/lib/home-filters.ts` —
  Biryani, Fried rice, Noodles, Starters, Curries, Chicken, Paneer, Egg,
  Juices, Fruits, Desserts; matched on dish name + section, a dish can be in
  several; tile photos are literal paths there — update them if a photo is
  renamed; the chosen tile wears a turning plum/rose/amber `food-ring`),
  the sticky `FilterBar` chips (Filters with a count, Sort, Veg / Non-veg,
  Under ₹200, and Popular once `POPULAR_MIN` = 3 dishes have 3+ orders in
  30 days; lit chips use `bg-ink`) and `FilterSheet` (a bottom sheet that
  edits a draft — sort, diet, price bands, restaurants, popular, show
  sold-out — with a live "Show N dishes"). No delivery-time filter (slots,
  not minutes). State lives in the URL (`?type=biryani&diet=veg…`,
  `parseFilters` / `serializeFilters`, written with
  `history.replaceState`), so Back from a dish restores it. While
  searching or filtering, the promo and favourites give way to `DishGrid`
  (two-column photo cards → `?dish=`, 12 at a time) and the restaurants
  serving something in it. Browsing: `PromoCard` (only while ordering is
  open — the lit plum "Hot food, at Main Gate" with the real
  `deliveryWindow()` for an order placed now, Free delivery / Cash or UPI
  chips and the mascot tile floating), then `PopularRail` "Campus
  favourites" (`buildRail()`: the week's trending dishes ranked #1, #2…,
  then signature dishes, `getSignatureDishes()`, to fill 8) — it replaced
  the flame-button Trending popup — then the restaurant cards (cuisine
  chips in blush, dish count + "from ₹X", a glowing amber arrow; the first
  card's cover loads at high priority). **Campus Closed turns every
  restaurant off**, so while none is on, tiles / filters / favourites
  browse every menu (`includeClosed`) instead of coming up empty.
- **WhatsApp group** (`WHATSAPP_GROUP_URL` in `src/lib/support.ts`, added
  15 Oct 2026; `src/components/channel/`, ported from College Bites'
  channel): a **group** invite by the client's choice, not a channel —
  members can see each other's numbers and post, and a group caps at
  1,024 members — so the card never promises privacy; it says "Group
  members can see your number". `ChannelPopover`: a round WhatsApp button
  left of the Home header avatar; tapping it opens a Base UI popover card
  (`z-50`) that grows out of the button's corner with a spring
  (`.channel-pop`, transitions on `data-starting-style` /
  `data-ending-style`, origin `--transform-origin`) and its rows rise in
  one by one (`.channel-rise`, `--i` stagger): a hero strip (Kaapi's
  tumbler under Kaapi), three perks, a lit "Join on WhatsApp" pill
  (`target="_blank"`) and the number note. Until it's opened once on the
  device (`mutebites.wa-group-seen`, a `useSyncExternalStore` store in
  `channel-seen.ts`; server snapshot = seen, so nothing flashes) the
  button carries a pulsing dot and wiggles twice after the splash
  (`.channel-wiggle`, paused under the splash). Also on Profile
  (`ChannelCard`, under "Need help?", a blush "Join" pill) and in the
  About popup ("Join our WhatsApp group"). If the invite link is reset in
  WhatsApp, update `WHATSAPP_GROUP_URL`.
- **Dish deep links**: `/restaurants/<id>?dish=<dishId>` opens the menu
  scrolled to that dish with a brief rose outline (`focusDishId` in
  `MenuView`). Used by Home's dish grid (search / filters), the "Campus
  favourites" row and the Thursday banner (`getThursdaySpecial()` returns `dishId`).
- **Home search** searches dishes as well as restaurants: every dish ships
  with the page (`getSearchableDishes()`, ~100 rows) and `searchDishes()`
  (`src/lib/search.ts`) filters on the client — every typed word must start
  a word in the dish name, its category or its restaurant's name, in any
  order. "veg" / "non veg" filter on the dish's veg flag instead of text
  (so "veg" never matches inside "Non-Veg Biryani"). A "Dishes" section
  shows above restaurants; restaurants also appear if they serve a match.
- **Menu layout**: in each section, dishes **with** a photo
  (`getDishPhoto()`) sit in the two-column photo grid; dishes **without**
  one render underneath as a compact list (`DishCard`'s row form — name,
  veg mark, price, note, same add control) instead of a blank tile.
- **Sizes (portion picker)** (`src/lib/menu/portions.ts`, ported from
  College Bites, 15 Oct 2026): dishes that differ only by size are ONE menu
  card — "<name> (500 g)" / "(1 kg)" (Fresh Fruits), "(Glass)" /
  "(1 Bottle)" (Bismillah's Sugarcane Juice), "<name> Half" / "Full"
  (Bheemasena's Chicken Tandoori). Only those size words count ("Sweet
  Lemon Juice (Mosambi)" is a name); a size with no sibling stays a plain
  dish (Papaya (1 kg)). The card shows the base name, every size's price
  and one photo (whichever size has one); its "+" (or "n ›" once any size
  is in the cart) opens `PortionSheet` (`portion-sheet.tsx`, "Choose a
  size": a row per size with its own Add / stepper, sold-out rows
  disabled, Done). Each size is still its own dish underneath (id, price,
  cart line, order item, `place_order()`), so nothing server-side changed;
  the cart line shows the base name with a blush size chip
  (`splitPortion()`). `menuItems(section)` is the one grouping rule — never
  in a section with add-ons — used for the cards, the section counts and
  the "tried N of M" bar (`getTriedDishIds()`; a sized card counts as tried
  if any size was delivered). `?dish=` links to any size land on the card.
  A new sized dish just needs one of those spellings, or a new word in
  `TAGGED` / `ORDER`.
- **Menu filters** (`MenuView`, `src/components/menu/menu-view.tsx`): one
  sticky row — search icon, then a scrolling rail of **Veg** / **Non-veg**
  (mutually exclusive, tap again to clear; red on light red for non-veg)
  and the category chips. The diet toggles only appear on a menu that has
  both kinds of dish.
- **Menu and cart look** (redesign, 15 Oct 2026): the cover photo is
  untinted; the sheet rising over it (with a soft plum glow on its top
  edge) carries the name, description, chips (cuisines in blush, "Free to
  Main Gate") and `MenuProgress` — a plum → rose → amber bar that fills
  from empty on first paint (`.progress-fill`, `@starting-style`) with "N
  to go". Section headings put their food icon on a blush tile
  (`SectionHeading`; `getCuisineIcon` passed in as a prop — the React
  compiler lint rejects choosing a component during render; Waffle Pops'
  sections have dessert icons) with a count pill. Idle chips are cards
  with a shadow; selected ones `bg-ink`. `DishCard`'s add control is ONE
  lit amber pill that widens from a round "+" into the "− n +" stepper
  (`transition-[width]`, `ease-spring`) and shrinks back; it only glows
  (`glow-amber`) once the dish is in the cart, and keyboard focus follows
  it. Add-on dishes keep a round "+" that opens the extras sheet, with a
  count badge. Prices are amber (`text-primary`). A dish photo leans in
  (`scale-105`) on mouse hover — on a wrapper round `BlurImage`, so it
  doesn't fight the image's own fade-in transition. **Hearts**
  (`HeartButton`, `src/components/menu/heart-button.tsx`, see
  `favorite_dishes`): a frosted heart in the photo's top-right corner (in a
  photo-less list row, a plain one beside the add control) fills at once
  with a pop and a 10 ms buzz, saves through `setDishLiked()`
  (`src/lib/favorites/actions.ts`) in the background and reverts with a
  toast if that fails. The action does **not** `revalidatePath` — in this
  Next.js a revalidating action re-renders the current page in the same
  round trip, i.e. the whole menu per tap — so the button remembers taps
  for the session (module-level `TAPPED`), and Profile reads fresh. A sized
  card has one heart, on its first size. Since the heart took the photo's
  corner, the "Your favorite" / "Highly re-ordered" tag sits under the
  photo, above the name (it was cut to "You…" at 320px). Cart: the cart bar is a
  plum pill with a lit "View cart" pill; the sheet's handover and contact
  rows lead with `IconTile` (`src/components/icon-tile.tsx`), "Change" is
  a small pill, Delivery shows a green "Free" chip, the total is amber
  and bounces (`animate-bounce-count`, keyed on the amount) when it changes,
  and "Place order" is a pill that shimmers (white band) while placing.
- **Notifications** (web push, `src/lib/notifications/`): students get
  *confirmed*, *delivered* and *cancelled*; the address in
  `ADMIN_ALERT_EMAILS` (`send.ts`) gets *new order*. `public/sw.js` is a
  notifications-only service worker — **no fetch handler on purpose**, so
  it can never serve a stale page. `client.ts` registers it, asks
  permission and saves the subscription (`actions.ts` → the
  `push_subscriptions` table); `send.ts` delivers with `web-push` and
  deletes rows a push service reports as gone (404/410). Sends run inside
  `after()` so a slow push service never holds up an order or a status
  change, and never throw. Student sends go through the admin's own
  session (admins can read every subscription row); the *new order* send
  can't (a student's session can't see the admin's devices), so it uses
  the service-role client (`src/lib/supabase/admin.ts` — the only place
  that key is used; missing key = no admin push, everything else fine).
  Env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`. UI: a switch in Profile, a one-time
  "Get a ping" card on a live order (`mutebites.notify-asked`), and
  `NewOrderAlerts` on the dashboard — Realtime `orders` inserts play a
  **loud** repeating alarm (`playAdminAlertSound()`, its own
  `mutebites.admin-alert-sound` switch, deliberately not the student
  chime), count new orders and refresh the list. Browsers block audio
  until a real tap, so the bell both grants permission and arms the sound.
  A push notification's *own* sound is the phone's setting, not ours —
  admin pushes only set `requireInteraction` and a long vibrate.
- **Motion**: CSS only (no Framer Motion). Easing tokens `--ease-out-expo`
  / `--ease-spring` / `--ease-in-quad` (also Tailwind `ease-*` utilities) and
  durations `--dur-press|quick|base|slow` in `globals.css` — use them rather
  than hand-typed curves. New animations go inside the existing
  `prefers-reduced-motion: no-preference` block; a reduce-motion safety net
  at the bottom collapses anything else (library animations included) to
  its end state, spinners exempt. The global press rule transitions colour
  and shadow as well as transform on purpose — it's unlayered, so a bare
  `transition: transform` there would override every `transition-colors`.
  Shared-element view transitions (card → menu hero) were considered and
  skipped: the menu has a `loading.tsx`, so the pair rarely forms.
- **Backend**: Supabase (Postgres + Auth + Row Level Security)
- **Auth**: "Continue with Google" via Supabase Auth (Google OAuth
  provider). Sign-out is `scope: "local"` (this device only; the default
  "global" logged students out everywhere). No email/password, no OTP. On first login (no matching
  `public.users` row yet), the app collects full name + mobile number
  before continuing; returning users skip straight in.
- **Payments**: Cash on delivery only — there are no payment fields or
  payment provider anywhere in this codebase. Don't add any. The "About
  MuteBites" popup (see below) also mentions UPI as accepted at pickup —
  that's real, but purely physical, an informal option between the runner
  and student handled entirely outside the app, the same as cash; it's
  not tracked, processed, or reconciled by anything here, so it doesn't
  contradict the rule above. Don't build actual UPI integration (a QR
  code, a payment record, verification) without this being revisited
  first — that would be a real payment provider, which this app
  deliberately doesn't have.
- **Hosting**: Vercel. `vercel.json` pins the serverless function region to
  `bom1` (Mumbai) to match the Supabase project's `ap-south-1` region —
  found (2026-09-17) that Vercel's default function region is US-East,
  so every DB/auth call was crossing from Virginia to Mumbai and back on
  every request, which was the actual cause of slow page loads (far
  bigger than the redundant `auth.getUser()` call fixed alongside it in
  `src/lib/profile.ts`). If Supabase's region ever changes, update this
  to match.
  **The GitHub repo is public on purpose** (since 2026-10-05): Vercel's
  Hobby plan blocks git deploys from a *private* repo when the commit
  author (Pilli9375) isn't the Vercel project owner (`mutebites`) — every
  push from 22 Sep to 4 Oct showed "Blocked", and CLI deploys were
  blocked too (they carry the same git author). Making it private again
  needs Vercel Pro with the author added as a team member. Never commit
  secrets: history was checked clean before going public, and
  `.vercelignore` keeps `.env*` out of any CLI upload.
  Every push to `main` auto-deploys (usually ~30 s). The Hobby plan
  allows 100 deployments a day and builds one at a time, so batch small
  follow-up fixes into one push rather than pushing each tweak. The Vercel
  CLI works via `npx -y vercel@latest` (`ls mutebites`, `inspect <url>
  --logs`, `redeploy <url>`) with the saved login. A deploy stuck on
  "Initializing" with no build logs has, so far, been a Vercel-side
  incident — check https://www.vercel-status.com before redeploying (a
  redeploy just queues behind it).

## Admin access

`/admin` has two layers, both required, neither optional:
1. `requireAdmin()` (`src/lib/admin/guard.ts`) — signed in via Google, and
   `users.role = 'admin'` (see Database schema below for how that's set).
2. A separate passcode, checked in `src/app/admin/layout.tsx` after (1)
   passes. The passcode lives only in the `ADMIN_PASSCODE` env var —
   never hardcoded, never committed. Entering it right sets an httpOnly,
   `/admin`-scoped session cookie holding an HMAC of the admin's user id
   keyed by the passcode, never the passcode itself, compared in constant
   time (`src/lib/admin/passcode.ts` / `passcode-actions.ts`) — it only
   works for that admin, and changing the passcode logs every device out; no `ADMIN_PASSCODE` set means the gate **fails
   closed** — nobody gets in, admin role or not — rather than silently
   letting everyone through.

The main `/admin` dashboard's list is **Current orders**: today's (IST)
orders until their delivery slot ends (`slotEndTime()`), after which a
delivered/cancelled order drops off; pending/confirmed ones stay until
they're done, so nothing actionable disappears (`getAdminOrders()`).
`RefreshAt` re-fetches the page the moment the next slot ends. The stat
cards still count the whole day (`getOrderCounts(startOfTodayIST())`).
Every order ever placed lives
at `/admin/history` instead, grouped by day (newest first), reusing the
same `OrderList` component in a `groupByDate` mode rather than a separate
one-off component. Every registered student is browsable (read-only, with
a client-side search box) at `/admin/users`, reached via a "Users" button
next to "Order history" (a third button, "Reviews", opens `/admin/reviews` —
see `order_reviews` under Database schema) — this replaced a "Banned users" button that used
to sit directly on the main dashboard. Banned Users management itself
still lives on its own page, `/admin/banned` (unchanged), but is now one
level deeper — reached via a "Banned users" button on `/admin/users`
instead of straight from the dashboard, and its back-link points to
`/admin/users` accordingly (`BackToDashboardLink` takes optional
`href`/`label` overrides for this).

**Offers** (`/admin/offers`, an "Offers" pill on the dashboard next to
"Sold out" with an "N on" chip while any is on; ported from College Bites,
15 Oct 2026; the switches are `OffersCard`,
`src/components/admin/offers-card.tsx`): three switches, any mix on —
**10% off**, **20% off** and **Buy 3 full biryanis, get 1 single free** —
saved straight to `app_settings.offer_pct10 | offer_pct20 | offer_biryani`
by `setOfferEnabled()` (`src/lib/admin/actions.ts`, admin-checked, RLS the
boundary). **10% / 20% apply at every restaurant** (by decision, 17 Oct
2026), each with a switch per restaurant listed under it on the Offers
page — all on by default; a switched-off one is a row in
`offer_restaurant_exclusions` (`setOfferRestaurant()`), so a new restaurant
joins automatically; its cart greys the offer out, "Not at this
restaurant". **The biryani offer is for one restaurant**,
`app_settings.offers_restaurant_id` — **Bheemasena Restaurant** (by
decision; changed only in the database). `offerAppliesTo()`
(`src/lib/offers.ts`) is the cart's copy of the rule. While any is on, the cart sheet
shows an **Apply discount** bar (`DiscountPicker`,
`src/components/cart/discount-picker.tsx`): the live offers as a radio
group, **one per order, never stacked**, each with what it saves; other
restaurants' carts list the biryani offer greyed out, "Only at Bheemasena
Restaurant" (`place_order()` raises `offer_wrong_restaurant` for that and
for 10% / 20% at a switched-off restaurant). 10% / 20% come off
the paid items, add-ons included (rounded to the rupee). **Full and single
biryanis are decided by menu section**, not by name (Bheemasena names them
"Chicken Fry Biryani" / "Single Fry Biryani"): full = a dish in **Veg
Biryani** or **Non-Veg Biryani**, single = a dish in **Single Biryani**
(`FULL_BIRYANI_SECTIONS` / `SINGLE_BIRYANI_SECTION` in `src/lib/offers.ts`
and the same names in `place_order()` — renaming one of those sections
breaks the offer until both are updated). One free single per 3 paid full
biryanis in the same order; the student picks which single(s); the cart's
item total adds the free single at its menu price and the same amount comes
off, so the student pays exactly the paid lines (never subtract the free
value from the paid lines alone — College Bites' 4 Oct bug). Too few fulls
→ "Add 2 more full biryanis to unlock". No per-student limit. `getOffers()`
(`src/lib/data/offers.ts`, request-cached) sends the cart the switches, the
switched-off restaurants (`excluded`), the biryani restaurant, its full biryani ids and its single biryanis — the cart never
guesses by name — and feeds Home, menus (via `MenuView` → `CartBar` →
`CartSheet`) and the dashboard. `placeOrder()` passes `offer` /
`freeItems`; an `offer_unavailable` / `offer_wrong_restaurant` refusal
drops the offer (`offerEnded`) and refreshes. Every order view shows the
offer line and free items ("Free" / "(free)"): the student's ticket, the
admin card and detail page, WhatsApp text (`offerLine()`), the copy text
(free items marked "(free)"), and the CSV export (Offer + Discount
columns). A free biryani is left out of "Your usual" (`usual.ts`) so a
re-order never adds it as paid.

**Sold out** (`/admin/sold-out`, a "Sold out" pill on the dashboard) lists
every dish on every menu — including the ones already off sale, since this
is the only way to put one back — grouped by restaurant and section, with
restaurant tabs, a search box and a "Sold out only" filter. Each row's
button flips `dishes.is_available` via `setDishAvailable()`
(`src/lib/admin/actions.ts`, admin-checked like every other admin action,
with RLS as the real boundary) and updates that row in place. A sold-out
dish still shows on the student menu — greyed, struck through and
unorderable (`DishCard`'s `soldOut`) — and `place_order()` refuses it
anyway, so the flag is never only a UI state.

Visually, admin shares the student app's system: the dashboard's plum
"Today" card (`StatCards`) carries today's counts with the campus ordering
control (`OrderingKillSwitch` — a two-way Open / Closed switch for
`app_settings.ordering_mode` with a confirm dialog each way and a status
line, "Open until you close it" / "Closed until you open it") as its footer row; secondary actions use the
shared `adminPill` style (`src/components/admin/styles.ts`); order cards
lead with the token and a dish photo; restaurant controls show cover
photos; no uppercase anywhere.

Order cards carry a "From <restaurant>" box: one line per dish as
"Dish name - qty" with its price — never "1× Dish" — then the note, then
the student's name and number. The WhatsApp button's message and the copy
button's text come from `src/lib/orders/admin-text.ts` (WhatsApp: full
name; restaurant, each dish and the question on their own lines; a total
line only for multi-dish orders. Copy: name, number,
restaurant, each dish — nothing else) — keep them in step with the card.
Tapping a card opens **`/admin/orders/[id]`** (`getAdminOrderDetail()` +
`OrderDetailView`): timing (placed, delivery window, delivered at),
student (phone, reg. number, email, Call / WhatsApp / Copy), each dish
with unit price, subtotal and the student's stars if rated, total, note,
review note, and the same Confirm / Mark delivered / Cancel actions
(`OrderActions`, shared with the card). The card is clickable via a
stretched link on the token (`after:inset-0`); its buttons sit above it
with `relative z-10` — keep new controls on the card above it too.

Setting ordering to **Closed** also turns every restaurant off
(`setOrderingMode`); reopening leaves them off. Tapping "Turn on" on a
restaurant while Closed asks "Open ordering now?" — yes sets Open and
turns that restaurant on.

"Mark all delivered" counts eligible orders over **every** confirmed order
(`getConfirmedOrderTimes()`), not just today's list — the same set
`markAllConfirmedDelivered()` acts on — and says why when it's disabled
("Next slot ends 1:30 PM"). Base UI gotcha: put `disabled` on the
`AlertDialogTrigger`/`DialogTrigger` itself, never on the element passed
to its `render` prop — the trigger merges its own `disabled: false` last and
silently re-enables the button.

## Project structure

- `docs/MUTEBITES-BLUEPRINT.md` — the whole project history (every
  session, commit and migration), setup steps outside the code, lessons
  learned, and a porting checklist for rebuilding at another university.
  Update it alongside this file when something significant changes.
- `docs/CLIENT-GUIDE.md` — the plain-English guide for the MuteBites team
  (getting into admin, installing MuteBites Admin, Open / Closed, alerts,
  handling an order, delivery slots, sold out, bans, rewards, support
  details). It quotes the admin's button labels — keep it in step when an
  admin flow or label changes. It names no admin email addresses (the repo
  is public).
- `src/app` — routes (App Router)
- `src/app/robots.ts` — generates `/robots.txt` (everything but `/admin`
  crawlable). Excluded from the `src/proxy.ts` matcher like `favicon.ico`,
  otherwise the sign-in guard 307s crawlers to `/login` and Lighthouse
  marks robots.txt invalid.
- **SEO** (search basics only — signed-out visitors, and so search
  engines, can only load `/login`, `/privacy` and `/terms`; menus are not
  public, by decision): `src/lib/site.ts` holds the site address
  (`NEXT_PUBLIC_SITE_URL` overrides it — set that if a custom domain is
  added), name, search title and description. The root layout sets
  `metadataBase`, description, keywords, Open Graph / Twitter tags and
  Google Search Console verification (`GOOGLE_SITE_VERIFICATION` env var,
  nothing emitted while unset). `src/app/opengraph-image.tsx` renders the
  link-preview card (mark, name, tagline, four dish photos — literal
  paths, update them if a photo is renamed) with `ImageResponse`, then
  re-encodes it as a ~116 KB JPEG with `sharp` (a declared dependency) —
  WhatsApp drops previews as big as the PNG was. `/login` carries the full
  search title, a canonical URL and Organization/WebSite JSON-LD.
  `src/app/sitemap.ts` lists the three public pages; `robots.ts` points
  to it and disallows `/admin`, `/auth`, `/orders`, `/profile`,
  `/welcome`, which (plus the admin layout) are also `noindex`.
  `sitemap.xml` and `opengraph-image` are excluded from the
  `src/proxy.ts` matcher so bots aren't redirected to `/login`.
- Every page has exactly one `<h1>` (order tracking's is `sr-only`; the
  admin header's "Admin" is an h1 only on the dashboard itself, since
  sub-pages carry their own). Keep it that way when adding pages.
- `src/app/privacy`, `src/app/terms` — static, unauthenticated pages
  required for the Google OAuth consent-screen review. Listed in
  `PUBLIC_PATHS` (`src/lib/supabase/middleware.ts`) alongside `/login` and
  `/auth` so `src/proxy.ts` doesn't bounce a signed-out visitor — or
  Google's review bot — to `/login` before they can load them.
- `src/app/(home)/page.tsx` — the `/` route. It lives in a `(home)` route
  group (the parens don't affect the URL) specifically so its
  `loading.tsx` stays scoped to just `/`. A `loading.tsx` placed directly
  in `src/app` would become the fallback for *every* route that doesn't
  have its own — including `/login`, `/admin`, etc. — since the app root
  is an ancestor of all of them. Don't move `page.tsx` back out to
  `src/app` without either dropping its `loading.tsx` or being fine with
  that.
- `src/components/ui` — shadcn/ui components. Two modal-style primitives:
  `alert-dialog.tsx` (confirmations — "Cancel this order?", "Pause
  ordering campus-wide?", "Mark 3 orders delivered?") and `dialog.tsx`
  (plain popups with no confirm/cancel semantics — the "About MuteBites"
  card from the Home logo — the logo sits on a frosted plate with a thin
  ring, and `.logo-hint` ripples a rose
  outline twice after load so it reads as tappable; the card opens on a
  strip of the lit hero (`KaapiMotif` under Kaapi) with the logo tile
  rising out of it, and its close button takes `text-hero-foreground` —
  (footer: `AboutCredits` — "Owned by Harsha & Rishi",
  "~ Developed & Maintained by Naga Adithya"; the name has a dotted
  underline and tapping it quietly folds open Call · WhatsApp · Mail) and the one-time "How was
  it?" rating prompt). The cart and rating sheets use `sheet.tsx`. Both wrap `@base-ui/react`; reach for whichever already matches
  what you're building rather than hand-rolling a third.
- `src/lib/supabase/client.ts` — browser Supabase client
- `src/lib/supabase/server.ts` — server Supabase client (Server Components/Actions)
- `src/lib/supabase/middleware.ts` — session-refresh helper used by
  `src/proxy.ts` — this Next.js version renamed `middleware.ts`/
  `middleware()` to `proxy.ts`/`proxy()`; same route-matcher config,
  different filename and export name.
- `supabase/migrations/` — hand-written SQL migrations (see rule below)
- `public/MuteBites/` — restaurant/dish photos, one subfolder per restaurant
  (plus `covers/` for the hero banners) — matched to database rows by name
  in `src/lib/data/dish-photos.ts`, deliberately **not** a database column
  (no schema change needed to add or swap a photo). `getRestaurantCoverPhoto()`
  and `getDishPhoto()` look up by exact restaurant/dish name; anything
  without a confident match — a dish with no distinct photo, a restaurant
  with no cover yet — falls back to the existing flat placeholder
  (`bg-stripes`) rather than showing a mismatched image. Cover photo
  filenames carry a `-v2`-style suffix when replaced after the first
  publish — an intermediate cache (outside this app, never fully
  identified) kept re-serving an old file by its original URL even after
  verified-fresh server responses and full dev-server restarts, so a
  changed cover photo should get a new filename, not overwrite the old one
  in place, to guarantee cache-safety.
  `/terms` ends with a short **Photo credits** note: where a restaurant
  had no photos, some covers and a few dishes (most of Waffle Pops') are
  free Unsplash / Pexels stock — neither licence needs credit and the
  photographers weren't recorded, so it names the sources only. A photo
  under a licence that does need credit (CC BY etc.) must be named there.
  The login screen's photo mosaic (`src/app/login/page.tsx`, `MOSAIC`)
  also references a dozen of these files by path directly — renaming or
  removing a photo means updating that list too, or its tile goes blank.
  Since the redesign (15 Oct 2026) a solid `bg-card` sheet rises over the
  mosaic with the logo tile on its top edge, the headline, two blush chips
  (free delivery to Main Gate, pay on delivery — cash or UPI) and Google's
  own white "Continue with Google" button (fixed `#747775` outline and
  `#1F1F1F` text in both themes, `variant="ghost"` — the default variant's
  amber gradient is a background-image `bg-white` can't override). The h1
  only settles (`animate-settle`, a 10 px rise) — never fades in from
  opacity 0, which would hide it from Largest Contentful Paint. `/welcome`
  leads with the lit plum hero as one header card.
  Home's restaurant cards slide through photos (`RestaurantPhotoSlides`,
  `src/components/home/restaurant-photo-slides.tsx`): the cover first,
  then up to five available dishes with a "veg mark · name · price" chip
  (`getRestaurantCardSlides()`, same file as above) — most ordered
  first (campus-wide, last 30 days: `getDishOrderCounts()` in
  `src/lib/data/trending.ts`, the same aggregate-only `trending_dishes()`
  RPC with a high limit), ties broken by `SIGNATURE_DISHES` then menu
  order; one slide per distinct photo, dishes without a photo skipped. The
  cover holds 2.5 s (+0.7 s per card down the list), each dish 3.2 s —
  hold time only counts while the card is on screen and the tab visible;
  pauses 8 s after a touch. Tapping a dish slide opens
  `/restaurants/<id>?dish=<dishId>` (the dish deep link), the cover opens
  the plain menu; no autoplay under
  reduced motion or for a closed restaurant; swiping is native
  scroll-snap. Dish photos mount one slide ahead, only once the card has
  been seen. The card's "24 dishes · from ₹60" line comes from
  `getRestaurantMenuStats()` (`src/lib/data/restaurants.ts`).
- **Logo** — two sources in `public/`: `mutebites-logo-v2-2.png`
  (transparent; everything is generated from it) and
  `mutebites-logo-v2-1.png` (same art on its own background, reference
  only). `node scripts/build-brand-assets.mjs` regenerates everything
  below from v2-2 — rerun it (and re-measure its hand-set layer regions)
  whenever the logo changes:
  - `public/brand/mark.webp` / `mark.png` — the mascot group only (no
    wordmark/tagline: unreadable at icon sizes). `BrandLogo`
    (`src/components/brand-logo.tsx`) shows `mark.webp` on a fixed ivory
    `#f5eae1` tile in every theme — the plum mascot vanishes on dark
    cards and the ink surface, so callers size/round it but never set
    its background.
  - **Two install profiles** (`src/lib/web-manifest.ts`, served by route
    handlers `app/manifest.webmanifest` and `app/admin.webmanifest` — not
    an `app/manifest.ts` file, since file-based metadata outranks a
    layout's `manifest` field): the root layout links the student app
    (opens `/`), the admin layout links **MuteBites Admin** (`id`/`scope`/
    `start_url` `/admin`, icons `icons/admin-*` = the mark with an "Admin"
    pill via `appIconResponse({ label })`). The admin header's **Install**
    button (`install-admin-button.tsx`) fires the browser's install prompt
    (`beforeinstallprompt`, caught at module load) or, on iPhone / when no
    prompt is available, shows add-to-home-screen steps; it hides inside
    the installed app. `admin.webmanifest` skips the proxy like the rest.
  - App icons: `src/lib/app-icon.tsx` centres `mark.png` on ivory for
    `apple-icon.tsx` and `icons/icon-192|512|512-maskable` (maskable at
    `markScale: 0.6` to stay inside the ~80% safe circle). The manifest's
    `background_color` is the same ivory, so Android's launch screen
    hands straight over to the splash.
  - `src/app/favicon.ico` — the mark on an ivory rounded square, 16/32/
    48/64 RGBA PNG frames (Next can't generate `favicon` from code, and
    its ico decoder rejects non-RGBA frames), written by the same script.
  - `public/brand/splash/*.webp` + `src/components/splash/layers.ts` —
    the startup splash layers (body, legs, arm+tray, cloche lid, steam,
    speed trails, ground swoosh, wordmark, tagline, plus the two shoes on
    their own) and their boxes in source-art pixels. At rest they
    re-assemble the logo exactly; where a cut runs through solid paint the
    lower layer keeps a few extra pixels (`UNDERLAPS`) so no hairline seam
    shows.
- **Startup splash** (`src/components/splash/`), ~2.5 s, once per browser
  session (sessionStorage `mutebites.splash-shown` — every fresh app/PWA
  open, never on route changes or reloads), never on `/admin`, `/auth`,
  `/privacy`, `/terms` or a tab opened in the background:
  - Storyboard (timings in `config.ts`): ivory → the mascot **runs** in
    from the left — the legs are a jointed rig (`rig.ts`: hip/knee/ankle
    measured on the source art, vector tubes + the real shoes) cycling
    through `STRIDE`, 3 strides that slow as it arrives, with body bob,
    forward lean, stretched trails, the arm/tray and lid bouncing a beat
    behind and steam streaming back → feet plant, squash, rebound (the rig
    ends in exactly the drawn pose and hands over to the drawn legs) →
    swoosh draws, lid lifts with a warm glow, steam rises → wordmark, then
    tagline → hold → the ivory screen **closes down into the page's own
    logo tile** while the mascot shrinks onto its mark (clip-path +
    transform, measured live), so the splash becomes the app's logo instead
    of fading. The landing spot is whichever `BrandLogo` has
    `splashTarget` (login page, Home header); while a `loading.tsx`
    skeleton (`aria-busy`) is up it waits up to 1.2 s for it, and pages
    without one get a short fade.
  - `app-splash.tsx` is plain server markup (first in `<body>`, styles in
    `splash.css`), positioned in source-art pixels via `--u` (a container
    query unit), so it lines up at any screen size. `engine.ts` is all the
    motion — Web Animations on transform/opacity of HTML elements (legs
    included), so it stays smooth while the app hydrates underneath. It's
    one self-contained function that `init-script.ts` serialises
    (`runSplash.toString()`) into a raw inline `<script>` in the root
    layout — **not** `next/script` `beforeInteractive`, which is queued
    until Next's JS loads and would let the app paint first (the
    theme-init script, `src/lib/theme/init-script.ts`, is inline for the
    same reason — no light flash for dark users). Keep `engine.ts` free of
    imports and module-scope helpers.
  - Reduced motion: no run — the finished logo fades in, holds ~0.65 s,
    fades out. Safety valves: tap skips (to the finished logo, then the
    close), slow/failed images (> 2.5 s) just fade out, and CSS hides the
    overlay after 9 s whatever happens.
  - Replay / disable: `?intro` (or `?splash`) forces it, `?nosplash`
    skips one load, localStorage `mutebites.splash = "off"` disables it on
    one device, `NEXT_PUBLIC_DISABLE_SPLASH=1` removes it from the build.
  - One-off moments that could fire underneath wait with `afterSplash()`
    (`splash/after-splash.ts`) — the milestone celebration does.

`loading.tsx` exists for the restaurant list (`(home)`), the menu page
(`restaurants/[id]`), both order pages (`orders`, `orders/[id]`), and
`profile` — plain skeletons built from `src/components/ui/skeleton.tsx`,
roughly mirroring each page's real layout so nothing visibly jumps.

## Database schema

Defined in [`supabase/migrations/20260915000000_init_schema.sql`](supabase/migrations/20260915000000_init_schema.sql),
[`supabase/migrations/20260915010000_add_user_role.sql`](supabase/migrations/20260915010000_add_user_role.sql),
[`supabase/migrations/20260915020000_google_oauth_and_ban.sql`](supabase/migrations/20260915020000_google_oauth_and_ban.sql),
[`supabase/migrations/20260915030000_ban_by_phone.sql`](supabase/migrations/20260915030000_ban_by_phone.sql),
[`supabase/migrations/20260915040000_drop_block_and_room.sql`](supabase/migrations/20260915040000_drop_block_and_room.sql),
[`supabase/migrations/20260915050000_place_order_function.sql`](supabase/migrations/20260915050000_place_order_function.sql),
[`supabase/migrations/20260915060000_seed_restaurants.sql`](supabase/migrations/20260915060000_seed_restaurants.sql)
(data only — the 3 real partner restaurants and their menus),
[`supabase/migrations/20260915070000_guard_phone_changes.sql`](supabase/migrations/20260915070000_guard_phone_changes.sql),
[`supabase/migrations/20260915080000_admin_dashboard.sql`](supabase/migrations/20260915080000_admin_dashboard.sql),
[`supabase/migrations/20260915090000_fix_users_role_column_rename.sql`](supabase/migrations/20260915090000_fix_users_role_column_rename.sql)
(fixes a live drift — the `role` column got renamed to `student` by
accident via the Table Editor UI, not through any migration — back to
match every migration and the app code),
[`supabase/migrations/20260915100000_admin_users_and_ban.sql`](supabase/migrations/20260915100000_admin_users_and_ban.sql),
[`supabase/migrations/20260915110000_reapply_place_order_ordering_check.sql`](supabase/migrations/20260915110000_reapply_place_order_ordering_check.sql)
(re-applies `place_order()` unchanged — the `ordering_enabled` check from
`080000` likely never actually went live, probably split off into its own
SQL editor tab and skipped when that migration was applied by hand),
[`supabase/migrations/20260915120000_banned_at.sql`](supabase/migrations/20260915120000_banned_at.sql),
[`supabase/migrations/20260915130000_enable_realtime_orders.sql`](supabase/migrations/20260915130000_enable_realtime_orders.sql)
(adds `orders` to the `supabase_realtime` publication —
`src/components/orders/order-tracking.tsx`, a client component, subscribes
to its own order's row for live status updates on top of the normal
server-fetched page; existing RLS still governs who can actually receive
them, and a plain page refresh still shows the true status either way),
[`supabase/migrations/20260915140000_seed_new_restaurants.sql`](supabase/migrations/20260915140000_seed_new_restaurants.sql)
(data only — two more partner restaurants, **MuteBites Chinese** (since
renamed Food Corner; 5 categories, 24 dishes) and **MuteBites Fresh Fruits** (1 category, 13
dishes, priced per 500 g/1 kg pack), bringing the total to 5 restaurants),
[`supabase/migrations/20260915150000_daily_order_numbers.sql`](supabase/migrations/20260915150000_daily_order_numbers.sql)
(adds `orders.daily_number` — see below),
[`supabase/migrations/20260916000000_trending_leaderboard.sql`](supabase/migrations/20260916000000_trending_leaderboard.sql)
(adds `trending_dishes()` / `trending_restaurants()` — see below),
[`supabase/migrations/20260917000000_my_weekly_rank.sql`](supabase/migrations/20260917000000_my_weekly_rank.sql)
(adds `my_weekly_rank()` — see below),
[`supabase/migrations/20260917010000_drop_unused_trending_restaurants.sql`](supabase/migrations/20260917010000_drop_unused_trending_restaurants.sql)
(drops `trending_restaurants()` again — never called by the app),
[`supabase/migrations/20260917020000_highly_reordered_dishes.sql`](supabase/migrations/20260917020000_highly_reordered_dishes.sql)
(adds `highly_reordered_dishes()` — see below),
[`supabase/migrations/20260919000000_ordering_schedule.sql`](supabase/migrations/20260919000000_ordering_schedule.sql)
(the daily ordering schedule + three-way admin override — see
`app_settings` below),
[`supabase/migrations/20260919010000_drop_ordering_enabled.sql`](supabase/migrations/20260919010000_drop_ordering_enabled.sql)
(drops the old `ordering_enabled` switch it replaced),
[`supabase/migrations/20260919020000_order_reviews.sql`](supabase/migrations/20260919020000_order_reviews.sql)
(dish ratings — `orders.delivered_at`, `order_reviews`, `order_item_ratings`,
`submit_review()`; see below),
[`supabase/migrations/20260919030000_remove_bismillah_catch_all_juices.sql`](supabase/migrations/20260919030000_remove_bismillah_catch_all_juices.sql)
(data only — deletes Bismillah's "Any Fruit Juice Bottle" and "Bismillah
Fruit Juice (Any Flavour)"; its menu is now the 10 named fruit juices plus
the two Sugarcane items),
[`supabase/migrations/20260919040000_fix_banana_pack_and_bismillah_tags.sql`](supabase/migrations/20260919040000_fix_banana_pack_and_bismillah_tags.sql)
(data only — renames "Bananas (30 g)" to "Bananas (500 g)" and drops
Bismillah's stale "Special" cuisine tag),
[`supabase/migrations/20260920000000_rename_chinese_to_food_corner.sql`](supabase/migrations/20260920000000_rename_chinese_to_food_corner.sql)
(data only — "MuteBites Chinese" is now **Food Corner**, with "Chinese"
added to its cuisine tags so search still finds it; its photo folder
`public/MuteBites/MuteBites Chinese/` keeps the old name on purpose),
[`supabase/migrations/20260920010000_bheemasena_single_mushroom_price.sql`](supabase/migrations/20260920010000_bheemasena_single_mushroom_price.sql)
(data only — Single Mushroom Biryani ₹220 → ₹200),
[`supabase/migrations/20260920020000_mixed_biryani_note.sql`](supabase/migrations/20260920020000_mixed_biryani_note.sql)
(data only — every mixed biryani's `note` reads "Comes with both dum & fry
pieces"; a mixed biryani added later needs it set again),
[`supabase/migrations/20260920030000_bheemasena_mutton_prawn_biryani.sql`](supabase/migrations/20260920030000_bheemasena_mutton_prawn_biryani.sql)
(data only — adds Mutton Afghani Biryani and Prawn Biryani, ₹400 each, to
Bheemasena's Non-Veg Biryani section),
[`supabase/migrations/20260920040000_bheemasena_new_dishes.sql`](supabase/migrations/20260920040000_bheemasena_new_dishes.sql)
(data only — 16 more Bheemasena dishes across Non-Veg Biryani, Non-Veg
Starters, Veg Curries and Non-Veg Curries; the restaurant now has 59
dishes). Note the shape: the `values` list comes first and the
restaurant/category are joined onto it — a `cross join` after the join
can't see `v`.
And [`supabase/migrations/20260921000000_push_subscriptions.sql`](supabase/migrations/20260921000000_push_subscriptions.sql)
adds **`push_subscriptions`** — one row per device that turned
notifications on (`user_id`, unique `endpoint`, `p256dh`, `auth`,
`user_agent`). RLS: a student reads/writes only their own rows; admins
`select` every row (that's how a status change reaches the student's
phone) and `delete` stale ones. The *new order* send can't use any
student's session, so it goes through the service-role client — see
**Notifications** above.
[`supabase/migrations/20260921010000_milestone_rewards.sql`](supabase/migrations/20260921010000_milestone_rewards.sql)
adds **`milestone_rewards`** — one row per student whose all-milestones
free biryani was handed over (`user_id` primary key = once per student,
`claimed_at`, `marked_by` admin). RLS: a student selects only their own
row; admins select all, insert (with `marked_by = auth.uid()`) and delete
(undo). No update policy. Whether a student *qualifies* is checked in the
app (`getUnlockedMilestones()`), not the database — see **Profile** above.
[`supabase/migrations/20261015010000_favorite_dishes.sql`](supabase/migrations/20261015010000_favorite_dishes.sql)
(applied 15 Oct 2026 through the Supabase connector — the live code
doesn't use it until the redesign is pushed) adds **`favorite_dishes`** —
the dishes a student hearted: `user_id` → `users` and `dish_id` →
`dishes` (both cascade), `created_at`, primary key `(user_id, dish_id)` —
one heart per dish per student. Indexes on `(user_id, created_at desc)`
(Profile's list) and `dish_id`. RLS (`(select auth.uid())` form): a
student selects, inserts and deletes only their own rows; no update
policy, no admin access, and no counts shown to anyone — hearts are
private. Read by `getLikedDishes()` (`src/lib/data/favorites.ts`,
request-cached; errors read as "no hearts").
[`supabase/migrations/20261015020000_taste_profiles.sql`](supabase/migrations/20261015020000_taste_profiles.sql)
(applied 15 Oct 2026 through the connector, ahead of the redesign's push)
adds **`taste_profiles`** — one row per student, created the first time
they save the "Your taste" sheet: `user_id` (primary key → `users`,
cascade), `avatar` (nullable text, `^[a-z0-9-]{1,32}$` — null = show their
initials; the app holds the list), `spice_level` (1–5, null = not
answered), `diet` (`'veg' | 'egg' | 'nonveg'`, null = not answered),
`cravings` (text array, only `FOOD_TYPES` keys — biryani, fried-rice,
noodles, starters, curries, chicken, paneer, egg, juices, fruits,
desserts; adding a food type to Home needs this check widened in a
migration), `updated_at` (`set_updated_at` trigger). No row = the
defaults. RLS (`(select auth.uid())` form): a student selects, inserts
and updates only their own row; no delete policy, no admin access —
nobody else ever sees it.
[`supabase/migrations/20261015030000_discount_offers.sql`](supabase/migrations/20261015030000_discount_offers.sql)
(named `discount_offers` in the database's migration history; applied 15
Oct 2026 through the connector — `place_order()` stays callable with the
old four arguments, so the live code kept working) adds the **discount
offers**: `app_settings.offer_pct10 / offer_pct20 / offer_biryani`
(booleans, default off) and `offers_restaurant_id` (→ `restaurants`, on
delete set null; set to Bheemasena by name); `orders.discount_offer`
(`'pct10' | 'pct20' | 'biryani'` or null) and `orders.discount_amount`
(≥ 0); `order_items.is_free`; and `place_order()` with two optional
arguments, `p_offer` and `p_free_items` — see **Offers** under Admin
access. `total_amount` is what the student pays: `sum(order_items.subtotal)
- discount_amount`. A free single biryani is its own `order_items` row with
`is_free = true` at its real menu price (history stays truthful); its value
is the order's `discount_amount`.
[`supabase/migrations/20261017000000_offers_all_restaurants.sql`](supabase/migrations/20261017000000_offers_all_restaurants.sql)
(applied 17 Oct 2026 through the connector) adds
**`offer_restaurant_exclusions`** — the restaurants an admin switched off
for 10% / 20%: `offer` (`'pct10' | 'pct20'`), `restaurant_id` (→
`restaurants`, cascade), `created_at`, primary key `(offer,
restaurant_id)`. RLS: public-read (the cart needs it); admins insert and
delete (`is_admin()`); no update. It also re-creates `place_order()` (same
signature) with one change: `offer_wrong_restaurant` for `'biryani'` away
from `offers_restaurant_id`, and for `'pct10'` / `'pct20'` at an excluded
restaurant.
[`supabase/migrations/20260922010000_seed_sugarcane_juice.sql`](supabase/migrations/20260922010000_seed_sugarcane_juice.sql)
(data only — a sixth restaurant, **MuteBites Sugarcane Juice**: one
section, one dish, "1 Litre Sugarcane Juice Bottle" ₹90, photos in
`public/MuteBites/MuteBites Sugarcane Juice/` and
`covers/mutebites-sugarcane-juice.jpg`).
[`supabase/migrations/20261006000000_seed_ramana_fast_food.sql`](supabase/migrations/20261006000000_seed_ramana_fast_food.sql)
(data only — a seventh restaurant, **Ramana Fast Food**: Fried Rice (7)
and Noodles (9), ₹90–130; "Dubble" on its menu written "Double". It has no
photos of its own and borrows Food Corner's dish photos and cover in
`dish-photos.ts`, since every dish name matches exactly).
[`supabase/migrations/20261008000000_seed_waffle_pops.sql`](supabase/migrations/20261008000000_seed_waffle_pops.sql)
(data only — an eighth restaurant, **Waffle Pops**: 65 dishes in 8
sections — Waffle Pops, Classic Waffles, Red Velvet Love, KitKat Club,
Chocolate Love, Mini Pancakes, Brownies, Hot Chocolate — every price the
printed menu + ₹10 by the client's instruction; pops/pancakes carry "Pop" /
"Mini Pancakes" in their names so flavours don't collide; the menu's paid
add-ons are now real add-ons, see `addons`. Only 12 dishes and the cover have
photos — free-licence Unsplash stock in `public/MuteBites/Waffle Pops/`
and `covers/waffle-pops.jpg`; the rest show the placeholder on purpose).
**Add-ons (extras):** [`20261008010000_addons_schema.sql`](supabase/migrations/20261008010000_addons_schema.sql)
(tables), [`20261008020000_addons_rls_and_data.sql`](supabase/migrations/20261008020000_addons_rls_and_data.sql)
(access rules + Waffle Pops' four extras) and
[`20261008030000_place_order_addons.sql`](supabase/migrations/20261008030000_place_order_addons.sql)
(`place_order()` with add-ons). **`addons`** — per restaurant (`name`,
`price`, `is_available`, `sort_order`); **`category_addons`** — which menu
sections offer which extras (Waffle Pops: every section but Hot
Chocolate, printed prices: Choco chip ₹10, Ice cream ₹30, Chopped
chocolates ₹10, Oreo ₹10); both public-read, admin-write.
**`order_item_addons`** — the extras chosen on each order line,
snapshotted (`addon_name`, `price`) like dish name/price; readable by the
order's student and admins, written only by `place_order()`.
`order_items.addons_price` holds a line's extras total and the generated
`subtotal` is `(unit_price + addons_price) * quantity`. `place_order()`
takes `addon_ids` per line, checks each is this restaurant's, available
and offered on the dish's section (`addon_unavailable` otherwise), prices
them from the database, and allows the same dish twice only with
different extras. App side: `getRestaurantMenu()` puts each section's
`addons` on `MenuSection`; a dish in such a section opens `AddonSheet`
(`src/components/menu/addon-sheet.tsx` — tick extras, quantity, one Add
with the live total) instead of one-tap add, and its card shows a count
badge rather than a stepper. Cart lines carry `addons`; `lineKey()` (dish
id + sorted extra ids) identifies a line and `linePrice()` adds extras.
Order displays read `order_item_addons(addon_name)` — the ticket lists
"+ Ice cream" under the dish, and admin `itemLine()` writes
"Nutella Pop + Ice cream - 1" (card, WhatsApp, copy, CSV). "Your usual"
skips orders that had extras.
Migrations are applied by hand in the Supabase SQL editor (no CLI setup).

All orders are handed over at **VIT-AP Main Gate** — there is no room
delivery, so no hostel block/room is stored anywhere (not on `users`, not
on `orders`).

- **`users`** — student profile, 1:1 with `auth.users` (same `id`, cascades
  on delete). `full_name` and `phone` are both `not null`; `phone` is
  **not unique** — multiple Google accounts can share a phone number
  (`email` stays `not null unique`, one row per Google account, just not
  one per phone). No domain restriction on `email` — decided: any Google
  account can sign up, not only VIT-AP student addresses. Stored
  as `+91XXXXXXXXXX` — the app normalizes every
  input to that one shape (`src/lib/phone.ts`), since bans match by exact
  phone. Also `registration_number`, `role` (`user_role` enum: `student` |
  `admin`, default `student`), `is_banned` (default `false` — an admin
  flips this from the admin `/admin/banned` page, e.g. for
  repeat no-shows; `role` itself is still only ever changed by hand in the
  database, never through the app), `banned_at` (nullable timestamptz, kept
  correct by the `set_banned_at` trigger — set to `now()` whenever
  `is_banned` flips true, cleared back to `null` when it flips false again,
  regardless of whether the change came through the app or the SQL editor).
  No `public.users` row is auto-created on
  OAuth sign-in — the app creates it itself, once, when the first-login
  form (full name + phone) is submitted; that's also how the app tells
  first-time vs. returning users apart (row exists or not).
- **`restaurants`** — `name`, `phone`, `description`, `cuisine_tags` (text
  array), `is_active`.
- **`dish_categories`** — menu sections scoped to a restaurant (e.g. "VEG
  STARTERS", "NON-VEG BIRYANI"), with `sort_order` for display.
- **`dishes`** — belongs to a restaurant and (optionally) a category;
  `price`, `is_veg`, `note` (freeform, e.g. "Thursday Only"), `is_available`.
- **`orders`** — `user_id`, `restaurant_id`, `status` (`order_status` enum:
  `pending → confirmed → preparing → out_for_delivery → delivered`, or
  `cancelled`), `contact_phone`, `notes`, `total_amount`. No payment fields — COD only.
  The admin dashboard only ever drives two of those transitions directly —
  `pending → confirmed` and `confirmed → delivered` (`preparing` /
  `out_for_delivery` stay valid enum values but nothing in the app sets
  them; delivery timing runs on fixed ETA slots, not admin clicks) — plus
  a side-path to `cancelled` from any non-terminal status (the order card
  only offers **Cancel order** while it's `pending` — once confirmed with
  the restaurant, the way forward is Mark delivered), each one
  compare-and-swapped on the status the admin's screen showed, so a stale
  screen or two admins clicking at once can't skip a step or act on a
  status that's already changed. Also `daily_number` (`not null int`) —
  the order's position that IST calendar day, campus-wide across every
  restaurant, starting over at 1 each day — this is the "token"/order
  number shown to both the student (pickup) and the admin (order list),
  so the two must always agree. Assigned once, atomically, by the
  `set_daily_order_number` trigger (`before insert on orders`) via the
  `daily_order_counters` table below — never derived by counting/ranking
  on read, so concurrent orders in the same second can't collide or show
  differently to student vs. admin. `orderReference()` (the old
  hash-of-uuid cosmetic token, e.g. "#4F2A") is gone; every display now
  reads `daily_number` directly.
- **`orders.delivered_at`** (nullable timestamptz) — set to `now()` by the
  `set_delivered_at` trigger whenever `status` becomes `delivered`
  (single or bulk "Mark delivered"); backfilled from `updated_at` for
  orders delivered before it existed. The 7-day review window counts from
  it.
- **`order_reviews`** — one row per order (`order_id` primary key),
  `user_id`, optional `note` (≤ 300 chars), `created_at`. **`order_item_ratings`**
  — one row per dish in that order (`order_item_id` primary key, `order_id`,
  `dish_id` set null if the dish is ever deleted, `rating` 1–5). Stars per
  dish, one note per order, **no photos** (decided against: storage and
  cleanup cost). RLS: a student reads only their own review/ratings,
  admins read all; no insert/update/delete policies — the only write path
  is `public.submit_review(order_id, ratings jsonb, note)` (security
  definer, authenticated only), which checks the caller owns the order,
  it's `delivered`, `delivered_at` is within 7 days, it isn't already
  reviewed (submit once, no edits), and there's exactly one 1–5 rating
  for every item in the order. Error keys: `order_not_found`,
  `not_delivered`, `review_window_closed`, `already_reviewed`,
  `note_too_long`, `invalid_ratings`. Reviews are **never shown to other
  students** — admin-only feedback.
  UI: `RateOrder` (`src/components/orders/rate-order.tsx`) on the order
  tracking page — shows the moment status turns `delivered` (Realtime also
  carries `delivered_at`), opens a bottom sheet with 1–5 stars per dish
  (all required) and the optional note, submits via `submitReview()`
  (`src/lib/reviews/actions.ts`, maps the error keys), then shows "You
  rated this". `getOrder()` returns `items[].id`, `deliveredAt` and the
  student's own `review`. Nudges: the Orders list shows an amber "Rate your
  order" pill on rateable orders (`OrderSummary.rateable` — delivered,
  within 7 days, not rated), and Home shows a one-time pop-up
  (`RatePrompt`, `getRatePromptOrder()`) for the latest one, remembered
  per device in `localStorage` (`mutebites.rate-prompted`). Both link to
  `/orders/<id>?rate=1`, which opens the rating sheet on arrival.
  `REVIEW_WINDOW_MS` lives in `src/lib/reviews/limits.ts` (client-safe).
  Admin reads them at `/admin/reviews` (a "Reviews" pill on the dashboard):
  `getAdminReviews()` (`src/lib/data/admin.ts`) + `ReviewsView` — dish
  averages (lowest first) and review cards, filtered by restaurant and by
  "Needs attention" (any dish ≤ 2★) / "With notes".
- **`daily_order_counters`** — `order_day` (date, primary key), `last_number`.
  One row per day, upserted by the trigger above (`on conflict (order_day)
  do update set last_number = last_number + 1 returning ... into
  new.daily_number`) — the atomic counter that makes `daily_number`
  race-free. The app never reads or writes this table directly; RLS is
  enabled with no policies (locks it out entirely), and the trigger's
  writes succeed anyway since they run inside `place_order()`'s
  security-definer context, the same way `place_order()` itself writes to
  `orders`/`order_items` without student-facing insert policies.
- **`order_items`** — snapshots `dish_name` and `unit_price` at order time
  (quantity, generated `subtotal`), so later menu edits never rewrite past
  order history. `dish_id` is `on delete set null` for the same reason.
- **`app_settings`** — single-row table (`id boolean primary key default
  true check (id)` caps it at one row) holding `ordering_mode`
  — the campus-wide **Open / Closed** switch the admin dashboard's Today
  card sets (since 14 Oct 2026 — no daily schedule in the app).
  Public-read (the student app needs to know whether it can order),
  admin-only update. `'open' | 'closed'` only (default `'open'`) since
  [`20261015000000_ordering_open_closed_only.sql`](supabase/migrations/20261015000000_ordering_open_closed_only.sql)
  (applied 15 Oct 2026, ahead of the redesign's deploy — the old live
  admin's "Auto" button is refused until the redesign is pushed), which
  also dropped `public.ordering_schedule_open()`. `toOrderingMode()`
  (`src/lib/ordering.ts`) still maps anything unexpected to Open / Closed
  by what `ordering_is_open()` says — a harmless safety net.
  `public.ordering_is_open()` (security definer, callable by anon +
  authenticated) is the single source of truth — `place_order()` checks
  it, and the app reads it via `getOrderingState()`
  (`src/lib/data/settings.ts`), with the wording ("Ordering is closed
  right now") from `describeOrdering()`. Delivery promises keep the old
  slot cut-offs: `deliveryWindow()` / `slotEndTime()` (`src/lib/date.ts`) —
  before 12:45 PM → by 1:30 PM, before 6:00 PM → by 7:30 PM, before 7:00
  PM → by 8:15 PM; an order placed after 7:00 PM gets "Delivery time to be
  confirmed" and counts as past its slot immediately. The old `ordering_enabled` boolean
  it replaced was dropped in
  [`20260919010000_drop_ordering_enabled.sql`](supabase/migrations/20260919010000_drop_ordering_enabled.sql).

RLS is enabled on every table:
- `restaurants` / `dish_categories` / `dishes` are public-read (browsing the
  menu doesn't require login). Writes (insert/update/delete) are allowed
  for `role = 'admin'` users (via the `public.is_admin()` helper), gating
  menu/availability management.
- `users` / `orders` / `order_items` are scoped to `auth.uid()` — a student
  can only read their own profile, orders, and order items (and
  insert/update their own profile). Students **cannot insert into `orders`
  or `order_items` directly** — there are no insert policies for them.
  The only way to create an order is the `public.place_order(restaurant_id,
  items jsonb, contact_phone, notes)` function (security definer, callable
  by `authenticated` only): one transaction that checks auth, profile, ban,
  contact phone format, restaurant `is_active`, and every dish belonging to
  the restaurant and `is_available`; snapshots dish name/price from
  `dishes` (never from the client); leaves `status` at `pending`; and
  computes `total_amount` itself. Offers: with `p_offer` set it raises
  `offer_unavailable` if that switch is off, `offer_wrong_restaurant` if
  a biryani-offer order isn't from `offers_restaurant_id` or a 10% / 20%
  order is from a restaurant in `offer_restaurant_exclusions`, and for `'biryani'` checks
  every `p_free_items` entry is an available dish in this restaurant's
  "Single Biryani" section with at most one per 3 paid dishes in its "Veg
  Biryani" / "Non-Veg Biryani" sections (`offer_not_eligible`); it computes
  the discount itself (10% / 20% of the paid items, `round()`ed, or the free
  items' value). Free items without the biryani offer are `invalid_items`.
  It also checks `public.ordering_is_open()`
  before anything else (raising `ordering_paused` while the admin has it
  Closed; `ordering_closed` came from the old schedule's `'auto'` and goes
  with it at launch) — enforced in the function itself, not just hidden in the UI,
  since a direct PostgREST call would otherwise bypass an app-level check.
  Since [`20260922000000_place_order_rate_limit.sql`](supabase/migrations/20260922000000_place_order_rate_limit.sql)
  it also rate-limits, right after the ban check: at most **5 orders per
  student per minute** (`order_rate_limited`) and **8 unfinished orders**
  (not delivered/cancelled) at once (`too_many_open_orders`), under a
  per-student `pg_advisory_xact_lock` so simultaneous taps can't both slip
  under. The cart is kept on any refusal. Login needs no limit of ours —
  Google-only, and Supabase Auth's own rate limits apply.
- **Security headers** (`next.config.ts`, every path): `X-Frame-Options:
  DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (no camera/mic/location); HSTS comes from Vercel.
  CSP is a moderate policy (`'unsafe-inline'` scripts because the
  theme/splash init scripts and JSON-LD are inline on purpose; connections
  only to self + Supabase REST/Realtime), **enforced** (since the redesign
  branch, 14 Oct 2026 — the same policy College Bites enforces) —
  violations POST to `/api/csp-report` (excluded from the proxy matcher)
  and land in Vercel logs as `[csp] …`. Add any new external origin to it,
  or the browser blocks it.
  It raises short error keys
  (`banned`, `restaurant_closed`, `dish_unavailable`, `ordering_paused`, `ordering_closed`, …) that
  `src/lib/orders/actions.ts` maps to messages. Admins
  can additionally update any `orders` row (e.g. changing `status`) and read
  every `orders` row, every `users` row, and every `order_items` row (not
  just their own — needed for the admin dashboard's order list, stat
  counts, and showing who placed each order) — the orders update policy
  covers the whole row, not just `status`, since Postgres RLS can't
  restrict to a single column without a trigger. Admins can also update
  any `users` row (needed for the ban toggle — see below).
- Ban enforcement is by **phone number, not account**: `place_order()`
  calls `public.current_user_is_banned()`, which — despite the
  name — checks whether *any* `users` row sharing the calling account's
  phone number has `is_banned = true`, not just the calling account
  itself. This closes the loophole where a banned student just signs up
  again with a new Google login but the same phone number. Accepted
  tradeoff: two different students who happen to share a phone number
  (e.g. a shared hostel/family line) would both get blocked if either is
  banned — deliberately not scoped more precisely than that right now.
  The cart shows a friendly message when an order is refused for a ban.
- There is no admin login system: a user becomes an admin by manually
  setting their own `users.role` to `'admin'` in the database after signing
  up normally — `role` stays changeable only that way, never through the
  API, admin included. `is_banned` **can** now be changed through the API,
  but only by an admin (the `/admin/banned` page — search a
  student to ban them, or unban from the banned list — on any student's
  row; a student still can't touch their own `is_banned`). A trigger
  (`prevent_role_self_escalation`, despite the name it now guards `role`,
  `is_banned`, **and `phone`**) enforces both: it blocks any API change to
  `role` outright, and blocks an API change to `is_banned` unless the
  caller is an admin (`public.is_admin()`) — so the existing "update own
  profile" policy can't be used to self-promote or self-unban, and the new
  "admins can update any user" policy can't be used by a student (it only
  grants anything to `role = 'admin'` callers to begin with). For `phone`,
  the trigger still blocks the change outright via the API regardless of
  admin status — direct DB access (SQL editor, migrations) is unaffected
  and remains the only way around any of these.
  Specifically for `phone`: the trigger raises if the account is currently
  `is_banned` (permanent — bans match by live phone at order time, so
  letting a banned student change it would let them escape the ban
  outright) or if the student has any order not yet `delivered`/`cancelled`
  (temporary — the delivery contact number shouldn't change mid-order).
  The app enforces the same two rules up front in
  `src/app/profile/actions.ts` (for a friendly message instead of a raw
  DB error), but the trigger is the real boundary — `users` is reachable
  directly via PostgREST with a student's own access token, bypassing the
  app entirely.

- **`trending_dishes(days_back int default 7, result_limit int default 5)`**
  — security definer, callable by `authenticated` only, same pattern as
  `place_order()`. Powers the ranked start of Home's "Campus favourites"
  row (`popular-rail.tsx`; the old flame-button Trending popup is gone):
  top ordered dishes campus-wide over a rolling window
  (`orders.status <> 'cancelled'`, restaurant `is_active`, dish
  `is_available`). Needed because students can only read their *own*
  orders/order_items under RLS — there's no other way to compute a
  cross-student aggregate. Returns only aggregate counts (dish/restaurant
  name + a number), never anything per-student, so nothing here leaks who
  ordered what. Since
  [`20260921020000_trending_skip_banned.sql`](supabase/migrations/20260921020000_trending_skip_banned.sql)
  it also skips orders placed before launch (20 Sep 2026, IST) and orders
  from any **banned phone number** — the pre-launch test accounts were
  banned to keep them out, so unbanning one brings its orders back into
  Trending (and into the Home card slide order, which uses the same RPC).
  `highly_reordered_dishes()` / `my_weekly_rank()` deliberately don't
  filter either way.

`trending_restaurants(days_back int default 7, result_limit int default 3)`
was added in the same migration (same pattern) for a "Top restaurants"
leaderboard that got removed from the UI before shipping, then dropped in
[`20260917010000_drop_unused_trending_restaurants.sql`](supabase/migrations/20260917010000_drop_unused_trending_restaurants.sql)
once confirmed unused — it no longer exists in the database.

- **`my_weekly_rank(days_back int default 7)`** — security definer,
  callable by `authenticated` only. Returns only the *calling* student's
  own row (`where user_id = auth.uid()` inside the function) — order
  count, rank, and percentile among everyone who ordered in the window —
  never other students' counts or identities, unlike `trending_dishes()`
  above which returns aggregate-only data with no user scoping at all.
  Powers the profile's weekly-rank badge
  (`src/components/profile/weekly-rank-badge.tsx`), shown only when
  `percentile <= 50` and at least 5 students participated that week — a
  UI-only choice (not a security one) so the badge stays flattering and
  the percentile stays statistically meaningful, not a database
  restriction. The raw percentile is never shown directly — students found
  "Top 40%" confusing, so the UI maps it to one of three tier labels
  instead (Top orderer `<=10%`, Frequent orderer `<=25%`, Active orderer
  `<=50%`); `percentile`/`rank`/`totalStudents` stay in the returned row
  for that mapping and are the only reason the raw numbers still exist.

- **`highly_reordered_dishes(min_repeat_students int default 3,
  result_limit int default 10)`** — security definer, callable by
  `authenticated` only, same aggregate-only pattern as `trending_dishes()`.
  A dish qualifies when at least `min_repeat_students` distinct students
  have each ordered it 3+ times (`orders.status <> 'cancelled'`) — a
  genuine repeat-purchase signal, deliberately different from
  `trending_dishes()`'s raw order-volume popularity. Powers the menu's
  "Highly re-ordered" tag (`src/components/menu/dish-card.tsx`, alongside
  the existing "Your favorite" tag — the card shows one of the two, with
  "Your favorite" winning if a dish is both), fetched via
  `getHighlyReorderedDishIds()` in `src/lib/data/reorders.ts`.

No other open schema TODOs right now (see "Pending decisions" below for
one that will eventually need its own migration, once approved).

## Pending decisions

- **Fully automated WhatsApp order confirmation** — proposed
  2026-09-18, not started. Today, the admin dashboard's WhatsApp button
  (`src/components/admin/order-card.tsx`) just opens a `wa.me` link with
  prefilled text that the admin has to manually send, then manually reads
  the student's reply and clicks "Confirm" themselves. The plan is to
  fully automate this end to end: the moment `placeOrder()`
  (`src/lib/orders/actions.ts`) succeeds, the server sends the
  confirmation message itself via the WhatsApp Business Platform (Cloud
  API, directly or through a provider like Gupshup/AiSensy/Interakt), and
  when the student replies "yes" a webhook auto-flips the order to
  `confirmed` — no admin click at all for that step. The manual WhatsApp
  button gets removed once this is live and verified working.

  **Blocked on client confirmation before any implementation**, because
  it has real, ongoing implications beyond this codebase:
  - A recurring cost: Meta's current utility-message rate is ~₹0.115 +
    18% GST per message (negligible at today's order volume — roughly
    ₹100-200/month — but it's real money the client needs to knowingly
    take on, plus a possible BSP markup/subscription if going through a
    third-party provider instead of Meta directly).
  - The number used (currently `8247075652`, see `src/lib/support.ts`)
    would need to be dedicated to the WhatsApp Business Platform —
    it can no longer double as a number someone checks in the normal
    WhatsApp app; replies get read via the provider's web inbox instead.
  - Meta business verification and message-template pre-approval, which
    has its own turnaround time (hours to a few days) and requires the
    client to sign off on the exact wording before it's submitted.
  - A new webhook endpoint (security-sensitive — needs signature
    verification) to receive replies and match them back to the right
    pending order; a student with more than one pending order at once
    needs a disambiguation rule that doesn't exist yet.

  Next step: the dev asks the client about the three bullets above (cost,
  giving up normal app access on that number, and template wording) and
  confirms before any code or schema work starts. Once approved, this
  will need its own migration (e.g. tracking a sent message's id/status
  against an order) — subject to the schema-change hard rule below like
  everything else.

## Hard rule: schema changes

**Never change the database schema without showing the SQL first**, in
chat, and getting explicit go-ahead — regardless of how small the change
looks. After approval, add a new timestamped file under
`supabase/migrations/` (never edit a migration that's already been applied)
and update the schema summary above to match.
