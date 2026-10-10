# Yale SOM Virtual: Evans Hall, Floor 2

A first-person walk-through of the 2nd floor of Edward P. Evans Hall (Yale School of Management), built with React, Vite, three.js, and @react-three/fiber.

It includes the blue classroom drums you can walk into, the curvy glass cloister around the courtyard, Ross Library on the west side, the Beinecke Terrace Room and its outdoor terrace on the east side, the small glass meeting rooms, and paintings above the stairwells.

**Walk it in your browser:** https://zlisto.github.io/yale_som_virtual/

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click **Click to walk in**.

**Keyboard + mouse** (works like a PC shooter):

| Key | Action |
| --- | --- |
| W A S D / arrows | walk |
| Mouse | look |
| Shift | sprint |
| Space | jump |
| C | crouch |
| M | toggle map |
| Esc | pause |

**Phone / tablet:** tap **Tap to walk in**. The left-thumb joystick walks (push it all the way to sprint), dragging anywhere else looks around, and there are on-screen jump and pause buttons. On a laptop, click **Use on-screen joystick** to try the phone controls. WASD still works in that mode.

## Chat with the professors (backend)

`backend/` is a Python FastAPI app where every instructor in the Fall 2026 catalog (`data/yale_som.db`) is a PydanticAI agent. Each agent's prompt is built from the database (bio + courses taught) plus `backend/prompts/base.md` and an optional speaking style in `backend/prompts/styles/<professor-id>.md`. Agents can search the whole catalog with tools (`backend/tools.py`). Models run through Portkey (`gpt-6-luna` by default).

Prof. Tauhid Zaman (hoodie, glasses, Labubu on his belt loop) teaches MGT 409 in Blumetti Classroom 2200. Aim the crosshair at him and click to chat (on touch, tap **Talk to Prof. Zaman** when you're close). He turns to face you while you talk. Next door in Allison Foundation Classroom 2210, Prof. Peter Schott (light-blue button-down, sunglasses on his pocket, a 47-page problem set in hand) teaches stats.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

Put `PORTKEY_API_KEY` in `backend/.env` (see `.env.example`) or in a `.env` in a parent folder. Then run the frontend (`npm run dev`) in a second terminal. Set `VITE_API_URL` to use a deployed backend. Conversations are logged to `backend/output/audit_trail.json` (git-ignored).

API: `GET /api/health`, `GET /api/professors`, `GET /api/professors/{id}`, `POST /api/chat`, `POST /api/chat/reset`.

## How it's built

- `src/layout.js`: the floor plan in meters (+x east, -z north). It holds the drums, library, Beinecke, stairs, meeting rooms, wall colliders, and room lookup. Each classroom faces the courtyard, with the whiteboard and podium on the inner side and stadium-seating rows (32 cm risers) stepping up toward the outer wall; its two doors are at the front corners. You climb the center-aisle steps one riser at a time.
- `src/World.jsx`: all the meshes. Walls use instanced boxes and the drums use partial cylinders.
- `src/textures.js`: procedural canvas textures (carpet, navy drum glass, wood slats, mural, signs, stairwell paintings).
- `src/Player.jsx`: walking (pointer lock or touch), jump/crouch, circle-vs-wall collision.
- `src/TouchControls.jsx`: on-screen joystick, drag-to-look, jump and pause buttons.
- `src/Minimap.jsx`: the black-and-pink map in the corner.
- `src/Labubu.jsx`: a customizable Labubu built from primitives: `fur`, `expression` (grin / happy / surprised / sleepy / mischief), `shirt` ('yale', 'stripes', or any color), `pants`, `overalls`, `hat`, `sitting`, `anim`.
- `src/LabubuParty.jsx`: the crew playing in the courtyard plus Labubus in meetings in every glass room.
- `src/slides.js`: lecture slides for eight Fall 2026 MBA courses (MGT 409, 404, 403, 887, 402, 538, 800, 541) on the classroom screens and meeting-room monitors.
- `src/LabubuCrowd.jsx`: 30 seated Labubu students per classroom, drawn with shared instanced meshes.
- `src/Professor.jsx` + `src/Faculty.jsx`: cartoon Hogwarts professors teaching each class (Dumbledore, McGonagall, Trelawney, Slughorn, Lockhart, Moody, Flitwick), plus Hagrid in the courtyard.
- `src/Talker.jsx`, `src/Zaman.jsx`, `src/Schott.jsx`, `src/realProfs.js`, `src/ClickToTalk.jsx`, `src/ChatPanel.jsx`, `src/api.js`: the chat-able real professors (shared talk/turn behavior, avatars, registry), crosshair click-to-talk, the chat window, and the backend client.
- `src/HandsomeDan.jsx`: Handsome Dan touring a loop of 1000 randomly chosen classrooms (blue dot on the map).

The layout is estimated from the wayfinding plan posted on the floor, so room sizes are approximate. The Stair G painting comes from a photo; the other stairwell paintings are made up.

Made for MGT 409: AI Foundations for Managers, Lecture 13.
