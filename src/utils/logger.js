// Un logger muy básico. Considera usar librerías como Winston o Pino para producción.
const logger = {
  info: (...args) => {
    console.log(`[INFO] ${new Date().toISOString()}:`, ...args);
  },
  warn: (...args) => {
    console.warn(`[WARN] ${new Date().toISOString()}:`, ...args);
  },
  error: (...args) => {
    console.error(`[ERROR] ${new Date().toISOString()}:`, ...args);
  },
  debug: (...args) => {
    // Puedes habilitar/deshabilitar logs de debug según el entorno
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${new Date().toISOString()}:`, ...args);
    }
  },
};

module.exports = logger;
