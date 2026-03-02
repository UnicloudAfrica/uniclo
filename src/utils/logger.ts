const isProd = import.meta.env?.PROD ?? false;

const noop = (..._args: unknown[]) => {};

const logger = {
  log: isProd ? noop : (...args: unknown[]) => console.log(...args), // eslint-disable-line no-console
  warn: isProd ? noop : (...args: unknown[]) => console.warn(...args), // eslint-disable-line no-console
  error: (...args: unknown[]) => console.error(...args), // eslint-disable-line no-console
  info: isProd ? noop : (...args: unknown[]) => console.info(...args), // eslint-disable-line no-console
  debug: isProd ? noop : (...args: unknown[]) => console.debug(...args), // eslint-disable-line no-console
};

export default logger;
