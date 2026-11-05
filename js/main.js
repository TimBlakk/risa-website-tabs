(() => {
  const NUMBER = "233241280476";            // WhatsApp number, international format, no + or spaces
  const OPEN_DAYS = [5, 6, 0];              // Fri, Sat, Sun (0 = Sunday)
  const OPEN_MIN = 12 * 60, CLOSE_MIN = 20 * 60;
  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  /* WhatsApp links: pre-fill the message with the category and spice level */
  const heatInputs = document.querySelectorAll('input[name="heat"]');
  const waLinks = document.querySelectorAll("[data-wa]");
  function updateLinks() {
    const heat = document.querySelector('input[name="heat"]:checked').value;
    document.body.dataset.heat = heat.toLowerCase();
    waLinks.forEach(a => {
      const cat = a.dataset.wa;
      const msg = cat
        ? `Hi RISA, I’d like to order from ${cat}. Spice level: ${heat}.`
        : `Hi RISA, I’d like to place an order. Spice level: ${heat}.`;
      a.href = `https://wa.me/${NUMBER}?text=${encodeURIComponent(msg)}`;
      a.target = "_blank"; a.rel = "noopener";
    });
  }
  heatInputs.forEach(i => i.addEventListener("change", updateLinks));
  updateLinks();

  /* Open / closed badge, always calculated in Ghana time */
  function updateStatus() {
    const el = document.getElementById("status");
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Accra", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
      }).formatToParts(new Date()).map(x => [x.type, x.value]));
      const day = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(p.weekday);
      const mins = (+p.hour) * 60 + (+p.minute);
      const openToday = OPEN_DAYS.includes(day);
      el.className = "status";
      if (openToday && mins >= OPEN_MIN && mins < CLOSE_MIN) { el.classList.add("open"); el.textContent = "Open now, delivering until 8pm"; }
      else if (openToday && mins < OPEN_MIN) { el.textContent = "Opens today at 12pm"; }
      else {
        let n = 1; while (!OPEN_DAYS.includes((day + n) % 7)) n++;
        el.textContent = "Opens " + (n === 1 ? "tomorrow" : DAY_NAMES[(day + n) % 7]) + " at 12pm";
      }
    } catch (e) { el.textContent = "Friday to Sunday, 12pm to 8pm"; }
  }
  updateStatus(); setInterval(updateStatus, 60000);


  /* Menu tabs: arrow keys, sliding indicator, fade between panels */
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(t => document.getElementById(t.getAttribute("aria-controls")));
  const list = document.querySelector(".tablist");
  const ind = document.querySelector(".tab-ind");
  let current = 0, busy = false, pending = null;

  function moveIndicator(smooth) {
    const t = tabs[current];
    ind.style.setProperty("--x", t.offsetLeft + "px");
    ind.style.setProperty("--w", t.offsetWidth + "px");
    list.scrollTo({ left: t.offsetLeft - (list.clientWidth - t.offsetWidth) / 2, behavior: smooth && !reduced ? "smooth" : "auto" });
  }
  function keepInView() {
    const top = panels[current].getBoundingClientRect().top;
    if (top < 140) scrollBy({ top: top - 150, behavior: reduced ? "auto" : "smooth" });
  }
  function select(i, focus) {
    if (busy) { pending = i; return; }
    if (focus) tabs[i].focus();
    if (i === current) return;
    const out = panels[current], inn = panels[i];
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", k === i); t.tabIndex = k === i ? 0 : -1; });
    current = i; moveIndicator(true);
    const show = () => {
      out.classList.remove("is-active", "is-leaving");
      inn.classList.add("is-active");
      if (!reduced) { inn.classList.add("is-entering"); inn.offsetHeight; requestAnimationFrame(() => inn.classList.remove("is-entering")); }
      busy = false; keepInView();
      if (pending !== null && pending !== current) { const n = pending; pending = null; select(n); } else pending = null;
    };
    if (reduced) { show(); return; }
    busy = true; out.classList.add("is-leaving"); setTimeout(show, 230);
  }
  tabs.forEach((t, i) => t.addEventListener("click", () => select(i)));
  list.addEventListener("keydown", e => {
    const keys = { ArrowRight: 1, ArrowLeft: -1 };
    let n = null;
    if (e.key in keys) n = (current + keys[e.key] + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0; else if (e.key === "End") n = tabs.length - 1;
    if (n !== null) { e.preventDefault(); select(n, true); }
  });
  addEventListener("resize", () => moveIndicator(false));
  document.fonts && document.fonts.ready.then(() => moveIndicator(false));
  moveIndicator(false);
  /* Load the photos of hidden tabs once the page is ready, so switching never waits */
  addEventListener("load", () => document.querySelectorAll(".panel img[loading=lazy]").forEach(i => { i.loading = "eager"; }));

  /* Gentle parallax on menu photos (skipped for reduced motion) */
  if (!reduced) {
    const shots = [...document.querySelectorAll(".shot")];
    let ticking = false;
    const run = () => {
      const vh = innerHeight;
      shots.forEach(s => {
        const r = s.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > vh) return;
        s.style.setProperty("--p", ((r.top + r.height / 2) / vh - 0.5).toFixed(3));
      });
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }
})();
