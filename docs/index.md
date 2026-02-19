## Index

- [User Configuration](config.md)
- [Folder structure](folders.md)
- [Job states](states.md)

## Related Links

- [Meaningful exit status codes](https://gist.github.com/SubZtep/3c6baeeab828ee44cc8150d54c99207c)
- [Console friendly emojis](https://unicode.org/emoji/charts/full-emoji-list.html)

---

🫧

### Mode semantics

The agent runs in strict mode by default. To skip questions, set the mode parameter: `bun start run --mode=exploratory`.

| Strict                                       | Exploratory                               |
| -------------------------------------------- | ----------------------------------------- |
| Any unresolved uncertainty → WAIT_FOR_HUMAN  | Hard gaps → ask once, then proceed        |
| Hard gaps → WAIT_FOR_HUMAN                   | Low confidence → assume best-case         |
| Low confidence → WAIT_FOR_HUMAN              | LOW_QUALITY → downgrade severity, proceed |
| LOW_QUALITY from EVALUATE/CHALLENGE → FAILED | Bias toward PLAN                          |



gent runs the state machine – the final step in the data flow.

### Data flow

```
[ Python scraper ]
        ↓
  (job records)
        ↓
[ job inbox (files) ]
        ↓
[ batch scorer ]
        ↓
[ ranked jobs ]
        ↓
[ agent runs ]
```

### Agent states

```
IDLE
  ↓
INGEST
  ↓
NORMALIZE
  ↓
EVALUATE
  ↓
CHALLENGE
  ↓
DECIDE <───> WAIT_FOR_HUMAN
  ↓               |
 PLAN             |
  ↓               ↓
 DONE            ERROR
```
