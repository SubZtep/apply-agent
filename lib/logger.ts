import pino from "pino"

const transport = process.stdout.isTTY
  ? {
      transport: {
        target: "pino-pretty",
        options: {
          ignore: "pid,hostname",
          singleLine: true,
        },
      },
    }
  : {}

export const logger = pino({
  level: "info",
  ...transport,
})
