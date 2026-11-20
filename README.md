# Oryne — Free No-Code Plugin for Squarespace 7.1

![Oryne logo](oryne-logo.svg)

**Oryne** ek free, original no-code plugin hai Squarespace 7.1 ke liye.
Loader snippet + click-to-select editor + **137 effects, 42 feature groups** — sab kuch apna original code hai, kisi aur plugin ka code, naam, logo ya text copy nahi kiya gaya.

> Roman Urdu guide pehle hai, English short version neeche hai.

---

## 1. GitHub par kaise dalen — Step by Step (Roman Urdu)

Ye tareeqa free hai aur Squarespace ke liye best hai, kyunke GitHub + jsDelivr se files fast aur reliable load hoti hain.

### Step 1 — GitHub account banao
1. [github.com](https://github.com) kholo, **Sign up** karo (free).
2. Email verify karo, login karo.

### Step 2 — Naya repo banao
1. GitHub par upar right **+** dabao → **New repository**.
2. **Repository name:** `oryne-plugin` (bilkul yehi naam).
3. **Public** select karo (Private par jsDelivr kaam nahi karega).
4. **Add a README file** ko tick mat karo (files tum upload karoge).
5. **Create repository** dabao.

### Step 3 — Files upload karo (2 tareeqe, jo aasan lage)

**Tareeqa A — Web UI (bina git ke, sab se aasan):**
1. Apne naye repo page par **Add file → Upload files** dabao.
2. Is folder ki saari files select karo: `plugin.js`, `plugin.css`, `demo.html`, `loader-snippet.html`, `README.md`, `LICENSE`, `.gitignore`, `oryne-logo.svg`.
3. **Commit changes** dabao. Bas, files GitHub par aa gayin.

**Tareeqa B — Git commands (computer par git ho to):**
```bash
cd ~/workspace/oryne-plugin
# pehli baar:
git init
git add .
git commit -m "Oryne v2 - 137 effects, 42 groups"
git branch -M main
git remote add origin https://github.com/aymaiman988-art/oryne-plugin.git
git push -u origin main

# baad mein koi change karne par:
git add .
git commit -m "Update Oryne"
git push
```
Tumhara GitHub username `aymaiman988-art` hai, ye links mein pehle se bhar diya gaya hai.

### Step 4 — GitHub Pages ON karo (optional, demo ke liye — Version B ke liye zaroori)
1. Repo mein **Settings → Pages** jao.
2. **Build and deployment → Source:** `Deploy from a branch` select karo.
3. **Branch:** `main`, folder: `/ (root)` select karo → **Save**.
4. 1–2 minute wait karo. Tumhari site hogi:
   `https://aymaiman988-art.github.io/oryne-plugin/demo.html`
5. Demo test link: `https://aymaiman988-art.github.io/oryne-plugin/demo.html`

### Step 5 — Squarespace mein loader lagao (jsDelivr — recommended)
Squarespace mein jao: **Website → Website Tools → Code Injection → Header**

Ye snippet paste karo, tumhara username pehle se bhara hua hai:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/aymaiman988-art/oryne-plugin@main/plugin.css">
<script src="https://cdn.jsdelivr.net/gh/aymaiman988-art/oryne-plugin@main/plugin.js" defer></script>
```

Yehi snippet `loader-snippet.html` mein bhi hai (Version A).

**GitHub Pages wala alternative (Version B):**
```html
<link rel="stylesheet" href="https://aymaiman988-art.github.io/oryne-plugin/plugin.css">
<script src="https://aymaiman988-art.github.io/oryne-plugin/plugin.js" defer></script>
```

**raw.githubusercontent.com use NA karo** — wo CSS/JS ko `text/plain` content-type se deta hai, browser use block kar deta hai aur Squarespace par effects nahi chalte. jsDelivr ya GitHub Pages hi use karo.

### Step 6 — Editor kholo aur effects lagao
1. Apni site kholo (logged-in).
2. Neeche right corner mein round **Oryne button** dabao — panel right side se khulega.
3. Panel ke upar **Search** box mein likho, jaise `tabs`, `calendar`, `cursor`, `cookie` — effects filter ho jayenge.
4. Panel khula ho to page par kisi bhi text, image, button ya section par click karo — wo select ho jayega.
5. **Single element** ya **All of this type** choose karo.
6. Effect choose karo, sliders / colors / dropdown set karo — preview live dikhega.
7. **Save** dabao.

### Step 7 — Footer mein config paste karo
Editor mein **Generate Code** dabao, jo code aaye use copy karo aur paste karo:
**Website → Website Tools → Code Injection → Footer**

Bas. Ab visitors ko bhi effects dikhenge, editor band hone par bhi.

**Export / Import:** **Export JSON** se config download karo, **Import** se wapas lao. **Reset** se sab effects hata do.

### Update kaise karen (baad mein change ho to)
1. File edit karo (computer ya GitHub web editor mein).
2. `git add .` → `git commit -m "Update"` → `git push` (ya web UI se upload karke commit karo).
3. 1–2 minute wait karo. jsDelivr cache ki wajah se change turant na dikhe to URL ke end par `?v=2` lagao, jaise:
   `https://cdn.jsdelivr.net/gh/aymaiman988-art/oryne-plugin@main/plugin.js?v=2`
   Agli update par `?v=3`, phir `?v=4` — ye cache-buster hai.
4. Squarespace page refresh karo aur check karo.

### Demo test karo (bina Squarespace ke)
1. Is folder mein `demo.html` ko browser mein kholo (double-click, ya `python3 -m http.server` se).
2. Ya GitHub Pages link kholo: `https://aymaiman988-art.github.io/oryne-plugin/demo.html`
3. Right-bottom Oryne button dabao, koi block select karo, effect lagao, Save karo.
4. Page refresh karo — saved effect wapas lag jayega (demo mein localStorage use hota hai).

---

## English Guide (short)

1. Create a free GitHub account, create a **public** repo named `oryne-plugin`.
2. Upload all files via web UI (**Add file → Upload files**) or git (`git init`, `add`, `commit`, `branch -M main`, `remote add origin https://github.com/aymaiman988-art/oryne-plugin.git`, `push -u origin main`).
3. Optional: **Settings → Pages → Deploy from a branch → main / (root)**. Demo at `https://aymaiman988-art.github.io/oryne-plugin/demo.html`.
4. Paste the jsDelivr loader in Squarespace **Code Injection → Header** (username `aymaiman988-art` already filled in). Do NOT use `raw.githubusercontent.com` — wrong content-type, browsers block it.
5. Open your site, click the round **Oryne button**, click any block to select it, search effects in the panel, pick one, adjust options, click **Save**.
6. Click **Generate Code**, paste that output in **Code Injection → Footer**. Done.
7. To update: edit, commit, push, wait 1–2 min, add `?v=2` cache-buster if jsDelivr still serves the old file.

---

## Features — 137 effect IDs, 42 groups

Panel categories: **Animations, Motion, Text, Buttons, Blocks & Images, Visibility, Navigation, Content & Marketing, Design, Content, Widgets** — plus search/filter in the panel.

| # | Group (42) | Oryne mein kya hai |
|---|---|---|
| 1 | Vertical Tabs | Section ko vertical tabs banaye |
| 2 | Flex Cards | Gallery ko flex cards, hover par phailen |
| 3 | Event Calendar | Month calendar + events list |
| 4 | Pricing Plan | Pricing Plan Designer + Pricing Highlight |
| 5 | Testimonial Slider | Slider + Testimonial Card style |
| 6 | Smart Filter | List par filter buttons |
| 7 | Scrolling Logo Carousel | Logos scroll karte rahein |
| 8 | Popup Builder | Delay ke baad popup |
| 9 | Before & After Slider | Drag slider |
| 10 | Text Effects | Gradient, Glow, Outline, Shadow, Animated Gradient, Uppercase, Italic, Strikethrough |
| 11 | Word Loop Effect | Words badal badal kar dikhaye |
| 12 | Block Text Options | Center, Line Height, Wide Letters, Letter Spacing |
| 13 | Mega Menu | Bada dropdown panel |
| 14 | Back to Top Button | Scroll par floating Top button |
| 15 | Loading Screen | Branded loading overlay |
| 16 | Scroll Indicators | Sections par jump karne wale dots |
| 17 | Dropdown Designer | Styled dropdown |
| 18 | Momentum Scroll Animations | 12 scroll animations: Fade, Slide, Zoom, Flip, Bounce, Rotate, Blur, Scale, Skew, Reveal |
| 19 | Button Designer | 15 styles: Gradient, Pill, Outline, Lift, Glow, Shine, Underline, 3D, Glass, Neon, Arrow, Rounded, Square, Ghost, Dark |
| 20 | Live Chat | Floating WhatsApp / Email buttons |
| 21 | Countdown Timer | Days / Hours / Mins / Secs |
| 22 | Blog Post Banner | Gradient blog banner |
| 23 | Header Designer | Transparent, Centered, Shadow, Sticky Header |
| 24 | Video Block Designer | Framed video block + play badge |
| 25 | Sale & Sold Out Labels | SALE / SOLD OUT badges |
| 26 | Hover Effects | Lift, Glow, Scale, Flip, Overlay, Border, Shadow Grow, Rotate |
| 27 | List & Carousel Designer | List Grid, List Cards, Carousel Dots |
| 28 | Search Bar | Header search, page par dhoonde |
| 29 | Block Designer | Background, Padding, Glass, Minimal |
| 30 | Mobile Menu Designer | Hamburger menu (mobile) |
| 31 | Background Effects | Animated Gradient, Dots, Grid, Glow Orb, Diagonal, Noise, Dark |
| 32 | Dynamic Background Colors | Color Cycle + Scroll Color Background |
| 33 | Video Popup Button | Button se video modal |
| 34 | Announcement Bar Effects | Animation, Slide, Marquee |
| 35 | Image Design & Effects | Zoom, Reveal, Grayscale, Tilt, Circle, Triangle, Parallel, Arrow, Spotlight, Pop, Fade, Flip |
| 36 | Block Animator | Loop Float, Pulse, Wiggle, Spin, Bounce |
| 37 | Section & Block Visibility | Hide on Mobile / Desktop / Tablet |
| 38 | Slide-in Menu | Side drawer menu |
| 39 | Sticky Sections Effect | Sticky Section + Sticky Header |
| 40 | Custom Cursors | Star / Dot / Emoji cursor follower |
| 41 | Number Counter | 0 se count up |
| 42 | Cookie Banner Designer | Dark / Light / Pill, Accept / Decline |

**Total: 137 unique effect IDs** (har ID ek alag effect hai; kai effects ke andar options/variants bhi hain, jaise Button Designer ke 15 styles, Scroll Animations ke 12, Text Effects ke 8+).

Editor features: click-to-select with highlight, search/filter, All vs Single scope, live preview, sliders / color pickers / dropdowns / text options, Save, Export JSON, Import, Generate Code (footer snippet), Reset, applied-effects list with Remove.

Config format:
```json
{ "target": "[data-block-id=\"block-hero-h1-001\"]", "effect": "fade-up", "options": { "duration": 0.7, "delay": 0 }, "scope": "single" }
```

Public API: `window.Oryne.refresh()`, `window.Oryne.getConfig()`, `window.Oryne.EFFECTS`.
Hide editor on a live site: add `?oryne=hide` to the URL, or set `window.__ORYNE_NO_EDITOR__ = true` before the loader script.

---

## Files

| File | Kya hai |
|---|---|
| `plugin.js` | Poora plugin — vanilla JS, no dependencies, 137-effect registry + runtime + editor |
| `plugin.css` | Editor + runtime styles, sab `oryne-` prefix ke saath |
| `loader-snippet.html` | Header snippet — jsDelivr (Version A) + GitHub Pages (Version B) |
| `demo.html` | Fake Squarespace 7.1 demo site — Tabs, Calendar, Flex Cards, Smart Filter, Blog, Widgets |
| `oryne-logo.svg` | Oryne ka original logo — open "O" ring + star mark |
| `LICENSE` | MIT License — original Oryne code |
| `.gitignore` | Git ignore rules |
| `README.md` | Ye guide |

## Limitations — sach bata raha hoon

- **No server:** Oryne ka koi server ya account nahi hai. Config sirf generated Footer snippet mein ya demo mein `localStorage` (`oryneConfig.v1`) mein save hoti hai.
- **Footer snippet zaroori hai:** Sirf Header loader se editor chalega, lekin visitors ko effects dikhane ke liye Footer config snippet paste karna hoga.
- **Squarespace 7.1 only:** Ye Squarespace 7.1 ke DOM (`data-section-id` / `data-block-id`) par kaam karta hai. 7.0 par support nahi hai.
- **Squarespace updates:** Agar Squarespace apna HTML structure badal de, kuch selectors ko update karna par sakta hai.
- **Editor sirf owner ke liye:** Live site par editor button sab ko nazar aayega jab tak aap `?oryne=hide` ya `__ORYNE_NO_EDITOR__` use na karein.

## License

MIT License — see `LICENSE`. Free to use and modify for your own sites. Original code — please do not rebrand it as another paid plugin.
