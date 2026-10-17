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

- **Android (Chrome):** on the dashboard, tap the **phone icon** (Install)
  at the top, then **Install** in Chrome's popup.
- **iPhone:** open the dashboard in **Safari**, tap the phone icon to see
  the steps: **Share** → **Add to Home Screen** → **Add**.

The button disappears once it's installed. You still sign in and enter the
passcode the first time.

## Every day

### Open or close ordering

The big plum **Today** card at the top of admin shows today's orders and
has the **Open / Closed** switch at its foot.

- **Open** — students can order from every restaurant that's turned on.
  It stays open until you close it ("Open until you close it"); there is
  no automatic schedule.
- **Closed** — nobody can place a new order, and **every restaurant is
  turned off**. Orders already placed are not affected.
- After re-opening, turn on the restaurants you want under **Restaurants**
  on the same page. Tapping **Turn on** while ordering is closed asks
  whether to open ordering now — **Open ordering** opens it and turns that
  restaurant on too.
- **Close ordering at night.** If it's left open, an order placed after
  midnight is promised for the next lunch slot (by 1:30 PM).

### New orders

- Tap **Turn on alerts** (the bell) once on each phone: you'll get a
  **push notification** for every new order, even with the page closed.
- While the admin page is open, a **loud alarm** plays for every new
  order. Browsers only allow sound after a tap, so each time you open
  admin, tap **Tap to arm sound** until the button says **Alerts on**.

### Handling an order

**Current orders** lists today's orders. A delivered or cancelled one
drops off once its delivery time has passed; anything still waiting for
you stays until it's done. Every order ever placed is in **Order history**.

Each order card shows the **token number** (e.g. #12 — the student shows
this at the gate), a "From <restaurant>" box with each dish as
"Dish name - quantity" and its price, the student's note, name and number.
Extras show with the dish ("Nutella Pop + Ice cream - 1"), and sized
dishes keep their size ("Apples (500 g) - 2").

1. **WhatsApp** — opens a chat with the student with the order already
   typed out. Ask them to reply "yes".
2. **Confirm** — once they've confirmed and you've placed it with the
   restaurant. The student gets a notification.
3. **Copy** (the copy icon) — copies the student's name and number, then
   the restaurant and each dish, to paste to the restaurant. No prices.
4. **Mark delivered** — once they've collected it at **VIT-AP Main Gate**.
   The student is notified and can rate the order.
5. **Cancel order** — only while the order is still waiting to be
   confirmed. The student is notified.

**Mark all delivered** marks every confirmed order **whose delivery slot
has ended** as delivered, in one go (any day, not just today). While no
slot has ended yet it's greyed out and says when the next one ends
("Next slot ends 1:30 PM").

Tap any card (its token) for the full details page: timings, phone, email,
registration number, each dish's price, the total, the note, and the
student's stars once they've rated it.

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
while offers are running). The Offers page has three switches:

- **10% off**: 10% off the whole order, at **every restaurant**.
- **20% off**: 20% off the whole order, at **every restaurant**.
- **Buy 3 full biryanis, get 1 single free**: **Bheemasena Restaurant
  only** (other restaurants' carts show it greyed out). For every 3 biryanis from
  the **Veg Biryani** or **Non-Veg Biryani** sections in one order, the
  student picks one biryani from the **Single Biryani** section free. They
  pay the full price of the full biryanis; the single costs nothing.

Under **10% off** and **20% off** there's a list of every restaurant,
each with its own switch, all on to start. Switch a restaurant off to
leave it out of that offer: its students see the offer greyed out, "Not
at this restaurant". A new restaurant joins both offers automatically.

Turn on any you like; they take effect straight away. Students see an
**Apply discount** bar in their cart and pick **one offer per order**.
Turn a switch off to end that offer. Orders already placed keep their
discount.

Order cards show the offer and its saving (e.g. "10% off −₹42") and mark
free biryanis "Free", and the WhatsApp and copy text say "(free)", so the
restaurant knows not to charge for them. The total shown is what the
student pays. If Bheemasena renames one of those three sections, ask the
developer: the offer matches them by name.

## When something changes

| You want to… | Do this |
|---|---|
| Stop one restaurant for a while | **Restaurants** (on the dashboard) → **Turn off** (turn it on again later) |
| Mark a dish as sold out | **Sold out** → pick the restaurant or search → **Sold out** (tap **Back on sale** to bring it back). Students still see the dish, greyed out, and can't order it. |
| Block someone who keeps not collecting | **Users** → **Banned users** → search them → **Ban** → **Ban student** (tap **Unban** to undo). This blocks their **phone number**, so a new Google account with the same number is blocked too. |
| See every past order | **Order history** — grouped by day, with search, restaurant and status filters, and **Export to Excel** (downloads what's on screen) |
| Read ratings | **Reviews** — dish averages (lowest first) and notes, with "Needs attention" and "With notes" filters; only admins ever see these |
| Hand over a free biryani | A student who unlocks all 6 milestones messages you on WhatsApp. After handing it over: **Users** → filter **Free biryani earned** → **Mark claimed** (there's an **Undo**) |
| Add a restaurant | **Menus** → **Add restaurant** (name, description, cuisine tags; the phone is optional). It starts switched off and hidden from students; add its menu, then **Restaurants** → **Turn on** |
| Add, edit or delete a dish | **Menus** → the restaurant → **Add dish to …** under a section, or tap a dish to change its name, price, veg / non-veg, section, note or sold out, or **Delete dish** |
| Add or rename a menu section | **Menus** → the restaurant → **Add section**, or the pencil next to a section (a section can be deleted once it's empty) |
| Change the order of sections or dishes | **Menus** → the restaurant → **Reorder**, then the up / down arrows, then **Done** |
| Photos, extras (add-ons), or the biryani offer's sections | Ask the developer. Photos are matched by name, so renaming a dish or restaurant that has a photo hides it until the developer updates it |

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
