(function () {
  "use strict";
  var KEY = "dept-leaderboard-v1";
  var DEPTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "Business", "Design"];
  var SEED = [
    ["Computer Science", "Hackathon", 120], ["Electronics", "Hackathon", 90], ["Design", "Hackathon", 70],
    ["Business", "Quiz Bowl", 100], ["Computer Science", "Quiz Bowl", 60], ["Mechanical", "Quiz Bowl", 80],
    ["Civil", "Cricket", 100], ["Mechanical", "Cricket", 75], ["Electronics", "Cricket", 50],
    ["Design", "Poster Contest", 110], ["Business", "Poster Contest", 65], ["Civil", "Poster Contest", 40]
  ];

  var $ = function (id) { return document.getElementById(id); };
  var entries = load();
  var nextId = entries.reduce(function (m, e) { return Math.max(m, e.id); }, 0) + 1;

  function seedData() {
    return SEED.map(function (s, i) {
      return { id: i + 1, dept: s[0], event: s[1], points: s[2], time: Date.now() - (SEED.length - i) * 3600000 };
    });
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var d = JSON.parse(raw); if (Array.isArray(d)) return d; }
    } catch (e) { /* storage unavailable */ }
    return seedData();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch (e) { /* ignore */ }
  }

  function standings(filter) {
    var totals = {}, counts = {};
    DEPTS.forEach(function (d) { totals[d] = 0; counts[d] = 0; });
    entries.forEach(function (e) {
      if (filter && e.event !== filter) return;
      totals[e.dept] += e.points; counts[e.dept] += 1;
    });
    var list = DEPTS.map(function (d) { return { name: d, pts: totals[d], n: counts[d] }; });
    list.sort(function (a, b) { return b.pts - a.pts || a.name.localeCompare(b.name); });
    var rank = 0, prev = null;
    list.forEach(function (r, i) {
      if (r.pts !== prev) { rank = i + 1; prev = r.pts; }
      r.rank = rank;
    });
    return list;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function renderBoard() {
    var filter = $("filterEvent").value;
    var q = $("search").value.trim().toLowerCase();
    var list = standings(filter);
    var top = Math.max.apply(null, list.map(function (r) { return r.pts; }).concat(1));
    var rows = $("rows");
    rows.textContent = "";
    var shown = list.filter(function (r) { return r.name.toLowerCase().indexOf(q) !== -1; });
    shown.forEach(function (r) {
      var li = el("li", "row" + (r.rank <= 3 && r.pts > 0 ? " r" + r.rank : ""));
      li.appendChild(el("div", "rank", r.rank));
      var name = el("div", "name", r.name);
      name.appendChild(el("small", "", r.n + (r.n === 1 ? " result" : " results")));
      li.appendChild(name);
      li.appendChild(el("div", "pts", r.pts));
      var track = el("div", "track");
      var fill = el("div", "fill");
      fill.style.width = Math.max(0, (r.pts / top) * 100) + "%";
      track.appendChild(fill);
      li.appendChild(track);
      rows.appendChild(li);
    });
    $("empty").hidden = shown.length > 0;
  }

  function renderFilter() {
    var sel = $("filterEvent"), cur = sel.value;
    var names = [];
    entries.forEach(function (e) { if (names.indexOf(e.event) === -1) names.push(e.event); });
    sel.textContent = "";
    var all = el("option", "", "All events"); all.value = ""; sel.appendChild(all);
    names.forEach(function (n) { var o = el("option", "", n); o.value = n; sel.appendChild(o); });
    sel.value = names.indexOf(cur) !== -1 ? cur : "";
  }

  function renderLog() {
    var ul = $("log");
    ul.textContent = "";
    if (!entries.length) { ul.appendChild(el("li", "", "No results yet. Add the first one above.")); return; }
    entries.slice().sort(function (a, b) { return b.time - a.time; }).slice(0, 8).forEach(function (e) {
      var li = el("li");
      var left = el("div");
      left.appendChild(el("b", "", e.dept));
      left.appendChild(el("span", "", e.event));
      var right = el("div");
      right.appendChild(el("span", e.points < 0 ? "minus" : "plus", (e.points > 0 ? "+" : "") + e.points));
      var del = el("button", "del", "\u00d7");
      del.type = "button";
      del.setAttribute("aria-label", "Remove " + e.event + " result for " + e.dept);
      del.addEventListener("click", function () {
        entries = entries.filter(function (x) { return x.id !== e.id; });
        save(); renderAll();
      });
      li.appendChild(left); li.appendChild(right); li.appendChild(del);
      ul.appendChild(li);
    });
  }

  function renderStats() {
    var events = {};
    entries.forEach(function (e) { events[e.event] = 1; });
    $("statDepts").textContent = DEPTS.length;
    $("statEvents").textContent = Object.keys(events).length;
    $("statPoints").textContent = entries.reduce(function (s, e) { return s + e.points; }, 0);
  }

  function renderAll() { renderFilter(); renderBoard(); renderLog(); renderStats(); }

  // Setup
  DEPTS.forEach(function (d) { var o = el("option", "", d); o.value = d; $("dept").appendChild(o); });

  $("form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var msg = $("msg"), event = $("event").value.trim(), pts = parseInt($("points").value, 10);
    msg.className = "msg";
    if (!event) { msg.textContent = "Enter an event name."; $("event").focus(); return; }
    if (isNaN(pts) || pts < -500 || pts > 1000) { msg.textContent = "Points must be a whole number from -500 to 1000."; $("points").focus(); return; }
    entries.push({ id: nextId++, dept: $("dept").value, event: event, points: pts, time: Date.now() });
    save(); renderAll();
    msg.className = "msg ok";
    msg.textContent = "Added " + pts + " points to " + $("dept").value + ".";
    $("event").value = ""; $("points").value = "";
  });

  $("filterEvent").addEventListener("change", renderBoard);
  $("search").addEventListener("input", renderBoard);
  $("reset").addEventListener("click", function () {
    if (confirm("Replace all current results with the sample data?")) {
      entries = seedData(); nextId = entries.length + 1; save(); renderAll();
    }
  });

  renderAll();
})();
