(() => {
  const MAX_N = 80;
  const START_CAP = 26;
  const LOAD = 0.75;
  const TREEIFY_LEN = 8;
  const TREEIFY_SIZE = 64;
  const CHAIN_VISIBLE = 12;
  const WALK_MS = 280;

  const $ = (id) => document.getElementById(id);
  const keyCount = $("keyCount");
  const keyCountOut = $("keyCountOut");
  const hashMode = $("hashMode");
  const treeify = $("treeify");
  const lookupKey = $("lookupKey");
  const lookupBtn = $("lookupBtn");
  const stepBtn = $("stepBtn");
  const rebuildBtn = $("rebuildBtn");
  const bucketStrip = $("bucketStrip");
  const stageCaption = $("stageCaption");
  const tableMeta = $("tableMeta");
  const hotTitle = $("hotTitle");
  const hotKind = $("hotKind");
  const hotView = $("hotView");
  const lastOp = $("lastOp");
  const lastSteps = $("lastSteps");
  const longestEl = $("longest");
  const bigO = $("bigO");
  const callout = $("callout");
  const chart = $("chart");
  const lessonAsk = $("lessonAsk");
  const lessonBody = $("lessonBody");
  const lessonDo = $("lessonDo");
  const lessonSaw = $("lessonSaw");
  const lessonNext = $("lessonNext");
  const lessonBack = $("lessonBack");
  const lessonProgress = $("lessonProgress");
  const lessonDots = $("lessonDots");

  let table = null;
  let history = [];
  let selectedBucket = 0;
  let animToken = 0;
  let lastInserted = null;
  let lastLanding = -1;
  let lastLookup = null;
  let lastBucketClick = null;
  let lessonIndex = 0;
  let lessonPassed = false;
  let exploring = false;
  let applyingLesson = false;
  const finishedSteps = new Set();

  const START = { n: 8, collide: false, treeifyOn: false };

  const lessons = [
    {
      ask: "You are creating an account",
      body: [
        "You are creating an account and choose the username Maya. Before the site saves it, it must check whether Maya is already taken.",
        "With a million accounts, comparing Maya to every name would freeze the page. Real sites use a method called a hash table: turn the username into a locker letter, then look only in that locker.",
        "This page uses simple math so you can verify it: last letter → locker (a → A, m → M, x → X). Maya, Riya, Priya, and Luca end in a, so locker A. Sam → M. Alex → X. Inside a locker, names are still compared one by one. Real sites use much more complex algorithms on the whole username, then pick a locker. You will not attack a real site; you will watch this small table.",
        "The problem: junk accounts ending in a (fakea, junka, …) pile into locker A with Maya. When you type Maya, the site opens A and asks “is this Maya?” for each name. Four names, four checks; hundreds of junk names, hundreds of checks.",
        "Usernames stay short. What grows is comparison work — processor time. That is an algorithmic-complexity time attack: ordinary-looking inputs forcing the slow path (one stuffed locker) so a single check takes far too long.",
      ],
      do: "Click A. You should see Maya, Riya, Priya, and Luca. Optional: click X for Alex. Then Next.",
      read: true,
      setup: START,
      teach: "buckets",
      show: ["table", "inside"],
    },
    {
      ask: "Keys and buckets",
      body: [
        "In a hash table, each stored username is a key. Each square on the grid is a bucket—a slot where keys sit. A hash function runs an algorithm on the username and uses that result to pick which bucket the key goes to.",
        "The slider on the left is how many usernames are in the table right now (8).",
      ],
      do: [
        "Step 1 used letters on each square so you could follow last-letter math. Here the squares use numbers (0, 1, 2, …)—that is how real hash tables label buckets.",
        "On the grid to the right, on each square:",
        "The top number is which bucket that square is.",
        "The bottom number is how many keys are inside that bucket.",
        "Click a square whose bottom number is greater than 0, read the usernames inside, then click Next.",
      ],
      read: true,
      setup: START,
      teach: "buckets",
      show: ["table", "inside", "keys"],
    },
    {
      ask: "What is a collision?",
      body: [
        "Sometimes two different usernames hash to the same bucket number. They are still two people. They just landed in the same bucket. That is a collision.",
        "The site still has to look at each name and ask “is this Maya?” Those yes/no checks are comparisons. Every comparison is a little work for the processor.",
      ],
      do: "Open a bucket whose bottom number is 2 or more. Those keys share one bucket. That is a collision. Then click Next.",
      read: true,
      setup: START,
      teach: "buckets",
      show: ["table", "inside", "keys"],
    },
    {
      ask: "How does a lookup work?",
      body: [
        "When the site checks a username, it does not search every bucket. It runs the hash function, opens that bucket number, and walks the names inside until it finds a match or reaches the end.",
        "The table holds eight names—Maya, Alex, Sam, Riya, …—each lands in a bucket from the hash unless two names collide.",
        "Usernames are case-sensitive—Maya and maya are different keys.",
        "If the line is short, this is cheap. People write that as O(1): about the same cost even if the site has many users, as long as names spread across buckets.",
      ],
      do: "Enter Maya, Alex, Sam, Riya, … and click Look up. Watch the highlight walk that bucket, then read Comparisons.",
      read: true,
      teach: "lookup",
      setup: START,
      show: ["table", "inside", "keys", "lookup", "cost"],
    },
    {
      ask: "Same bucket, different name",
      body: [
        "Jordan and Chen are two different usernames, but the hash function sends both to the same bucket (bucket 20 on this table). That is a collision: same bucket, not the same person.",
        "Inside that bucket the names sit in a line, in the order they were stored—Jordan first, then Chen. A lookup only opens this one bucket; it does not scan the rest of the table.",
        "Look up Jordan: one comparison, a match on the first name. Look up Chen: the walk asks about Jordan first, then Chen—two comparisons. Each ask is one comparison.",
      ],
      do: "Look up Jordan, then Chen. Watch Comparisons show 1, then 2, and open bucket 20 on the grid to see the line order.",
      read: true,
      teach: "lookup",
      setup: START,
      show: ["table", "inside", "keys", "lookup", "cost"],
    },
    {
      ask: "What if every key lands in one bucket?",
      body: [
        "An attacker can choose usernames so every one hashes to the same bucket. The table still has many bucket numbers, but every key piles into bucket 0 and the rest stay empty.",
        "This page is now simulating that attack: every key is forced into a single bucket, the way colliding attack keys behave in a real hash-table DoS.",
        "More buckets do not help—the hash always picks the same one. The fast table becomes one long line.",
      ],
      do: "Look at the grid. Bucket 0 should hold every username; every other bucket should show 0 on the bottom. Then click Next.",
      read: true,
      setup: { n: 8, collide: true, treeifyOn: false },
      teach: "buckets",
      show: ["table", "inside", "keys"],
    },
    {
      ask: "Why does the work explode?",
      body: [
        "With every key in bucket 0, each new insert walks the whole line to see if the name is already there, then adds it at the end.",
        "Insert 1 is cheap. Insert 2 compares once. Insert 40 compares 40 times. Add that up and the total work shoots up—about n² / 2 comparisons for n attack keys. That is the time attack on a line.",
      ],
      do: "This step simulates 40 attack keys in bucket 0 as a line (tree mode off). Read Comparisons, Longest bucket, and the chart—each new key costs more than the last.",
      read: true,
      teach: "buckets",
      show: ["table", "inside", "keys", "cost", "chart"],
      setup: { n: 40, collide: true, treeifyOn: false },
    },
    {
      ask: "When does Java switch to a tree?",
      body: [
        "After 2011, Java could reorganize a crowded bucket from a line into a tree—fewer jumps to reach a name instead of comparing every entry in order.",
        "You will not always see a tree. In this simulation, with attack keys still piled in bucket 0 and Java’s tree mode on: if How many keys is below 64, bucket 0 stays a line; at 64 or more, bucket 0 becomes a tree. Same attack, different shape—because Java waits until the whole table is large enough before paying the cost to rebuild.",
        "Why 64? Rebuilding into a tree is extra work. Java only does it once the whole table is big enough that the slow line is worth fixing. This page uses 64 as that cutoff.",
        "Compare to the 40-key line step: the last insert there checked about 40 names in bucket 0, and Per-op cost was O(n). With the tree at 64 keys or more, inserts jump through bucket 0 instead of walking every name—Per-op cost becomes O(log n), and Comparisons on the last insert stays much smaller than the key count even at 80 keys.",
        "Use the Cost panel: Comparisons is checks on the last operation; Per-op cost is O(n) on the line, O(log n) on the tree.",
      ],
      do: [
        "At 64 keys, open bucket 0 (tree). Read Cost—O(log n) and a small Comparisons count.",
        "Drag How many keys to 40: bucket 0 is a line again, O(n). Drag to 64 or 80: tree and O(log n) return; at 80, Comparisons should still be far below 80.",
        "Then click Next.",
      ],
      read: true,
      teach: "keyCount",
      show: ["table", "inside", "keys", "cost", "chart"],
      setup: { n: 64, collide: true, treeifyOn: true },
    },
    {
      ask: "Say it in plain words",
      body: [
        "A hash table is a row of buckets. A hash is the bucket number. A collision is two names sharing a bucket. A comparison is one “is this the name?” check.",
        "Ordinary names spread out, so lookups stay cheap. Attack names all share one bucket, so n inserts on a line cost about n² / 2 checks. With Java’s tree mode on, a crowded attack bucket stays a line (O(n) per op) until the table hits 64 keys, then becomes a tree (O(log n) per op); below 64 it is a line again.",
      ],
      do: "Use Back if any sentence is fuzzy.",
      read: true,
      teach: null,
      show: ["table", "inside", "keys", "hash", "treeify", "lookup", "step", "cost", "chart"],
      saw: () =>
        "If you can say those three sentences to someone else, you learned the module’s first hard idea.",
    },
  ];

  const USERNAMES = [
    "Maya",
    "Alex",
    "Sam",
    "Riya",
    "Jordan",
    "Priya",
    "Chen",
    "Luca",
  ];

  function keyAt(i) {
    return USERNAMES[i] || "user" + (i + 1);
  }

  function useLetterLockers() {
    return !exploring && lessonIndex === 0;
  }

  function lockerLabel(i) {
    let n = i;
    let label = "";
    do {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return label;
  }

  function lockerAddress(i) {
    return useLetterLockers() ? lockerLabel(i) : String(i);
  }

  function lastLetterHash(str) {
    const last = str.charAt(str.length - 1).toLowerCase();
    if (last >= "a" && last <= "z") return last.charCodeAt(0) - 97;
    return last.charCodeAt(0);
  }

  function spreadHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h;
  }

  function hashForKey(key) {
    if (useLetterLockers()) return lastLetterHash(key);
    return spreadHash(key);
  }

  function listKeys(bucket) {
    const keys = [];
    let n = bucket.head;
    while (n) {
      keys.push(n.key);
      n = n.next;
    }
    return keys;
  }

  function emptyBin() {
    return { kind: "list", head: null, length: 0 };
  }

  function buildBalanced(sorted) {
    if (!sorted.length) return null;
    const mid = Math.floor(sorted.length / 2);
    return {
      key: sorted[mid],
      left: buildBalanced(sorted.slice(0, mid)),
      right: buildBalanced(sorted.slice(mid + 1)),
    };
  }

  function binarySearch(sorted, key) {
    let lo = 0;
    let hi = sorted.length - 1;
    const path = [];
    let steps = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      steps += 1;
      path.push(sorted[mid]);
      if (sorted[mid] === key) {
        return { steps, found: true, path };
      }
      if (key < sorted[mid]) hi = mid - 1;
      else lo = mid + 1;
    }
    return { steps, found: false, path };
  }

  function createTable(collide, treeifyOn) {
    return {
      collide,
      treeifyOn,
      cap: START_CAP,
      size: 0,
      bins: Array.from({ length: START_CAP }, emptyBin),
    };
  }

  function indexOf(tableState, key) {
    const h = tableState.collide ? 0 : hashForKey(key);
    const cap = tableState.cap;
    return ((h % cap) + cap) % cap;
  }

  function placeQuiet(tableState, key) {
    const idx = indexOf(tableState, key);
    const bucket = tableState.bins[idx];
    if (bucket.kind === "tree") {
      if (!bucket.keys.includes(key)) {
        bucket.keys.push(key);
        bucket.keys.sort();
        bucket.length = bucket.keys.length;
      }
      return idx;
    }
    let n = bucket.head;
    let tail = null;
    while (n) {
      if (n.key === key) return idx;
      tail = n;
      n = n.next;
    }
    const node = { key, next: null };
    if (!tail) bucket.head = node;
    else tail.next = node;
    bucket.length += 1;
    return idx;
  }

  function collectAllKeys(tableState) {
    const keys = [];
    for (const bucket of tableState.bins) {
      if (bucket.kind === "tree") keys.push(...bucket.keys);
      else keys.push(...listKeys(bucket));
    }
    return keys;
  }

  function maybeTreeify(tableState, idx) {
    const bucket = tableState.bins[idx];
    if (!tableState.treeifyOn) return false;
    if (bucket.kind === "tree") return false;
    if (bucket.length <= TREEIFY_LEN) return false;
    if (tableState.size < TREEIFY_SIZE) return false;
    const keys = listKeys(bucket).slice().sort();
    tableState.bins[idx] = { kind: "tree", keys, length: keys.length };
    return true;
  }

  function resize(tableState) {
    const keys = collectAllKeys(tableState);
    tableState.cap *= 2;
    tableState.bins = Array.from({ length: tableState.cap }, emptyBin);
    for (const key of keys) placeQuiet(tableState, key);
    if (tableState.treeifyOn && tableState.size >= TREEIFY_SIZE) {
      for (let i = 0; i < tableState.cap; i++) maybeTreeify(tableState, i);
    }
  }

  function insertKey(tableState, key) {
    let idx = indexOf(tableState, key);
    let bucket = tableState.bins[idx];
    let treeified = false;

    if (bucket.kind === "tree") {
      const result = binarySearch(bucket.keys, key);
      if (result.found) {
        return {
          steps: result.steps,
          added: false,
          found: true,
          index: idx,
          path: result.path,
          treeified: false,
        };
      }
      bucket.keys.push(key);
      bucket.keys.sort();
      bucket.length = bucket.keys.length;
      tableState.size += 1;
      if (tableState.size > tableState.cap * LOAD) resize(tableState);
      idx = indexOf(tableState, key);
      return {
        steps: result.steps + 1,
        added: true,
        found: false,
        index: idx,
        path: result.path,
        treeified: false,
      };
    }

    let steps = 0;
    const path = [];
    let node = bucket.head;
    let tail = null;
    while (node) {
      steps += 1;
      path.push(node.key);
      if (node.key === key) {
        return {
          steps,
          added: false,
          found: true,
          index: idx,
          path,
          treeified: false,
        };
      }
      tail = node;
      node = node.next;
    }

    const fresh = { key, next: null };
    if (!tail) bucket.head = fresh;
    else tail.next = fresh;
    bucket.length += 1;
    tableState.size += 1;
    steps += 1;

    if (tableState.size > tableState.cap * LOAD) resize(tableState);
    idx = indexOf(tableState, key);
    treeified = maybeTreeify(tableState, idx);

    return {
      steps,
      added: true,
      found: false,
      index: idx,
      path: path.concat(key),
      treeified,
    };
  }

  function lookupInTable(tableState, key) {
    const idx = indexOf(tableState, key);
    const bucket = tableState.bins[idx];
    if (bucket.kind === "tree") {
      const result = binarySearch(bucket.keys, key);
      return { ...result, index: idx, kind: "tree" };
    }
    let steps = 0;
    const path = [];
    let node = bucket.head;
    while (node) {
      steps += 1;
      path.push(node.key);
      if (node.key === key) {
        return { steps, found: true, path, index: idx, kind: "list" };
      }
      node = node.next;
    }
    return { steps, found: false, path, index: idx, kind: "list" };
  }

  function bucketKeys(bucket) {
    return bucket.kind === "tree" ? bucket.keys.slice() : listKeys(bucket);
  }

  function hottestIndex(tableState) {
    let best = 0;
    for (let i = 1; i < tableState.bins.length; i++) {
      if (tableState.bins[i].length > tableState.bins[best].length) best = i;
    }
    return best;
  }

  function currentSettings() {
    return {
      n: Number(keyCount.value),
      collide: hashMode.value === "collide",
      treeifyOn: treeify.checked,
    };
  }

  function fillTable(n, collide, treeifyOn) {
    const next = createTable(collide, treeifyOn);
    const cost = [];
    let cumulative = 0;
    for (let i = 0; i < n; i++) {
      const result = insertKey(next, keyAt(i));
      cumulative += result.steps;
      cost.push({ n: i + 1, steps: result.steps, cumulative });
    }
    table = next;
    history = cost;
    lastInserted = n > 0 ? keyAt(n - 1) : null;
    lastLanding = n > 0 ? indexOf(table, lastInserted) : -1;
    selectedBucket = hottestIndex(table);
    return cost[cost.length - 1] || { steps: 0 };
  }

  function setCallout() {
    if (!table) {
      callout.hidden = true;
      return;
    }
    if (!exploring && lessonIndex < 7) {
      callout.hidden = true;
      return;
    }
    const hot = table.bins[selectedBucket];
    const collide = table.collide;
    const listLong = hot.kind === "list" && hot.length > TREEIFY_LEN;
    const blocked =
      table.treeifyOn && listLong && table.size < TREEIFY_SIZE;
    const grown = hot.kind === "tree";

    if (blocked) {
      callout.hidden = false;
      callout.dataset.tone = "warn";
      callout.textContent =
        "Tree mode is on, but bucket 0 is still a line—the table has " +
        table.size +
        " keys. In this simulation, Java waits until the table reaches 64 keys before it replaces the line with a tree.";
      return;
    }
    if (grown) {
      callout.hidden = false;
      callout.dataset.tone = "good";
      callout.textContent =
        "Bucket 0 is a tree now. Searches use a few jumps instead of walking every name in the line.";
      return;
    }
    if (collide && hot.kind === "list" && hot.length > 1) {
      callout.hidden = false;
      callout.dataset.tone = "";
      callout.textContent =
        "2011 design: colliding keys stay in one linked list. Extra buckets do not help when every hashCode() is the same. n inserts cost about n² / 2 comparisons.";
      return;
    }
    if (!collide && table.size >= 2) {
      callout.hidden = false;
      callout.dataset.tone = "good";
      callout.textContent =
        "Ordinary usernames spread across lockers, so each line stays short.";
      return;
    }
    callout.hidden = true;
  }

  function complexityLabel() {
    const hot = table.bins[selectedBucket];
    if (hot.kind === "tree") return "O(log n)";
    if (hot.length <= 2) return "O(1)";
    return "O(n)";
  }

  function renderStageCaption() {
    if (!stageCaption) return;
    if (useLetterLockers()) {
      stageCaption.textContent =
        "These lockers hold usernames the site already has, like Maya and Alex. Top letter: which locker (step 1 teaching labels). Bottom number: how many names are inside. Click a locker to open it.";
      return;
    }
    stageCaption.textContent =
      "Bucket numbers 0, 1, 2, … on each square. Click a square to open it.";
  }

  function renderBuckets(landingIdx) {
    bucketStrip.replaceChildren();
    const maxLen = Math.max(1, ...table.bins.map((b) => b.length));
    table.bins.forEach((bucket, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bucket";
      btn.role = "listitem";
      btn.dataset.hot = String(i === selectedBucket);
      btn.style.setProperty("--heat", String(bucket.length / maxLen));
      if (i === landingIdx) btn.classList.add("landing");
      btn.innerHTML =
        '<span class="idx">' +
        lockerAddress(i) +
        '</span><span class="n">' +
        bucket.length +
        "</span>";
      btn.setAttribute(
        "aria-label",
        "Bucket " + lockerAddress(i) + ", " + bucket.length + " usernames"
      );
      btn.addEventListener("click", () => {
        selectedBucket = i;
        lastBucketClick = i;
        renderHot();
        renderBuckets(-1);
        setCallout();
        bigO.textContent = complexityLabel();
        longestEl.textContent = String(
          Math.max(...table.bins.map((b) => b.length))
        );
        reviewLesson();
      });
      bucketStrip.appendChild(btn);
    });
    const used = table.bins.filter((b) => b.length > 0).length;
    tableMeta.textContent =
      table.size +
      " usernames stored · " +
      used +
      (used === 1 ? " locker in use" : " lockers in use");
  }

  function renderList(keys, highlight) {
    const ol = document.createElement("ol");
    ol.className = "chain";
    const shown = keys.slice(0, CHAIN_VISIBLE);
    shown.forEach((key) => {
      const li = document.createElement("li");
      li.className = "node";
      li.dataset.key = key;
      li.textContent = key;
      if (highlight === key) li.classList.add("just-added");
      ol.appendChild(li);
    });
    if (keys.length > CHAIN_VISIBLE) {
      const more = document.createElement("li");
      more.className = "node overflow";
      more.textContent = "+" + (keys.length - CHAIN_VISIBLE) + " more";
      ol.appendChild(more);
    }
    hotView.replaceChildren(ol);
  }

  function layoutTree(root) {
    const nodes = [];
    function walk(node, depth) {
      if (!node) return;
      walk(node.left, depth + 1);
      nodes.push({ key: node.key, depth, left: node.left, right: node.right });
      walk(node.right, depth + 1);
    }
    walk(root, 0);
    return nodes;
  }

  function renderTree(keys, highlight) {
    const root = buildBalanced(keys);
    const laid = layoutTree(root);
    const maxDepth = laid.reduce((m, n) => Math.max(m, n.depth), 0);
    const width = Math.max(720, laid.length * 22);
    const height = Math.max(160, (maxDepth + 1) * 46 + 20);
    const xFor = new Map(laid.map((n, i) => [n.key, (i + 0.5) * (width / laid.length)]));
    const yFor = (depth) => 18 + depth * 46;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("class", "tree-svg");
    svg.style.height = Math.min(260, height) + "px";

    const childOf = new Map();
    function edges(node) {
      if (!node) return;
      if (node.left) {
        childOf.set(node.left.key, node.key);
        edges(node.left);
      }
      if (node.right) {
        childOf.set(node.right.key, node.key);
        edges(node.right);
      }
    }
    edges(root);

    childOf.forEach((parent, child) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "link");
      line.setAttribute("x1", xFor.get(parent));
      line.setAttribute("y1", yFor(laid.find((n) => n.key === parent).depth));
      line.setAttribute("x2", xFor.get(child));
      line.setAttribute("y2", yFor(laid.find((n) => n.key === child).depth));
      svg.appendChild(line);
    });

    laid.forEach((n) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("class", "tnode");
      c.setAttribute("data-key", n.key);
      c.setAttribute("cx", xFor.get(n.key));
      c.setAttribute("cy", yFor(n.depth));
      c.setAttribute("r", 10);
      if (n.key === highlight) c.classList.add("just-added");
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", xFor.get(n.key));
      t.setAttribute("y", yFor(n.depth) + 3);
      t.textContent = n.key.length > 4 ? n.key.slice(0, 4) : n.key;
      g.appendChild(c);
      g.appendChild(t);
      svg.appendChild(g);
    });

    hotView.replaceChildren(svg);
  }

  function renderHot(highlight) {
    const bucket = table.bins[selectedBucket];
    const keys = bucketKeys(bucket);
    hotTitle.textContent =
      (useLetterLockers() ? "Usernames in locker " : "Usernames in bucket ") +
      lockerAddress(selectedBucket);
    hotKind.textContent =
      bucket.kind === "tree"
        ? keys.length + " usernames in a tree"
        : keys.length +
          (keys.length === 1 ? " username in a line" : " usernames in a line");
    if (bucket.kind === "tree") renderTree(keys, highlight);
    else renderList(keys, highlight);
  }

  function drawChart() {
    const w = 720;
    const h = 220;
    const pad = { l: 46, r: 16, t: 14, b: 28 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    const maxN = Math.max(1, history.length);
    const maxY = Math.max(8, ...history.map((p) => p.cumulative));
    const x = (n) => pad.l + ((n - 1) / Math.max(1, maxN - 1)) * innerW;
    const y = (v) => pad.t + innerH - (v / maxY) * innerH;

    while (chart.firstChild) chart.removeChild(chart.firstChild);

    [0.25, 0.5, 0.75, 1].forEach((f) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "chart-grid");
      line.setAttribute("x1", pad.l);
      line.setAttribute("x2", w - pad.r);
      line.setAttribute("y1", y(maxY * f));
      line.setAttribute("y2", y(maxY * f));
      chart.appendChild(line);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "chart-label");
      label.setAttribute("x", 8);
      label.setAttribute("y", y(maxY * f) + 3);
      label.textContent = String(Math.round(maxY * f));
      chart.appendChild(label);
    });

    const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axis.setAttribute("class", "chart-axis");
    axis.setAttribute("x1", pad.l);
    axis.setAttribute("x2", w - pad.r);
    axis.setAttribute("y1", h - pad.b);
    axis.setAttribute("y2", h - pad.b);
    chart.appendChild(axis);

    if (!history.length) return;

    const d = history
      .map((p, i) => (i === 0 ? "M" : "L") + x(p.n) + " " + y(p.cumulative))
      .join(" ");
    const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
    area.setAttribute("class", "chart-area");
    area.setAttribute(
      "d",
      d +
        " L " +
        x(history[history.length - 1].n) +
        " " +
        y(0) +
        " L " +
        x(history[0].n) +
        " " +
        y(0) +
        " Z"
    );
    chart.appendChild(area);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "chart-line");
    path.setAttribute("d", d);
    chart.appendChild(path);

    const last = history[history.length - 1];
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("class", "chart-dot");
    dot.setAttribute("cx", x(last.n));
    dot.setAttribute("cy", y(last.cumulative));
    dot.setAttribute("r", 3.5);
    chart.appendChild(dot);

    const xlab = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xlab.setAttribute("class", "chart-label");
    xlab.setAttribute("x", w - pad.r);
    xlab.setAttribute("y", h - 8);
    xlab.setAttribute("text-anchor", "end");
    xlab.textContent = "keys →  " + last.n + "    steps " + last.cumulative;
    chart.appendChild(xlab);
  }

  function updateStats(op, steps) {
    lastOp.textContent = op;
    lastSteps.textContent = String(steps);
    longestEl.textContent = String(Math.max(0, ...table.bins.map((b) => b.length)));
    bigO.textContent = complexityLabel();
    setCallout();
  }

  function paint(op, steps, opts = {}) {
    keyCountOut.textContent = String(table.size);
    renderStageCaption();
    renderBuckets(opts.landing ?? -1);
    renderHot(opts.highlight);
    drawChart();
    updateStats(op, steps);
    if (!applyingLesson) reviewLesson();
  }

  function lessonState() {
    const hot = table ? table.bins[selectedBucket] : { kind: "list", length: 0 };
    return {
      n: table ? table.size : 0,
      collide: table ? table.collide : false,
      treeifyOn: table ? table.treeifyOn : false,
      hotKind: hot.kind,
      hotLen: hot.length,
      lastSteps: Number(lastSteps.textContent),
      cumulative: history.length ? history[history.length - 1].cumulative : 0,
      lastLookup,
      lastBucketClick,
    };
  }

  function applyLessonSetup(setup) {
    if (!setup) return;
    applyingLesson = true;
    hashMode.value = setup.collide ? "collide" : "distributed";
    treeify.checked = !!setup.treeifyOn;
    keyCount.value = String(setup.n);
    keyCountOut.textContent = String(setup.n);
    rebuild("Lesson");
    applyingLesson = false;
  }

  function highlightTeach(name) {
    document.querySelectorAll("[data-teach]").forEach((el) => {
      el.classList.toggle("teach-target", !!name && el.dataset.teach === name);
    });
  }

  function applyReveal(step) {
    const show = new Set(
      step && step.show
        ? step.show
        : ["table", "inside", "keys", "hash", "treeify", "lookup", "step", "cost", "chart"]
    );
    document.querySelectorAll("[data-show]").forEach((el) => {
      const flags = el.dataset.show.split(/\s+/);
      el.hidden = !flags.some((flag) => show.has(flag));
    });
    document.querySelector(".lab").classList.toggle("table-only", !show.has("keys"));
  }

  function isReadStep(step) {
    return !step.check || step.read;
  }

  function showStep(index) {
    const step = lessons[index];
    const already = finishedSteps.has(index);
    lessonIndex = index;
    exploring = false;
    lastLookup = null;
    lastBucketClick = already ? selectedBucket : null;
    const setup = already && step.review ? step.review : step.setup;
    applyLessonSetup(setup);
    lessonPassed = already || isReadStep(step);
    if (isReadStep(step)) finishedSteps.add(index);
    renderLesson();
  }

  function setLessonDo(content) {
    lessonDo.replaceChildren();
    const lines = Array.isArray(content) ? content : [content];
    lines.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      lessonDo.appendChild(p);
    });
  }

  function renderLesson() {
    const step = lessons[lessonIndex];
    const last = lessonIndex === lessons.length - 1;
    lessonProgress.textContent = exploring
      ? "Explore"
      : "Step " + (lessonIndex + 1) + " of " + lessons.length;
    lessonAsk.textContent = exploring
      ? "Your table. Ask your own questions."
      : step.ask;
    lessonBody.replaceChildren();
    const paras = exploring
      ? [
          "Change one control at a time. Before you move it, guess what will happen to Comparisons.",
          "If a word is fuzzy — key, hash, bucket, collision — use Back and reread that step.",
        ]
      : step.body || [];
    paras.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      lessonBody.appendChild(p);
    });
    setLessonDo(
      exploring
        ? "Look up a key in Attack mode, then switch back to Ordinary keys and look up the same key."
        : step.do
    );
    lessonDots.replaceChildren();
    lessons.forEach((_, i) => {
      const li = document.createElement("li");
      if (exploring || finishedSteps.has(i)) li.className = "done";
      if (!exploring && i === lessonIndex) li.className = "now";
      li.title = "Step " + (i + 1);
      li.addEventListener("click", () => {
        if (exploring || i === lessonIndex) return;
        const canGo =
          i < lessonIndex ||
          finishedSteps.has(i) ||
          (i === lessonIndex + 1 && (finishedSteps.has(lessonIndex) || isReadStep(step)));
        if (canGo) showStep(i);
      });
      lessonDots.appendChild(li);
    });
    applyReveal(exploring ? null : step);
    highlightTeach(exploring ? null : step.teach);
    renderStageCaption();
    if (table) {
      renderBuckets(-1);
      renderHot();
    }
    lessonBack.hidden = exploring || lessonIndex === 0;
    if (exploring) {
      lessonSaw.hidden = true;
      lessonNext.textContent = "Start lesson over";
      lessonNext.hidden = false;
      lessonNext.disabled = false;
      return;
    }
    if (last && (lessonPassed || isReadStep(step))) {
      if (step.saw) {
        lessonSaw.hidden = false;
        lessonSaw.textContent = step.saw(lessonState());
      } else {
        lessonSaw.hidden = true;
      }
      lessonNext.textContent = "Start lesson over";
      lessonNext.hidden = false;
      lessonNext.disabled = false;
      return;
    }
    if (lessonPassed) {
      if (step.saw) {
        lessonSaw.hidden = false;
        lessonSaw.textContent = step.saw(lessonState());
      } else {
        lessonSaw.hidden = true;
      }
      lessonNext.textContent = "Next";
      lessonNext.hidden = false;
      lessonNext.disabled = false;
    } else {
      const state = lessonState();
      if (step.check && state.lastLookup && !state.lastLookup.found) {
        lessonSaw.hidden = false;
        lessonSaw.textContent =
          "That was a miss, so Next stays off. Names are case-sensitive—use Maya, not maya, and pick a name that is in the table.";
      } else {
        lessonSaw.hidden = true;
      }
      lessonNext.textContent = "Next";
      lessonNext.hidden = false;
      lessonNext.disabled = !!step.check;
    }
  }

  function reviewLesson() {
    if (exploring || lessonPassed) return;
    const step = lessons[lessonIndex];
    if (!step.check) return;
    if (!step.check(lessonState())) return;
    lessonPassed = true;
    finishedSteps.add(lessonIndex);
    renderLesson();
  }

  function goNextLesson() {
    if (lessonNext.disabled) return;
    if (exploring || lessonIndex === lessons.length - 1) {
      finishedSteps.clear();
      lastBucketClick = null;
      showStep(0);
      return;
    }
    finishedSteps.add(lessonIndex);
    showStep(lessonIndex + 1);
  }

  function goPrevLesson() {
    if (exploring || lessonIndex === 0) return;
    showStep(lessonIndex - 1);
  }

  function rebuild(op = "Rebuild") {
    animToken += 1;
    const { n, collide, treeifyOn } = currentSettings();
    const last = fillTable(n, collide, treeifyOn);
    keyCount.value = String(n);
    paint(op + " · " + n + " keys", last.steps, {
      landing: lastLanding,
      highlight: lastInserted,
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function markNodes(keys, cls) {
    keys.forEach((key) => {
      hotView.querySelectorAll('[data-key="' + CSS.escape(key) + '"]').forEach((el) => {
        el.classList.add(cls);
      });
    });
  }

  function clearMarks() {
    hotView.querySelectorAll(".walking, .found, .missed").forEach((el) => {
      el.classList.remove("walking", "found", "missed");
    });
  }

  async function playWalk(path, found) {
    const token = ++animToken;
    clearMarks();
    lastSteps.textContent = "0";
    for (let i = 0; i < path.length; i++) {
      if (token !== animToken) return;
      clearMarks();
      markNodes(path.slice(0, i + 1), "walking");
      lastSteps.textContent = String(i + 1);
      await sleep(WALK_MS);
    }
    if (token !== animToken) return;
    clearMarks();
    if (found) markNodes(path.slice(-1), "found");
    else markNodes(path, "missed");
  }

  async function onLookup() {
    if (!table) return;
    const raw = lookupKey.value.trim();
    if (!raw) {
      lookupKey.focus();
      return;
    }
    const key = raw;
    const result = lookupInTable(table, key);
    selectedBucket = result.index;
    renderBuckets(-1);
    renderHot();
    updateStats(
      result.found ? "Lookup hit · " + key : "Lookup miss · " + key,
      0
    );
    lastSteps.textContent = "0";
    await playWalk(result.path, result.found);
    if (result.found) {
      lastOp.textContent = "Lookup hit · " + key;
    } else {
      lastOp.textContent = "Lookup miss · " + key;
    }
    lastSteps.textContent = String(result.steps);
    lastLookup = { key, steps: result.steps, found: result.found };
    reviewLesson();
  }

  function stepInsert() {
    if (Number(keyCount.value) >= MAX_N && table && table.size >= MAX_N) return;
    const n = Math.min(MAX_N, Number(keyCount.value) + 1);
    keyCount.value = String(n);
    keyCountOut.textContent = String(n);
    const collide = hashMode.value === "collide";
    const treeifyOn = treeify.checked;
    const nextKey = keyAt(n - 1);

    if (!table || table.collide !== collide || table.treeifyOn !== treeifyOn) {
      fillTable(n - 1, collide, treeifyOn);
    } else if (table.size !== n - 1) {
      fillTable(n - 1, collide, treeifyOn);
    }

    const result = insertKey(table, nextKey);
    const cumulative =
      (history[history.length - 1]?.cumulative || 0) + result.steps;
    history.push({ n, steps: result.steps, cumulative });
    lastInserted = nextKey;
    lastLanding = result.index;
    selectedBucket = result.index;
    animToken += 1;
    paint(
      result.treeified
        ? "Insert " + nextKey + " · treeified"
        : "Insert " + nextKey,
      result.steps,
      { landing: result.index, highlight: nextKey }
    );
  }

  keyCount.addEventListener("input", () => {
    keyCountOut.textContent = keyCount.value;
    rebuild("Slider");
  });
  hashMode.addEventListener("change", () => rebuild("Hashing"));
  treeify.addEventListener("change", () => rebuild("Structure"));
  rebuildBtn.addEventListener("click", () => rebuild("Rebuild"));
  stepBtn.addEventListener("click", stepInsert);
  lookupBtn.addEventListener("click", onLookup);
  lookupKey.addEventListener("keydown", (event) => {
    if (event.key === "Enter") onLookup();
  });
  lessonNext.addEventListener("click", goNextLesson);
  lessonBack.addEventListener("click", goPrevLesson);

  showStep(0);
})();
