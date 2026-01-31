```sh
apply-agent analyze \
  --job job.txt \
  --profile me.json \
  --mode conservative
```

## States

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
DECIDE ───→ WAIT_FOR_HUMAN
   ↓              ↑
  PLAN ───────────┘
   ↓
  DONE
```
