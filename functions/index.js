const functions = require("firebase-functions/v2");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {logger} = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

// Función que se ejecuta automáticamente cada día a las 3:00 AM
exports.borrarCitasAntiguas = onSchedule({
  // Expresión cron: minuto(0) hora(3) * = todos los días
  schedule: "0 3 * * *", // 3:00 AM UTC (ajusta según tu zona horaria)
  timeZone: "America/New_York", // Cambia a tu zona, ej: "Europe/Madrid"
}, async (event) => {
  logger.info("🔄 Iniciando limpieza automática de citas antiguas...");

  try {
    const db = admin.firestore();
    const hoy = new Date();
    
    // Obtener fecha de ayer en formato YYYY-MM-DD
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const fechaLimite = ayer.toISOString().split("T")[0];
    
    logger.info(`🗑️ Buscando citas anteriores a: ${fechaLimite}`);

    // Consultar citas con fecha anterior a ayer
    const citasRef = db.collection("citas");
    const snapshot = await citasRef
        .where("fecha", "<", fechaLimite)
        .get();

    if (snapshot.empty) {
      logger.info("✅ No hay citas antiguas para eliminar.");
      return null;
    }

    // Eliminar en lotes (máximo 500 por batch)
    const batch = db.batch();
    let contador = 0;

    snapshot.docs.forEach((doc) => {
      if (contador < 500) { // Límite de Firestore por batch
        batch.delete(doc.ref);
        contador++;
      }
    });

    await batch.commit();
    logger.info(`✅ Eliminadas ${contador} citas antiguas.`);

    // Si hay más de 500 citas, procesar el siguiente lote
    if (snapshot.size > 500) {
      logger.info(`⚠️ Hay más citas pendientes. Se procesarán en la siguiente ejecución.`);
    }

    return {deleted: contador};
  } catch (error) {
    logger.error("❌ Error en la limpieza automática:", error);
    throw new Error("Fallo en la limpieza de citas: " + error.message);
  }
});

// FUNCIÓN EXTRA: También puedes llamar manualmente desde tu panel admin
exports.borrarCitasManual = functions.https.onCall(async (data, context) => {
  // Verificar autenticación (opcional, pero recomendado)
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Solo administradores pueden ejecutar esta función"
    );
  }

  // Lógica de limpieza (similar a la función programada)
  const db = admin.firestore();
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 7); // Borrar citas de más de 7 días
  const fechaLimite = ayer.toISOString().split("T")[0];

  const snapshot = await db.collection("citas")
      .where("fecha", "<", fechaLimite)
      .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  
  return {
    success: true,
    message: `Eliminadas ${snapshot.size} citas anteriores a ${fechaLimite}`,
    deletedCount: snapshot.size
  };
});