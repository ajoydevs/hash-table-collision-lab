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
        "You are creating an account on a website. Next you choose a username. You type Maya.",
        "Before the site can save the account, it has to check whether Maya is already taken. If it has a million accounts and it compares Maya to every one of them — Maya vs Alex, Maya vs Sam, Maya vs Riya… — the page would sit there spinning. So real sites do not walk the whole list. They use a method called a hash table. It turns the username into a locker letter and looks only in that locker.",
        "Here is the math this page uses so you can see the rule. Take the last letter of the username. That letter is the locker: a → locker A, b → locker B, m → locker M, x → locker X. Maya, Riya, Priya, and Luca all end in a, so they share locker A. Sam ends in m, so locker M. Alex ends in x, so locker X. The site still compares the names one by one inside that locker.",
        "This last-letter math is not real life. In real life, websites use much more complex algorithms. Their hash function runs heavier math on the whole username — every letter, not just the last one — and then folds that number into a locker. We use last letter here so you can check the answer yourself. You will not attack a real site. You will watch this small table.",
        "Here is the problem. Those four names already sit in locker A. Now imagine junk accounts that also end in a — fakea, junka, namea. They land in locker A too.",
        "When you type Maya, the site opens locker A and asks one name at a time: is this Maya? Four names means four checks. Hundreds of junk names in that one locker means hundreds of checks — just to create one account.",
        "Maya is still four letters. The junk names can be short too. The usernames stay small. What gets big is the work: how many times the algorithm has to compare. That work is time on the processor.",
        "That extra work is an algorithmic-complexity time attack. Complexity means how the work grows. Time means the processor is busy. The attack is ordinary-looking usernames that force the slow path — one stuffed locker — so “is Maya taken?” takes far too long.",
      ],
      do: "Click the square with A on top. That is locker A. You should see Maya, Riya, Priya, and Luca — they all end in a. Then click X if you want to see Alex. Then click Next.",
      read: true,
      setup: START,
      teach: "buckets",
      show: ["table", "inside"],
    },
    {
      ask: "Those usernames are keys",
      body: [
        "The site already has a list of taken usernames: Maya, Alex, Sam, Riya, and a few more. Each stored username is called a key. Maya is a key. So is Alex.",
        "The slider on the left is how many taken usernames are in the lockers right now. It is 8. The number at the bottom of a square is how many of those names sit in that locker. Add the bottom numbers and you get 8.",
      ],
      do: "Find Maya in a locker. She is one of the 8 taken usernames. Then click Next.",
      read: true,
      setup: START,
      teach: "keyCount",
      show: ["table", "inside", "keys"],
    },
    {
      ask: "What is a bucket?",
      body: [
        "When the site checks Maya, it does not search every username. It sends her key to a locker. Each square in the grid is one of those lockers. In the textbook they are called buckets.",
        "The small letter on top is the locker address. The number on the bottom is how many usernames already sit in that locker. A hash function is the math that turns a key into that locker letter.",
      ],
      do: "Click a square whose bottom number is greater than 0. That opens the locker so you can see the usernames inside.",
      teach: "buckets",
      setup: START,
      show: ["table", "inside", "keys"],
      check: (s) => s.lastBucketClick != null && s.hotLen > 0,
      saw: (s) =>
        "You clicked locker " +
        lockerLabel(s.lastBucketClick) +
        ". That letter is only its address — the hash sent these names here. Inside it you can see the " +
        s.hotLen +
        " username(s) sitting in that locker.",
    },
    {
      ask: "What is a collision?",
      body: [
        "Sometimes two different usernames get the same locker letter. They are still two people. They just landed in the same locker. That is a collision.",
        "The site still has to look at each name and ask “is this Maya?” Those yes/no checks are comparisons. Every comparison is a little work for the processor.",
      ],
      do: "Open a locker whose bottom number is 2 or more. Those usernames share one locker. That is a collision. Then click Next.",
      read: true,
      setup: START,
      teach: "buckets",
      show: ["table", "inside", "keys"],
    },
    {
      ask: "How does a lookup work?",
      body: [
        "When the site checks Maya, it does not search every locker. It turns Maya into a locker letter (A), opens that locker, and walks the usernames inside it.",
        "If the line is short, this is cheap. People write that as O(1): about the same cost even if the site has many users — as long as names spread across lockers.",
      ],
      do: "Click Maya. Watch the highlight walk the line. Read Comparisons.",
      teach: "lookup",
      setup: START,
      show: ["table", "inside", "keys", "lookup", "cost"],
      check: (s) => s.lastLookup && s.lastLookup.key === "Maya" && s.lastLookup.found,
      saw: (s) =>
        "The site checked " +
        s.lastLookup.steps +
        " username(s) and stopped. That is the cheap case: Maya was easy to find.",
    },
    {
      ask: "Same locker, different name",
      body: [
        "Now check Alex. If Alex shares Maya’s locker, the walk has to pass Maya first. If Alex is in a different locker, the site opens that locker instead. Either way, a comparison is one “is this the name?” check.",
      ],
      do: "Click Alex. Count Comparisons again.",
      teach: "lookup",
      show: ["table", "inside", "keys", "lookup", "cost"],
      check: (s) => s.lastLookup && s.lastLookup.key === "Alex" && s.lastLookup.found,
      saw: (s) =>
        "Now it checked " +
        s.lastLookup.steps +
        " names. A collision is a shared locker, not a shared identity.",
    },
    {
      ask: "What if every key gets the same locker?",
      body: [
        "An attacker can invent names that all hash to one letter. Then every key falls into one locker, and the other lockers sit empty.",
        "More lockers do not help, because the locker letter never changes. The “fast” table becomes one long line.",
      ],
      do: "Open “How keys pick a bucket” and choose Attack keys (all the same bucket).",
      teach: "hashMode",
      setup: START,
      show: ["table", "inside", "keys", "hash"],
      review: { n: 8, collide: true, treeifyOn: false },
      check: (s) => s.collide,
      saw: () =>
        "Look at the grid. One locker holds every key. The rest are 0. That pile is the attack.",
    },
    {
      ask: "Why does the work explode?",
      body: [
        "To add a new key, the table walks the whole line to see if the name is already there, then hangs it on the end.",
        "The 1st key is free. The 2nd checks 1 name. The 3rd checks 2. The 40th checks 40. Add those up: 1+2+…+40 = 820 checks. In math that is about n² / 2. A short list of names, a lot of CPU. That is the time attack.",
      ],
      do: "Drag “How many keys” to 40. Watch Comparisons, Longest bucket, and the chart.",
      teach: "keyCount",
      show: ["table", "inside", "keys", "hash", "cost", "chart"],
      review: { n: 40, collide: true, treeifyOn: false },
      check: (s) => s.collide && s.n >= 40,
      saw: (s) =>
        "The last insert checked " +
        s.lastSteps +
        " names. The longest locker holds " +
        s.hotLen +
        ". Total checks so far: " +
        s.cumulative +
        ". The chart hooks up because each new key is more expensive than the last.",
    },
    {
      ask: "Did Java fix this?",
      body: [
        "After 2011, Java started turning a long locker-line into a tree, which you can search in fewer jumps.",
        "The catch, from class: the tree appears only if that locker has more than 8 keys and the whole table has at least 64 keys. Miss either rule, and it stays a slow line.",
      ],
      do: "Turn on Tree (Java 8). Leave the key count under 64.",
      teach: "treeify",
      show: ["table", "inside", "keys", "hash", "treeify", "cost"],
      setup: { n: 16, collide: true, treeifyOn: false },
      review: { n: 16, collide: true, treeifyOn: true },
      check: (s) =>
        s.treeifyOn && s.n > 8 && s.n < 64 && s.hotKind === "list",
      saw: (s) =>
        "Still a line. The locker is crowded, but the table has only " +
        s.n +
        " keys. The second rule (64 in the table) is not met, so the defense is off.",
    },
    {
      ask: "When does the tree actually appear?",
      body: [
        "Keep the tree switch on. You already have “more than 8 in one locker.” Now give the table 64 keys.",
      ],
      do: "Drag “How many keys” to 64. Watch the line fold into a tree.",
      teach: "keyCount",
      show: ["table", "inside", "keys", "hash", "treeify", "cost", "chart"],
      review: { n: 64, collide: true, treeifyOn: true },
      check: (s) => s.treeifyOn && s.n >= 64 && s.hotKind === "tree",
      saw: () =>
        "Both class rules are true now, so the locker became a tree. Searching it should take a handful of jumps, not 64.",
    },
    {
      ask: "Did the defense actually help?",
      body: [
        "If the tree works, adding even more colliding keys should not make the last insert walk 80 names.",
      ],
      do: "Drag “How many keys” to 80. Read Comparisons for that last insert.",
      teach: "keyCount",
      show: ["table", "inside", "keys", "hash", "treeify", "cost", "chart"],
      review: { n: 80, collide: true, treeifyOn: true },
      check: (s) => s.hotKind === "tree" && s.n >= 75 && s.lastSteps <= 10,
      saw: (s) =>
        "The last insert checked " +
        s.lastSteps +
        " names, not 80. Same attack keys, different shape inside the locker. The defense works — and it only started after 64.",
    },
    {
      ask: "Say it in plain words",
      body: [
        "A hash table is a row of lockers. A hash is the locker letter. A collision is two names sharing a locker. A comparison is one “is this the name?” check.",
        "Ordinary names spread out, so lookups stay cheap. Attack names all share one locker, so n inserts cost about n² / 2 checks, and the CPU dies. Java’s tree only appears after a locker has more than 8 names and the table has at least 64 names.",
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

  function lockerLabel(i) {
    let n = i;
    let label = "";
    do {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return label;
  }

  function lastLetterHash(str) {
    const last = str.charAt(str.length - 1).toLowerCase();
    if (last >= "a" && last <= "z") return last.charCodeAt(0) - 97;
    return last.charCodeAt(0);
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
    const h = tableState.collide ? 0 : lastLetterHash(key);
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
        "Treeify is blocked. This bucket has more than 8 keys, but the map has only " +
        table.size +
        " entries. Module 5 / Chapter 6 also require at least 64 entries.";
      return;
    }
    if (grown) {
      callout.hidden = false;
      callout.dataset.tone = "good";
      callout.textContent =
        "Both class thresholds are met: this bucket has more than 8 keys and the map has at least 64 entries. The bucket is a tree, so further walks are O(log n).";
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
        lockerLabel(i) +
        '</span><span class="n">' +
        bucket.length +
        "</span>";
      btn.setAttribute(
        "aria-label",
        "Locker " + lockerLabel(i) + ", " + bucket.length + " usernames"
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
    hotTitle.textContent = "Usernames in locker " + lockerLabel(selectedBucket);
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
    lessonDo.textContent = exploring
      ? "Look up a key in Attack mode, then switch back to Ordinary keys and look up the same key."
      : step.do;
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
    lessonBack.hidden = exploring || lessonIndex === 0;
    if (exploring) {
      lessonSaw.hidden = true;
      lessonNext.textContent = "Start lesson over";
      lessonNext.hidden = false;
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
    } else {
      lessonSaw.hidden = true;
      lessonNext.hidden = true;
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
    const key = lookupKey.value.trim();
    if (!key) {
      lookupKey.focus();
      return;
    }
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
  document.querySelectorAll("[data-fill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      lookupKey.value = btn.dataset.fill;
      onLookup();
    });
  });
  lessonNext.addEventListener("click", goNextLesson);
  lessonBack.addEventListener("click", goPrevLesson);

  showStep(0);
})();
