const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// Función que se ejecuta cada hora
exports.enviarRecordatorios = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
    const ahora = new Date();
    const dentroDe24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    const fecha24h = dentroDe24h.toISOString().split('T')[0]; // YYYY-MM-DD
    const hora24h = dentroDe24h.toTimeString().split(' ')[0].slice(0,5); // HH:MM

    console.log(`Buscando citas para ${fecha24h} a las ${hora24h}`);

    const citasSnapshot = await db.collection("citas")
        .where("estado", "==", "confirmada")
        .where("fecha", "==", fecha24h)
        .get();

    if(citasSnapshot.empty){
        console.log("No hay citas para enviar recordatorio");
        return null;
    }

    const promises = [];
    citasSnapshot.forEach(doc => {
        const cita = doc.data();
        const token = cita.token;
        if(token){
            const mensaje = {
                notification: {
                    title: "Recordatorio de cita",
                    body: `Hola ${cita.nombre}, tienes una cita mañana a las ${cita.hora} para ${cita.servicios.join(", ")}`,
                    icon: "/imagenes/FL/logo.png"
                },
                token: token
            };
            promises.push(messaging.send(mensaje));
        }
    });

    await Promise.all(promises);
    console.log(`Se enviaron ${promises.length} recordatorios`);
    return null;
});
