# Virtual Assistant (React + Node/Express + MongoDB + Gemini)
 `Virtaul Assistance`   
> This is a full‑stack voice‑enabled personal assistant you can customize with your own name and avatar. Users sign up, set an assistant image/name, then talk to it: the browser listens to your voice, sends your command to the backend, the backend routes the request through a Gemini prompt, and the frontend speaks the response back and/or opens pages (Google/YouTube/social) based on the classified “type”.

---

## ✨ Features

- **User auth (email + password)** with JWT stored in an **HTTP‑only cookie**.
- **Assistant customization:** pick a built‑in avatar or upload your own (stored via **Cloudinary**).
- **Voice input** (Web Speech API) and **text‑to‑speech** playback.
- **Command classification via Gemini** → returns a JSON with `type`, `userInput`, `response`.
- **Action routing** in the frontend:
  - `general`: speak a reply.
  - `google-search`: open a Google search in a new tab.
  - `youtube-search` / `youtube-open`: open YouTube/results.
  - `calculator-open`, `instagram-open`, `facebook-open`.
  - `weather-show`: show/speak weather (UI logic to be implemented as needed).
- **History** of interactions saved with the user.
- Modern **React 19 + Vite + Tailwind** frontend.
- **Express 5 + Mongoose 8** backend, **ES modules**, and **CORS** preconfigured for local dev.

> The exact list of command `type`s and routing lives in **Backend/gemini.js** (prompt) and **Backend/controllers/user.controllers.js** (the `askToAssistant` handler).

---

## 🗂️ Project Structure (top level)

```
Virtaul Assistance/
├─ Backend/            # Express API, JWT auth, Gemini prompt, Cloudinary, MongoDB
└─ Frontend/           # React + Vite app (voice UI, TTS, routing, customization screens)
```

### Backend highlights

- **Entry:** `Backend/index.js`
- **Auth routes:** `POST /api/auth/signup`, `POST /api/auth/signin`, `GET /api/auth/logout`
- **User routes:**  
  - `GET /api/user/current` (auth required)  
  - `POST /api/user/update` (multipart: `assistantImage` + `assistantName`)  
  - `POST /api/user/asktoassistant` (JSON body with command string)
- **MongoDB connection:** `Backend/config/db.js` (uses `process.env.MongoDB_URL`)
- **JWT:** `Backend/config/token.js` (10‑day expiry) + `middlewares/isAuth.js`
- **File upload:** `middlewares/multer.js` → temporary save in `Backend/public/` → `config/cloudinary.js` uploads and returns a secure URL (temp file deleted).
- **Gemini call:** `Backend/gemini.js` reads `process.env.GEMINI_API_URL` and posts:
  ```jsonc
  {
    "contents": [{ "parts": [{ "text": "<prompt composed here>" }] }]
  }
  ```
  and expects the model to return a **stringified JSON** like:
  ```jsonc
  {
    "type": "general" | "google-search" | "youtube-search" | "youtube-open" |
            "calculator-open" | "instagram-open" | "facebook-open" | "weather-show",
    "userInput": "<normalized user command>",
    "response": "<short spoken response>"
  }
  ```

### Frontend highlights

- **Entry:** `Frontend/src/main.jsx`, `Frontend/src/App.jsx`
- **Context:** `Frontend/src/context/UserContext.jsx` → holds `serverUrl`, `userData`, and `getGeminiResponse()`
- **Pages:** `SignUp.jsx`, `SignIn.jsx`, `Customize.jsx`, `Customize2.jsx`, `Home.jsx`
- **Voice UX:** `Home.jsx` uses **SpeechRecognition** (Web Speech API) for listening and **speechSynthesis** for TTS
- **Assets:** `Frontend/src/assets/*` default avatars and animations

---

## ⚙️ Environment Variables

Create a **`Backend/.env`** file with:

```ini
# Server
PORT=8000                 # Frontend expects 8000 by default (see Frontend UserContext)

# Database
MongoDB_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# Auth
JWT_SECRET=super-secret-key

# Gemini
# Full REST endpoint (model + API key), e.g.:
# https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY
GEMINI_API_URL=https://...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

> **Why `PORT=8000`?** The frontend’s `UserContext.jsx` uses `serverUrl = "http://localhost:8000"`. Either set `PORT=8000` in the backend or change that constant to match your backend port.  
> **CORS:** `Backend/index.js` currently allows origin `http://localhost:5173` with `credentials: true`. Update this to your deployed frontend URL in production.

---

## 🚀 Run Locally

### 1) Backend (Node 18+ recommended)

```bash
cd "Virtaul Assistance/Backend"
npm install
# create .env as shown above
npm run dev     # starts with nodemon; default PORT from .env (recommended 8000)
```

### 2) Frontend

```bash
cd "Virtaul Assistance/Frontend"
npm install
npm run dev     # Vite dev server (typically http://localhost:5173)
```

Sign up at `http://localhost:5173`, then customize your assistant (upload or choose an image, and set a name).

> **Browser tips:** Voice features use the **Web Speech API** which is best supported in **Chrome**. For production, serve over **HTTPS** so the microphone permission and speech APIs work reliably.

---

## 🧠 How It Works (Flow)

1. **User speaks** → the browser (Home.jsx) captures speech → transcribes to text.
2. **Frontend calls** `POST /api/user/asktoassistant` with the text.
3. **Backend builds a prompt** (gemini.js) giving the assistant name & creator name and asks Gemini to **return a JSON** with a `type`, `userInput`, and a short `response`.
4. **Frontend routes the action**:
   - If `type === "general"`, it speaks the `response` back.
   - If `type` is a navigation action (e.g., `google-search` / `youtube-open` / `calculator-open` / `instagram-open` / `facebook-open`), it opens a new tab to the appropriate URL.
   - If `type === "weather-show"`, display/speak local weather (requires you to add the weather UI logic or API call).
5. **History** is saved to the user record and shown in the side panel.

---

## 🧪 API Endpoints (Quick Reference)

- `POST /api/auth/signup` – `{ name, email, password }` → sets `token` http‑only cookie  
- `POST /api/auth/signin` – `{ email, password }` → sets `token` http‑only cookie  
- `GET  /api/auth/logout` – clears `token` cookie

- `GET  /api/user/current` – returns current user (no password)  
- `POST /api/user/update` – `multipart/form-data`
  - fields: `assistantName` (text), `assistantImage` (file, optional)
- `POST /api/user/asktoassistant` – `{ command: "<text>" }` (the field name in your frontend context) → `{ type, userInput, response }`

> **Notes:**  
> - JWT expiry is **10 days** (`config/token.js`).  
> - `isAuth` middleware reads `token` from cookies and attaches `req.userId`.  
> - Multer writes files to `Backend/public/` then `cloudinary.js` uploads and deletes the temp file.

---

## 🧩 Customization & Extending

- **Add more command types**: change the prompt in `Backend/gemini.js` and extend the switch logic in `askToAssistant` + frontend routing in `Home.jsx`.
- **Weather**: plug in OpenWeather/WeatherAPI and show a panel when `type === "weather-show"`.
- **Safer CORS & Cookies in prod**: set `sameSite: "None"` and `secure: true` for the auth cookie and whitelist your frontend origin.
- **Fix the folder name**: you can rename to `Virtual-Assistant` (be careful not to break relative paths).

---

## 🌐 Deploy

**Frontend:** Vercel, Netlify, Render Static, or GitHub Pages (needs SPA fallback).  
**Backend:** Render, Railway, Fly.io, or any Node host.  
**Database:** MongoDB Atlas.  
**Assets:** Cloudinary.

1. Set **environment variables** on your host (same keys as `.env` above).  
2. Update **CORS origin** in `Backend/index.js` to your frontend URL.  
3. In the frontend `UserContext.jsx`, set `serverUrl` to your deployed backend URL.  
4. If using cross‑site cookies, ensure HTTPS and `sameSite=None; Secure` cookie options.

---

## ✅ Checklist Before Pushing to GitHub

- [ ] Add this `README.md` to the repo root.  
- [ ] Commit your `.env.example` (but **never** `.env`) with placeholder keys.  
- [ ] Confirm ports: backend `PORT=8000` or update frontend `serverUrl`.  
- [ ] Verify CORS and cookie settings for your deployment domain(s).

---

## 📸 Screenshots / Demo (optional)

Add some images or a short GIF showing: sign‑up → customize → talk to the assistant → response.
<img width="940" height="442" alt="image" src="https://github.com/user-attachments/assets/6ce0b14d-9620-494e-84c1-c47fd655642c" />
<img width="925" height="433" alt="image" src="https://github.com/user-attachments/assets/5b68b9ac-5a16-45c2-a054-1012851cccd1" />





```md
![Home](Frontend/src/assets/image1.png)
![Customize](Frontend/src/assets/image4.png)
```

---

## 🛡️ License

Choose a license (e.g., MIT) and add it here if you plan to open source.

---

## 🙋 Troubleshooting

- **Login works locally but not in prod:** check cookie options (`sameSite`, `secure`) and CORS `origin` + `credentials` on both frontend (Axios) and backend.  
- **Mic or TTS not working:** use Chrome and HTTPS; ensure mic permissions are granted.  
- **Frontend shows 500 on `/current`:** you are not logged in or the `token` cookie is missing/blocked.  
- **Avatar upload fails:** verify Cloudinary envs and that your host has write perms in `Backend/public/` (temp).

---

If you want, I can also generate a **`.env.example`**, and a **deploy guide** tailored for Render/Vercel.
