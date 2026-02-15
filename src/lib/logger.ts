import pino from "pino"

const transport =
  (process.stdout.isTTY ?? process.env.NODE_ENV === "development")
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            ignore: "pid,hostname,time",
            levelFirst: true,
            hideObject: true,
            colorize: true,
          },
        },
      }
    : {}

export const logger = pino({
  level: "info",
  ...transport,
})
