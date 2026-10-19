// RaceLimit Games: a small menu plus three games, one at a time, chosen by the address (#lights,
// #track, #pit) so each game has its own link you can share.
import { mountLights } from "./lights.js?v=mvfw9v6x";
import { mountTrack } from "./track-guess.js?v=mvfw9v6x";
import { mountPit } from "./pitstop.js?v=mvfw9v6x";
import { load } from "./common.js?v=mvfw9v6x";
import { soundButton } from "./sfx.js?v=mvfw9v6x";

const GAMES = {
  lights: { title: "Lights Out", mount: mountLights },
  track: { title: "Guess the Track", mount: mountTrack },
  pit: { title: "Pit Stop Challenge", mount: mountPit },
};

const app = document.getElementById("app");
const crumb = document.getElementById("crumb");
let cleanup = null;

function hub() {
  const lights = load("lights", {});
  const track = load("track.stats", {});
  const pit = load("pit", {});
  // the racing game: your best laps anywhere, and how many circuits you've driven
  let raceBests = 0; try { raceBests = Object.keys(localStorage).filter((k) => k.startsWith("racelimit.games.race.best.")).length; } catch { /* storage blocked */ }
  const ms = (x) => (x / 1000).toFixed(3) + "s";
  app.innerHTML = `<div class="game">
    <div class="hub-intro"><h1>Games</h1><p class="muted">Three quick F1 games, and our racing game.</p></div>
    <div class="cards">
      <a class="card-link" href="#lights">
        <div class="card-art"><div class="mini-lights"><i></i><i></i><i></i><i></i><i></i></div></div>
        <h2>Lights Out</h2>
        <p class="muted small">Five red lights. React the moment they go out, and see how you compare with an F1 driver.</p>
        <div class="card-best">${lights.best ? `Your best: <b>${ms(lights.best)}</b>` : "Not played yet"}</div>
      </a>
      <a class="card-link" href="#track">
        <div class="card-art">${trackArt()}</div>
        <h2>Guess the Track <span class="tag">Daily</span></h2>
        <p class="muted small">A circuit is revealed bit by bit. Name it in as few guesses as you can — a new one every day.</p>
        <div class="card-best">${track.played ? `Played <b>${track.played}</b> · streak <b>${track.streak ?? 0}</b>` : "Not played yet"}</div>
      </a>
      <a class="card-link" href="#pit">
        <div class="card-art">${pitArt()}</div>
        <h2>Pit Stop Challenge</h2>
        <p class="muted small">Stop on your marks, change all four tyres, and release the car. Can you beat an F1 crew?</p>
        <div class="card-best">${pit.best ? `Your best: <b>${(pit.best / 1000).toFixed(2)}s</b>` : "Not played yet"}</div>
      </a>
    </div>
    <a class="card-link race-card" href="../race/">
      <div class="card-art">${raceArt()}</div>
      <div><h2>Race <span class="tag" style="background:#3A2A0A;color:#F2C14E">Early access</span></h2>
      <p class="muted small">Drive a 2026-style F1 car in 3D at all 25 circuits, with their real shapes, hills and pit lanes. Practice, hot laps, pit stops and tyres; AI cars are coming next. Needs a keyboard or a game controller.</p>
      <div class="card-best">${raceBests ? `Lap times set at ${raceBests} circuit${raceBests > 1 ? "s" : ""}` : "Not driven yet"}</div></div>
    </a>
  </div>`;
}

const trackArt = () => `<svg viewBox="0 0 120 80" width="150" height="100" aria-hidden="true"><path d="M14 58 C10 40 22 28 36 30 C48 32 50 18 64 14 C80 10 98 18 104 32 C110 46 96 50 88 46 C78 42 72 52 80 60 C88 68 70 72 56 68 C40 64 20 74 14 58 Z" fill="none" stroke="#1E2430" stroke-width="5"/><path d="M14 58 C10 40 22 28 36 30 C48 32 50 18 64 14" fill="none" stroke="#FFB547" stroke-width="5" stroke-linecap="round"/></svg>`;
const raceArt = () => `<svg viewBox="0 0 120 80" width="150" height="100" aria-hidden="true"><path d="M8 62 L112 62" stroke="#1E2430" stroke-width="10" stroke-linecap="round"/><path d="M20 62 L100 62" stroke="#FFB547" stroke-width="2" stroke-dasharray="6 6"/><rect x="26" y="40" width="64" height="12" rx="6" fill="#FFB547"/><path d="M48 40 Q58 28 68 40" fill="none" stroke="#15171C" stroke-width="3"/><rect x="14" y="42" width="12" height="8" rx="2" fill="#15171C"/><rect x="92" y="38" width="12" height="12" rx="2" fill="#15171C"/>${[[30, 46], [84, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y + 6}" r="8" fill="#15171C" stroke="#2A2F3B" stroke-width="2"/>`).join("")}</svg>`;
const pitArt = () => `<svg viewBox="0 0 120 80" width="150" height="100" aria-hidden="true"><rect x="22" y="30" width="76" height="20" rx="8" fill="#FFB547"/><rect x="92" y="34" width="14" height="12" rx="3" fill="#FFB547"/><rect x="10" y="32" width="12" height="16" rx="2" fill="#FFB547"/>${[[30, 18], [30, 50], [78, 18], [78, 50]].map(([x, y]) => `<rect x="${x}" y="${y}" width="16" height="12" rx="3" fill="#15171C" stroke="#2FD27A" stroke-width="2"/>`).join("")}</svg>`;

function route() {
  cleanup?.();
  cleanup = null;
  const id = location.hash.slice(1);
  const g = GAMES[id];
  crumb.innerHTML = g ? `/ <a href="#">Games</a> / ${g.title}` : "";
  document.title = g ? `${g.title} — RaceLimit Live` : "Games — RaceLimit Live";
  if (!g) { hub(); return; }
  app.innerHTML = "";
  cleanup = g.mount(app) ?? null;
  window.scrollTo(0, 0);
}
soundButton();
addEventListener("hashchange", route);
route();
