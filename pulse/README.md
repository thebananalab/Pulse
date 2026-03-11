# Pulse — Digital Brand Diagnostics

Herramienta de auditoria de ecosistema digital para agencias. Analiza senales publicas de cualquier marca y genera un diagnostico completo con roadmap de mejoras en 3 horizontes.

## Stack

- React + Vite (frontend)
- Vercel Serverless Functions (backend / proxy seguro de API)
- Anthropic API con web search

---

## Deploy en Vercel (recomendado)

### 1. Sube el proyecto a GitHub

```bash
git init
git add .
git commit -m "init: pulse v1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/pulse.git
git push -u origin main
```

### 2. Conecta con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesion con GitHub
2. Click en **Add New Project**
3. Importa el repo `pulse`
4. Vercel detecta Vite automaticamente — no toques nada
5. Click en **Deploy**

### 3. Agrega la API key

1. En Vercel, ve a tu proyecto > **Settings** > **Environment Variables**
2. Agrega:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (tu API key de Anthropic)
3. Click **Save**
4. Ve a **Deployments** y haz **Redeploy** para que tome la variable

Tu app estara disponible en `https://pulse-[hash].vercel.app` o en un dominio propio si lo configuras.

---

## Desarrollo local

```bash
# Instala dependencias
npm install

# Crea el archivo de variables de entorno
cp .env.example .env.local
# Edita .env.local y pega tu ANTHROPIC_API_KEY

# Inicia el servidor de desarrollo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

---

## Estructura del proyecto

```
pulse/
├── api/
│   └── analyze.js        # Serverless function — proxy seguro a Anthropic
├── src/
│   ├── App.jsx            # Componente principal
│   └── main.jsx           # Entry point React
├── index.html
├── vite.config.js
├── vercel.json
├── .env.example
└── package.json
```

---

## Personalizar el branding

Para agregar tu logo o cambiar el nombre en el nav, edita `src/App.jsx` — busca la seccion `<nav>`.

Para cambiar colores, edita el objeto `C` al inicio de `src/App.jsx`.
