const isProd = process.env.NODE_ENV === 'production';

function format(level, args) {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level}]`, ...args];
}

// No-op in production except for errors
export const logger = {
  debug: (...args) => { if (!isProd) console.debug(...format('DEBUG', args)); },
  info:  (...args) => { if (!isProd) console.info (...format('INFO',  args)); },
  warn:  (...args) => { if (!isProd) console.warn (...format('WARN',  args)); },
  error: (...args) => { console.error(...format('ERROR', args)); },
};

export default logger;