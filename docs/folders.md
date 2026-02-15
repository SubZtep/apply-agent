## Jobs folder structure

Every job is a _JSON_ file. During the evaluation process, it gets updated with notes and travels between status folders. No database required.

Here is the folder sctructure for `./[job-id].json` files for further process structure:

```
data/jobs
     ├── inbox              # raw scraped jobs (unscored)
     ├── screened_out       # rejected by batch scoring
     ├── shortlisted        # passed batch scoring
     ├── awaiting_input     # agent needs human input
     ├── declined           # rejected by agent reasoning
     └── approved           # agent-approved jobs
```
