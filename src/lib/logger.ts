export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown> & {
  requestId?: string;
};

type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  context?: Record<string, unknown>;
};

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function currentMinLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentMinLevel()];
}

function write(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;
  const line = JSON.stringify(entry);
  switch (entry.level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "debug":
      console.debug(line);
      break;
    default:
      console.log(line);
  }
}

function emit(
  level: LogLevel,
  message: string,
  context?: LogContext,
): void {
  const { requestId, ...rest } = context ?? {};
  write({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
    ...(Object.keys(rest).length > 0 ? { context: rest } : {}),
  });
}

export const logger = {
  debug(message: string, context?: LogContext) {
    emit("debug", message, context);
  },
  info(message: string, context?: LogContext) {
    emit("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    emit("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    emit("error", message, context);
  },
  child(base: LogContext) {
    return {
      debug(message: string, context?: LogContext) {
        emit("debug", message, { ...base, ...context });
      },
      info(message: string, context?: LogContext) {
        emit("info", message, { ...base, ...context });
      },
      warn(message: string, context?: LogContext) {
        emit("warn", message, { ...base, ...context });
      },
      error(message: string, context?: LogContext) {
        emit("error", message, { ...base, ...context });
      },
    };
  },
};

export type Logger = typeof logger;
