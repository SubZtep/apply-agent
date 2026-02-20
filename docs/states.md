## States

```mermaid
stateDiagram-v2
  classDef GameOver stroke:darkred
  classDef WellDone stroke:yellow
  class ScreenedOut GameOver
  class FAILED GameOver
  class DONE WellDone

  [*] --> Scraping
  Scraping --> inbox

  state inbox {
    [*] --> TransformToSchema
    TransformToSchema --> BatchScoring
  }

  state BatchScoring {
    [*] --> Score
  }

  Score --> Shortlisted
  Score --> ScreenedOut
  Shortlisted --> IDLE

  state StateMachine {
    IDLE --> INGEST
    INGEST --> NORMALIZE
    NORMALIZE --> EVALUATE
    EVALUATE --> CHALLENGE
    CHALLENGE --> DECIDE
    DECIDE --> PLAN
    DECIDE --> WAIT_FOR_HUMAN
    WAIT_FOR_HUMAN --> DECIDE
  }

  INGEST --> FAILED
  NORMALIZE --> FAILED
  EVALUATE --> FAILED
  CHALLENGE --> FAILED
  DECIDE --> FAILED
  WAIT_FOR_HUMAN --> FAILED
  PLAN --> DONE

  DONE --> [*]
```

## States (text)

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
