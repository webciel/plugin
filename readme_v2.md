# 🌐 `webciel-plugin` — Lightweight Framework for Chrome Extensions

A tiny modular framework for dynamic **HTML/script loading**, **component lifecycle**, **localization**, and **templating** — designed for Chrome Extensions (but works in any browser context).

## 💡 Inspiration

I built `webciel-plugin` by drawing inspiration from many great frontend frameworks — each of which contributed key ideas to its design:

| Concept                               | Inspired by                   |
| ------------------------------------- | ----------------------------- |
| 🔌 Dynamic module injection           | RequireJS, SystemJS           |
| 🧩 HTML + JS component structure      | Vue SFCs, Alpine.js, Stimulus |
| 🔄 Lifecycle registration (`onMount`) | Stimulus, React               |
| 🌍 Translations / i18n                | i18n.js, vue-i18n             |
| ⚡ Cached data fetching                | SWR, React Query              |
| 🧰 Modular app architecture           | Next.js pages/includes        |

> **Goal:** Bring together declarative templates, scoped component logic, and cache-aware API calls — especially suited for dynamic environments like browser extensions or embedded widgets.

## 📦 Features

* ✅ Lazy loading of HTML templates and scripts
* ✅ Component-style lifecycle (`onMount`)
* ✅ Simple localization system (`{{ locale.key }}`)
* ✅ Built-in icon support with [Feather Icons](https://feathericons.com)
* ✅ Page and include management
* ✅ Template caching via `sessionStorage`

## 🚀 Quick Start

```ts
import { LoadPage } from 'webciel-plugin'

await LoadPage('dashboard')
```

## 📁 Project Structure

```txt
my-extension/
├── node_modules/
│   └── webciel-plugin/
│       └── dist/               ← Built library
├── vendors/
│   └── ...
├── dist/                       ← Final build directory
│   └── webciel-plugin/         ← Copied from the built library
|
├── src/
|   ├── pages/
|   │   └── dashboard/
|   │       ├── index.html       ← Contains HTML and `<!-- script('index') -->`
|   │       └── index.js         ← onMount logic registered via `Register(...)`
|   ├── includes/
|   │   └── navigation/
|   │       ├── index.html
|   │       └── index.js
|   ├── templates/
|   │   └── widgets/
|   │       └── infoBox/
|   │           └── index.html
|   ├── locales/
|   │   ├── en.ts
|   │   └── fr.ts
|   ├── background.js
|   ├── content.js
|   ├── index.html
|   └── init.js                 ← Your extension entry point
|
├── .env.dev
├── .env.prod
└── gulpfile.js (or build tool)
```

### ⚙️ Build Step: Copy the Plugin to Your Extension
In your `gulpfile.js` or build system, copy `webciel-plugin/dist` into your extension’s `dist/` folder:

```ts
gulp.src('node_modules/webciel-plugin/dist/**/*')
  .pipe(gulp.dest('dist/webciel-plugin'))

```
### 🔧 Create an Init Entry File

```ts
import { LoadPage, registerLocales } from 'webciel-plugin'
import { locales_en } from './locales/en.js'
import { locales_fr } from './locales/fr.js'
import { logout } from './services/auth.js'

// Set available languages
registerLocales({ en: locales_en, fr: locales_fr }, 'en')

// Load default page
await LoadPage('dashboard')
```

### 🔗 Usage in HTML
In your final HTML (e.g. index.html or popup.html or panel.html):

```html
<script type="module" src="./webciel-plugin/index.js"></script>
<script type="module" src="./init.js"></script>
```


## 🧩 Template & Script Loading

### ✅ `LoadPage(name: string)`

Loads a page from `pages/<name>/index.html`

* Injects into `#_root`
* Loads includes via `<!-- include(...) -->`
* Executes `onMount` if registered

### ✅ `LoadTemplate(templatePath, options)`

Injects a `template` (HTML + optional JS) into any DOM element.

```ts
await LoadTemplate('widgets/infoBox', {
  element: document.getElementById('sidebar'),
  mode: 'append',
  replacements: { user: 'Jane', date: '2025-07-17' }
})
```

Options:

* `element`: target DOM node
* `mode`: `'append'`, `'prepend'`, or `'innerHTML'`
* `replacements`: string interpolation for `{key}` placeholders

## 📌 Registry System

### ✅ `Register(name, fn)`

Registers an `onMount` lifecycle hook for a given component path.

```ts
Register('includes/navigation', () => {
  const logoutBtn = document.getElementById('logoutButton')
  logoutBtn?.addEventListener('click', () => logout())
})
```

### ✅ `Execute(name)`

Manually runs the registered `onMount` function.

## 🌍 Localization System

### ✅ `registerLocales(...)`

```ts
import { registerLocales } from 'webciel-plugin'
import { locales_en } from './locales/en'
import { locales_fr } from './locales/fr'

registerLocales({ en: locales_en, fr: locales_fr }, 'en')
```

### ✅ HTML Template Usage

```html
<h1>{{ locale.dashboard.title }}</h1>
<button>{{ locale.buttons.logout }}</button>
```

## 🧠 Caching & HTML Interpolation

* All HTML files fetched via `chrome.runtime.getURL(...)`
* Cached in `sessionStorage`
* Custom replacements supported via `{key}` syntax
* Localization via `{{ locale.key }}` handled before injection

## 🧱 Internal Utilities

* `LoadScripts(html, basePath)` → parses `<!-- script('file') -->` and loads `<script type="module">`
* `LoadIncludes(html)` → replaces `<!-- include(...) -->` and recursively loads includes
* `SetCurrentPage(name)` / `GetCurrentPage()` → track current view in DOM
* `applyTranslations(html)` → applies locale bindings

## 🧪 API Example

```ts
const api = new Api({ baseUrl: 'https://example.com/api' })

interface User {
  id: string
  name: string
}

// 1. Fetch and cache
const response = await api.get<User>('/user/me')
console.log('fetched me:', response.data)

// 2. Use cached version
const cached = await api.get<User>('/user/me')
console.log('cached me:', cached.data)

// 3. Force refresh
const fresh = await cached.reload()
console.log('refetched me:', fresh.data)
```

## 🛠 Tech Stack

* JavaScript / TypeScript
* Chrome Extension APIs
* DOM manipulation
* Minimal runtime

## 📥 Installation

```sh
npm install --save webciel-plugin
```

Or for development usage inside your Chrome extension project:

```ts
import { LoadPage, LoadTemplate, Register, registerLocales } from 'webciel-plugin'
```

![Made with ♥ by Alexis PIQUET](https://img.shields.io/badge/Made%20with-%E2%99%A5%20by%20Alexis%20PIQUET-ff69b4?style=flat-square)


