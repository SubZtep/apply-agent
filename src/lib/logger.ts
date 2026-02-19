import pino from "pino"

const targets = []

if (process.env.LOKI_HOST && process.env.LOKI_USERNAME && process.env.LOKI_PASSWORD) {
  targets.push({
    target: "pino-loki",
    level: "info",
    options: {
      labels: { application: "apply-agent" },
      host: process.env.LOKI_HOST,
      basicAuth: {
        username: process.env.LOKI_USERNAME,
        password: process.env.LOKI_PASSWORD
      }
    }
  })
}

targets.push({
  target: "pino-pretty",
  level: "trace",
  options: {
    ignore: "pid,hostname,time",
    levelFirst: true,
    singleLine: true,
    colorize: true
  }
})

const transport = pino.transport({ targets })
export const logger = pino({ level: "trace" }, transport)
