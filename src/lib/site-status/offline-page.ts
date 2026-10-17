// The whole-site screens the proxy serves while /dev has the site killed or
// in maintenance (public.site_status). Plain self-contained HTML, not a
// React page: the root layout (tab bar, splash, app chrome) must not run at
// all, and a page rewrite would still see the original pathname. Colours
// are written out here because no app stylesheet loads — they mirror the
// Plum tokens in globals.css. Both pages re-check every 30 s, so students
// come back on their own when the switch goes off.

export type SiteMode = "live" | "killed" | "maintenance";

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const HEAD = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="30">`;

function killedPage() {
  return `<!doctype html><html lang="en"><head>${HEAD}<title>503 Service Unavailable</title>
<style>
body{margin:0;min-height:100vh;background:#fff;color:#202124;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}
main{max-width:480px;width:100%}
.icon{width:56px;height:56px;margin-bottom:24px;opacity:.55}
h1{font-size:24px;font-weight:500;margin:0 0 12px}
p{margin:0 0 12px;color:#5f6368}
code{display:block;margin-top:24px;font-size:12px;color:#80868b;letter-spacing:.02em;word-break:break-all}
@media (prefers-color-scheme:dark){body{background:#202124;color:#e8eaed}p{color:#9aa0a6}code{color:#80868b}}
</style></head><body><main>
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
<h1>This site can’t be reached</h1>
<p>The server hit a fatal error and stopped responding.</p>
<p>Something went very wrong. Try again later.</p>
<code>ERR_SERVICE_UNAVAILABLE · 503</code>
</main></body></html>`;
}

function maintenancePage(message: string | null) {
  const note = message
    ? `<p class="note">${escapeHtml(message)}</p>`
    : "";
  return `<!doctype html><html lang="en"><head>${HEAD}<title>Back soon · MuteBites</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:#fbf4ee;background-image:radial-gradient(60% 45% at 85% 0%,rgba(192,122,53,.22),transparent 70%),radial-gradient(55% 45% at 0% 100%,rgba(145,73,85,.2),transparent 70%);color:#552c4a;font:16px/1.55 "Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.card{position:relative;overflow:hidden;width:100%;max-width:420px;border-radius:28px;padding:32px 24px 28px;text-align:center;color:#fff7f1;background:radial-gradient(70% 60% at 100% 0%,rgba(192,122,53,.38),transparent 70%),radial-gradient(70% 60% at 0% 100%,rgba(145,73,85,.6),transparent 70%),linear-gradient(160deg,#69324f,#552c4a 55%,#3f2037);box-shadow:0 24px 60px -20px rgba(85,44,74,.55)}
.tile{width:96px;height:96px;margin:0 auto 20px;border-radius:28px;background:#f5eae1;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(255,247,241,.08),0 12px 30px -10px rgba(0,0,0,.4)}
.tile img{width:88%;height:auto}
.eyebrow{display:inline-flex;align-items:center;gap:8px;margin:0 0 12px;padding:6px 14px;border-radius:999px;background:rgba(255,247,241,.12);font-size:13px;font-weight:600;color:#ffd9a8}
.dot{width:8px;height:8px;border-radius:50%;background:#ffd9a8}
h1{margin:0 0 10px;font:700 30px/1.15 Fraunces,Georgia,"Times New Roman",serif}
p{margin:0;color:rgba(255,247,241,.88)}
.note{margin-top:16px;padding:12px 14px;border-radius:16px;background:rgba(255,247,241,.1);color:#fff7f1;font-weight:500}
.bar{margin:24px auto 0;height:6px;max-width:240px;border-radius:999px;background:rgba(255,247,241,.14);overflow:hidden}
.bar span{display:block;height:100%;width:40%;border-radius:inherit;background:linear-gradient(90deg,#e7b0c0,#ffd9a8)}
.tasks{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:20px 0 0;padding:0;list-style:none;font-size:13px}
.tasks li{padding:6px 12px;border-radius:999px;background:rgba(255,247,241,.1);color:#fff7f1}
.foot{margin-top:20px;font-size:13px;color:rgba(255,247,241,.85)}
@media (prefers-reduced-motion:no-preference){
.tile{animation:bob 3s ease-in-out infinite}
.dot{animation:pulse 1.6s ease-in-out infinite}
.bar span{animation:slide 1.8s cubic-bezier(.65,0,.35,1) infinite}
}
@keyframes bob{50%{transform:translateY(-6px) rotate(-2deg)}}
@keyframes pulse{50%{opacity:.35;transform:scale(.8)}}
@keyframes slide{0%{transform:translateX(-110%)}100%{transform:translateX(260%)}}
@media (prefers-color-scheme:dark){body{background:#1d1219;background-image:radial-gradient(60% 45% at 85% 0%,rgba(192,122,53,.16),transparent 70%),radial-gradient(55% 45% at 0% 100%,rgba(145,73,85,.22),transparent 70%)}}
</style></head><body><main class="card">
<div class="tile"><img src="/brand/mark.webp" alt="" width="84" height="84"></div>
<p class="eyebrow"><span class="dot"></span>Under maintenance</p>
<h1>We’re cooking up something new</h1>
<p>MuteBites is getting an update — fixing bugs, polishing menus and making things faster. We’ll be back at the Main Gate very soon.</p>
${note}
<div class="bar" aria-hidden="true"><span></span></div>
<ul class="tasks" aria-label="What we're working on"><li>Fixing bugs</li><li>Updating menus</li><li>Speeding things up</li></ul>
<p class="foot">This page refreshes by itself. Your cart is safe.</p>
</main></body></html>`;
}

export function offlineResponse(mode: Exclude<SiteMode, "live">, message: string | null) {
  const html = mode === "killed" ? killedPage() : maintenancePage(message);
  return new Response(html, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": "60",
    },
  });
}
