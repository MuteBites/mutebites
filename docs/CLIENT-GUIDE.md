# MuteBites — running the app

A short guide for the MuteBites team. The site is
**https://mutebites.vercel.app** — it works in any phone browser and can be
added to the home screen like an app.

> This guide describes the app **after the redesign update** (Open /
> Closed ordering, the new admin look). Until that update goes live, the
> admin page still shows the older layout.

---

## Getting into admin

1. Sign in on the site with Google, using an **admin account** (ask the
   developer which accounts are admins).
2. Open **https://mutebites.vercel.app/admin**.
3. Enter the **admin passcode** (ask the developer; it is never written
   down in the app or sent in chat).

A new admin account can only be added by the developer. If the passcode
is ever changed, every phone has to enter the new one.

### Install the admin app (optional)

Put admin on your phone's home screen as its own app, **MuteBites Admin**
(the icon says "Admin" under the mascot). It opens straight on the
dashboard, separate from the student app.

- **Android (Chrome):** open the **More** tab, tap **Install app**, then
  **Install** in Chrome's popup.
- **iPhone:** open admin in **Safari**, go to **More** → **Install app** to
  see the steps: **Share** → **Add to Home Screen** → **Add**.

The tile disappears once it's installed. You still sign in and enter the
passcode the first time.

## Every day

### Open or close ordering

Admin is built for your phone. It follows your phone's light / dark setting; to pick Light or Dark for admin only, use **More → Appearance**. At the bottom
there are five tabs: **Orders** (everything about today's orders),
**Kitchen** (the restaurant switches, and what to tell each restaurant),
**Handover** (for the Main Gate), **Analytics** (how the business is doing)
and **More** (every other admin page).

The big plum **Today** card at the top of **Orders** counts down to the end
of the current delivery slot ("38:12 left · 1:30 PM slot") with how many
orders are due in it, and warns you if any order is past its slot. It has
the **Open / Closed** switch at its foot. Under it, four tiles: orders
today, **to collect** (the cash for every order not delivered yet),
delivered and cancelled.

- **Open** — students can order from every restaurant that's turned on.
  It stays open until you close it ("Open until you close it"); there is
  no automatic schedule.
- **Closed** — nobody can place a new order, and **every restaurant is
  turned off**. Orders already placed are not affected.
- After re-opening, turn on the restaurants you want under **Restaurants**
  on the **Kitchen** tab. Tapping **Turn on** while ordering is closed asks
  whether to open ordering now — **Open ordering** opens it and turns that
  restaurant on too.
- **Students get a notification when you open.** Once ordering is open
  **and** at least one restaurant is on, every student who turned
  notifications on gets a short, fun "we're open" message (a different one
  each time). The toast tells you how many were notified. It goes out at
  most once every 3 hours, so closing and reopening by mistake won't ping
  them twice. Students who turn off Notifications in Profile stop getting these (and their order updates).
- **Close ordering at night.** If it's left open, an order placed after
  midnight is promised for the next lunch slot (by 1:30 PM).

### New orders

- Tap **Turn on alerts** (the bell) once on each phone: you'll get a
  **push notification** for every new order, even with the page closed.
- While the admin page is open, a **loud alarm** plays for every new
  order. Browsers only allow sound after a tap, so each time you open
  admin, tap **Tap to arm sound** until the button says **Alerts on**.

### Handling an order

Today's orders sit in three tabs: **New** (waiting for you to confirm),
**Confirmed** (placed with the restaurant, waiting to be collected) and
**Done** (delivered or cancelled). A delivered or cancelled order drops off
once its delivery time has passed; anything still waiting for you stays
until it's done. Every order ever placed is in **Order history** (More tab).
The search box finds an order by token, name or phone.

Each card shows the **token number** big on the left (the student shows it
at the gate), the student's name, each dish as "Dish name - quantity",
the restaurant, the time and the amount. On **New** orders a chip shows how
long they've waited: it turns amber after 5 minutes and red after 10. On
**Confirmed** orders it shows the slot ("Due by 1:30 PM"), red once that
time has passed.

**Swipe a card right** to move it on: on **New** that confirms it, on
**Confirmed** it marks it delivered. **Swipe left** on a New order to
cancel it (you're asked first). The same actions are buttons on the card:

1. **WhatsApp** (New orders) — opens a chat with the student with the
   order already typed out. Ask them to reply "yes".
2. **Copy** (the copy icon) — copies the student's number, then each
   dish, to paste to the restaurant. No name, restaurant or prices.
3. **The round tick** — Confirm on a New order (once they've confirmed and
   you've placed it with the restaurant), Mark delivered on a Confirmed
   one (once they've collected it at **VIT-AP Main Gate**). The student
   gets a notification either way, and can rate a delivered order.

Cancelling only works while an order is still New; the student is
notified. A new order that arrives while you're looking glows once.

**Mark all delivered** (on the **Confirmed** tab) marks every confirmed
order **whose delivery slot has ended** as delivered, in one go (any day,
not just today). While no slot has ended yet it's greyed out and says when
the next one ends ("Next slot ends 1:30 PM").

Tap any card for the full details page: timings, phone, email,
registration number, each dish's price, the total, the note, and the
student's stars once they've rated it.

### Telling the restaurants (Kitchen)

The **Kitchen** tab adds up today's **confirmed** orders for you: pick a
delivery slot at the top ("By 1:30 PM"), and each restaurant gets one card
with every dish and how many ("Chicken Fry Biryani × 3"), plus the token
numbers. **Copy list** copies it; **WhatsApp** opens WhatsApp with the list
typed out, and you choose the restaurant's chat. Orders you haven't
confirmed yet aren't counted — switch on **Include new orders** to add them.

### At the Main Gate (Handover)

The **Handover** tab lists every confirmed order, sorted by token, with the
student's name and the cash to take. Type the token the student shows you
into the box at the top to jump to it. Tap the **tick** once they've
collected it: the card turns green and you get a few seconds to **Undo** a
wrong tap, then it's saved as delivered and the student is notified. The
top card shows the cash **collected today** and what's still to hand over.

### How it's going (Analytics)

The **Analytics** tab shows **Today**, the last **7 days** or **30 days**
(tap the chips at the top). Each number has an arrow comparing it with the
period just before (green = better, red = worse): orders, revenue (cash
from delivered orders), the average order, new students, how many students
ordered again, and how many orders were cancelled. Below: orders per day
(per hour for Today), the busiest times of the week (darker = busier),
each restaurant's share, the top 10 dishes, offers used and the average
star rating per restaurant. **Export … to Excel (CSV)** at the bottom saves
every order in the chosen range (one row each, with the student, dishes,
offer, amount and status) as a file that opens in Excel or Google Sheets.

### Delivery times the students see

The order ticket promises a time based on **when the order was placed**:

| Placed before | Delivery by |
|---|---|
| 12:45 PM | 1:30 PM |
| 6:00 PM | 7:30 PM |
| 7:00 PM | 8:15 PM |
| after 7:00 PM | "Delivery time to be confirmed" |

To change these times, ask the developer.

### Offers (discounts)

Tap **Offers** on the admin page (next to **Sold out**; it shows "2 on"
while offers are running). The Offers page has four switches:

- **5% off**: 5% off the whole order, at **every restaurant**.
- **10% off**: 10% off the whole order, at **every restaurant**.
- **20% off**: 20% off the whole order, at **every restaurant**.
- **Buy 3 full biryanis, get 1 single free**: **Bheemasena Restaurant
  only** (other restaurants' carts show it greyed out). For every 3 biryanis from
  the **Veg Biryani** or **Non-Veg Biryani** sections in one order, the
  student picks one biryani from the **Single Biryani** section free. They
  pay the full price of the full biryanis; the single costs nothing.

Under **5% off**, **10% off** and **20% off** there's a list of every restaurant,
each with its own switch, all on to start. Switch a restaurant off to
leave it out of that offer: its students see the offer greyed out, "Not
at this restaurant". A new restaurant joins all three automatically.

Turn on any you like; they take effect straight away. Students see an
**Apply discount** bar in their cart and pick **one offer per order**.
Turn a switch off to end that offer. Orders already placed keep their
discount.

Order cards show the offer and its saving (e.g. "10% off −₹42") and mark
free biryanis "Free", and the WhatsApp and copy text say "(free)", so the
restaurant knows not to charge for them. The total shown is what the
student pays. If Bheemasena renames one of those three sections, ask the
developer: the offer matches them by name.

### Removing a restaurant (and adding it back)

Open the restaurant in **Menus** (More tab) and tap **Remove restaurant**
at the bottom. After you confirm, it disappears from the whole app:
students can't see it, search it or order from it, and it's gone from Sold
out, Offers and the restaurant switches. Past orders still show its name.

Changed your mind? At the bottom of **Menus**, under **Removed
restaurants**, tap **Add back**. It returns with its whole menu and photos,
switched **off**, so turn it on from **Kitchen** when you're ready.

## When something changes

| You want to… | Do this |
|---|---|
| Stop one restaurant for a while | **Kitchen** → **Restaurants** → **Turn off** (turn it on again later) |
| Mark a dish as sold out | **Sold out** → pick the restaurant or search → **Sold out** (tap **Back on sale** to bring it back). Students still see the dish, greyed out, and can't order it. |
| Block someone who keeps not collecting | **Users** → **Banned users** → search them → **Ban** → **Ban student** (tap **Unban** to undo). This blocks their **phone number**, so a new Google account with the same number is blocked too. |
| See every past order | **Order history** — grouped by day, with search, restaurant and status filters, and **Export to Excel** (downloads what's on screen) |
| Read ratings | **Reviews** — dish averages (lowest first) and notes, with "Needs attention" and "With notes" filters; only admins ever see these |
| Hand over a free biryani | A student who unlocks all 6 milestones messages you on WhatsApp. After handing it over: **Users** → filter **Free biryani earned** → **Mark claimed** (there's an **Undo**) |
| Add a restaurant | **Menus** → **Add restaurant** (name, description, cuisine tags; the phone is optional). It starts switched off and hidden from students; add its menu, then **Restaurants** → **Turn on** |
| Add, edit or delete a dish | **Menus** → the restaurant → **Add dish to …** under a section, or tap a dish to change its name, price, veg / non-veg, section, note or sold out, or **Delete dish** |
| Add or rename a menu section | **Menus** → the restaurant → **Add section**, or the pencil next to a section (a section can be deleted once it's empty) |
| Change the order of sections or dishes | **Menus** → the restaurant → **Reorder**, then the up / down arrows, then **Done** |
| Add or change a dish photo | **Menus** → the restaurant → tap the dish → **Add photo** (or **Change photo**) and pick one from your phone. It saves straight away; **Remove photo** takes it off. Add a new dish first, then tap it to add its photo |
| Add or change a restaurant's cover photo | **Menus** → the restaurant → **Edit details** → **Add photo** / **Change photo** |
| Extras (add-ons), or the biryani offer's sections | Ask the developer. A few older photos were added by the developer and are matched by name: renaming that dish or restaurant hides its photo, so upload a new one |

## Payments

Cash on delivery — students pay when they collect at VIT-AP Main Gate.
UPI at the gate is fine too, between the runner and the student. The app
itself never takes payments.

## Limits students may hit

- At most **5 orders a minute** and **8 unfinished orders** per student —
  the app tells them to wait.
- A banned student can't order (their cart stays; they're told why).

## Support details students see

- Call / WhatsApp: **+91 82470 75652** (Profile → "Need help?", the order
  ticket's "Contact MuteBites", and the free-biryani claim message)
- **WhatsApp group** (offers, open / closed, new dishes):
  https://chat.whatsapp.com/D6gh4obvcvg9EffPxchpmj — students find it
  from the WhatsApp button at the top of Home (it has a dot until they
  open it), a card on Profile and the About popup (tap the logo). The site
  tells students that group members can see their number. Post offers and
  "we're open" there. A group holds at most 1,024 members; if you reset
  the invite link, or switch to a WhatsApp channel, ask the developer to
  update the site.
- Email (privacy page): **mutebites5@gmail.com** — new-order push alerts
  also go to this account's devices.

## If something looks wrong

- Pull down to refresh, or tap **Reload** in the admin header.
- A page that says "Token #404" is just a wrong link.
- Anything else: contact the developer with a screenshot and what you
  tapped.
