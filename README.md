# 📖 How our Framework Works

## 📌 Introduction

This framework powers the dynamic loading of scripts and templates in the **Commanders Act Assistant** Chrome extension. It enables:

* Modular injection of HTML and JavaScript files
* Component-based UI rendering
* Reusable `onMount` lifecycle hooks
* Icon refreshing with Feather
* Localization via dynamic translation
* Cached HTML loading for performance

---

## 🖼️ **Icon Management** (`icons.js`)

### 📜 `RefreshIcons()`

🔄 Replaces all icons using [Feather Icons](https://feathericons.com).

```ts
export function RefreshIcons() {
  feather.replace()
  console.log('[...:icons:RefreshIcons] All icons refreshed!')
}
```

---

## 📦 **Framework Entry Point** (`index.js`)

### 📜 Exports all modules:

```ts
export * from './registry.js'
export * from './icons.js'
export * from './load.js'
export * from './locale.js'

console.log('[...:framework:index] All modules loaded.')
```

---

## 🌍 **Localization System** (`locale.js`)

Supports per-locale translation (`en`, `fr`, etc.) in HTML templates.

### 📦 Example:
```ts
// src/main.ts
import { registerLocales } from 'webciel-plugin'
import { locales_en } from './locales/en'
import { locales_fr } from './locales/fr'

registerLocales({
  en: locales_en,
  fr: locales_fr,
}, 'en')
```

```html
<h1>{{ locale.dashboard.title }}</h1>
```

---

## 🏗️ **Component Registry** (`registry.js`)

Manages `onMount` hooks for pages and includes.

### 📝 `Register(name, fn)`

Registers an `onMount` function.

### 🚀 `Execute(name)`

Executes the registered `onMount` (if any).

```ts
export const Registries = {}

export function Register(name, fn) {
  console.log('[...:registry:Register]', { name })
  if (typeof fn === 'function') {
    Registries[name] = fn
  }
}

export function Execute(name) {
  console.log('[...:registry:Execute]', { name })
  const onMount = Registries[name]
  if (onMount) onMount()
  else console.warn(`No onMount for "${name}"`)
}
```

---

## 🔄 **Script and Template Loading** (`load.js`)

### 🧠 Features:

* Injects HTML from `pages/` or `includes/`
* Dynamically loads associated `<script>` tags
* Caches HTML in `sessionStorage`
* Supports `onMount` registry execution
* Applies translation and `{key}` replacements

---

### 🧾 `fetchWithCache(path)`

Fetches files using `chrome.runtime.getURL(...)`, caches results in `sessionStorage`.

---

### 🛠️ `LoadScripts(htmlContent, basePath)`

Parses `<!-- script('file') -->` and injects scripts as `<script type="module">`.

---

### 📥 `LoadTemplate(templatePath, options)`

Loads a `templates/<templatePath>/index.html` file, injects it in a target element.

**Options:**

* `element`: where to inject
* `mode`: `"append"` or `"innerHTML"`
* `replacements`: `{ key: value }` to replace in HTML

Executes:

* `applyTranslations`
* associated `script('index')`
* `onMount` from registry
* icon refresh

---

### 📃 `LoadPage(name)`

Loads a full page from `pages/<name>/index.html`, including nested `<!-- include(...) -->`.

* Injects into `#_root`
* Replaces content
* Stores current page in `data-current-page`

---

### 🧩 `LoadIncludes(htmlContent)`

Replaces `<!-- include('name') -->` with HTML from `includes/name/index.html`.

Executes `onMount` from registry if available.

---

### 🔄 `SetCurrentPage(name)` / `GetCurrentPage()`

Stores and retrieves the current page name from the DOM (`#_root[data-current-page]`).

---

## 📂 **Example: Navigation Include**

### `includes/navigation/index.js`

```ts
import { Register } from '../../framework/index.js'
import { logout } from '../../services/index.js'

function onMount() {
  console.log('includes:navigation:onMount')
  const logoutButton = document.getElementById('logoutButton')
  logoutButton?.addEventListener('click', async () => {
    console.log('navigation:logout')
    await logout()
  })
}

Register('includes/navigation', onMount)
```

### `includes/navigation/index.html`

```html
<nav class="navbar">
  <a href="https://www.commandersact.com" target="_blank">
    <img src="images/logo_full.svg" height="48" alt="Logo" />
  </a>
  <button id="logoutButton" class="btn btn-primary">
    {{ locale.buttons.logout }}
  </button>
</nav>

<!-- script('index') -->
```

---

## 🧪 Example Usage

### Load a page:

```ts
await LoadPage('dashboard')
```

### Load a template:

```ts
await LoadTemplate('widgets/infoBox', {
  element: document.getElementById('sidebar'),
  mode: 'append',
  replacements: {
    user: 'Jane Doe',
    date: '2025-07-17',
  }
})
```

### Use the Api:

```ts
const api = new Api({ baseUrl: 'https://example.com/api' })

interface User {
  id: string
  name: string
}

// 0. Caching is enabled by default via `useCache: true`.
//    Since this is the first call to the endpoint, it will fetch fresh data.
const response = await api.get<User>('/user/me')
console.log('fetched me:', response.data)

// 1. A second call to the same endpoint will return the cached response.
const cachedResponse = await api.get<User>('/user/me')
console.log('cached me:', cachedResponse.data)

// 2. Force a fresh request, bypassing the cache using the `reload()` utility.
const freshResponse = await cachedResponse.reload()
console.log('Refetched me:', freshResponse.data)
```