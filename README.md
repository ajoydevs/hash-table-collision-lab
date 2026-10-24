# How Hash Tables Work

Static teaching lab for **CprE / SE 421, Module 5** (algorithmic-complexity time attacks). One concept: a hash table is cheap when keys spread across buckets, and becomes a **collision-driven complexity attack** when an attacker forces every key into the same bucket.

## Run it

Open [`index.html`](index.html) in a current browser. No server, build step, or API.

Use the **Lesson** card first. It walks from zero (checking whether a username like Maya is taken) through keys, buckets, collisions, lookups, attack mode, growing cost, and Java 8 treeify. The grid on the right is the picture. **Back** / **Next** and the step dots move through the lesson; extra controls unlock for free exploration at the end.

## What it teaches

In 2011, Java, PHP, and Python stored hash collisions in a linked list. Average insert and lookup stay near constant time when keys spread across buckets. If every key hashes to the same value, they pile into one list:

- each new insert walks a longer chain, **O(n)** per operation
- *n* colliding inserts cost about **n² / 2** comparisons

Collision is not identity. Two different usernames can share a bucket; the site still compares them one by one until it finds a match.

Java 8 can turn a long bucket into a tree, but **only** when both Module 5 / Chapter 6 thresholds hold:

1. that bucket has **more than 8** keys
2. the map has **at least 64** entries

Below either line, the bucket stays a list. This page follows those classroom thresholds.

The lab **simulates** a hash table and counts comparisons. It does not time a real runtime or attack a live service.

## Controls (explore mode)

During the lesson, only the controls needed for that step are emphasized. After the lesson, or when exploring:

- **How many keys** (slider, 1–80) — rebuilds the table; try 8, 40, 64, and 80
- **Hashing** (dropdown) — spread keys vs all keys collide (same `hashCode()`)
- **Java 8 tree mode** (toggle) — linked lists vs treeify when thresholds are met
- **Look up a key** — highlight walks the chain or tree; **Comparisons** updates each step
- **Step insert** / **Rebuild** — add the next key with motion, or refill from the slider

The chart plots **counted insert comparisons**, not wall-clock time.

## Repository layout

| File | Role |
|------|------|
| `index.html` | Page structure and copy |
| `styles.css` | Layout and styling |
| `app.js` | Lesson script, simulation, animations |
| `reflection.md` | Team reflection on building and learning from the lab |

Do not commit API keys, tokens, or course lecture PDFs.

## Course context

Built for Sprint 3: AI-assisted development of an interactive visualization that makes one hard idea from the algorithmic-complexity and side-channel module easier to understand. This repo focuses on **hash collision complexity (AC Time)** only.
