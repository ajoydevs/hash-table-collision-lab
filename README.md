# Hash Table Collision Lab

A small static teaching page for **CprE / SE 421, Module 5**. It shows one idea from class: a hash table is cheap on ordinary keys, and becomes an **algorithmic-complexity time attack** when many keys share a hash.

Open `index.html` in a current browser. There is no server, no build step, and no API.

Follow the **Lesson** card at the top. It starts from zero: what a key, a hash, a bucket, and a collision are, with the grid on the right as the picture. Later steps ask you to do one thing, then name the number you just produced. Use **Back** (or the step marks) to reread. **Next** stays put until you do the move.

## What it teaches

In 2011, Java, PHP, and Python stored hash collisions in a linked list. Average insert and lookup stay near constant time when keys spread across buckets. If every key hashes to the same value, they pile into one list:

- each new insert walks a longer chain, **O(n)** per operation
- *n* colliding inserts cost about **n² / 2** comparisons

Collision is not identity. Maya, Riya, Priya, and Luca share locker A because they all end in *a*. They are still four different usernames. The site still compares them one by one.

Java 8 later turns a long bucket into a tree, but **only** when both Module 5 / Chapter 6 thresholds hold:

1. that bucket has **more than 8** keys
2. the map has **at least 64** entries

Below either line, the bucket stays a list. This page follows those classroom thresholds.

The lab **simulates** a hash table and counts comparisons. It does not time a real runtime or build payloads against one.

## How to take the lesson

1. Read what a hash table is (a row of lockers) and what a hash is (a locker letter).
2. Click a square in the grid — that square is a bucket.
3. Look up Maya, then Alex. Read **Comparisons**.
4. Switch to *Attack keys*. Watch one locker eat every name.
5. Drag the key count to 40, then try the Java 8 tree at 16 and at 64.

**Start lesson over** (at the end) puts you back at step 1. **Back** rereads an earlier step.

## Controls

Every control changes the picture. During the lesson, the next control is outlined.

- **Keys to insert** (slider, 1–80) — rebuilds the table. Move it across 8 and 64.
- **Hashing** (dropdown) — well-distributed keys vs all keys collide (Listing 6.2: every `hashCode()` is the same).
- **Bucket structure** (toggle) — 2011 linked lists vs Java 8 treeify.
- **Look up a key** (input + button) — a highlight walks the chain or tree; the comparison count ticks with each step. Try Maya, then Alex.
- **Step insert** / **Rebuild** — drop in the next key with motion, or refill the table from the slider.

The chart plots **counted insert comparisons**, not wall-clock time. Colliding lists bend toward n². Treeify levels off only after both thresholds.

## Files

- `index.html` — page and copy
- `styles.css` — layout
- `app.js` — simulation, rendering, walk animation
- `reflection.md` — fill this in before you submit

Do not commit API keys, tokens, or the lecture PDFs.
