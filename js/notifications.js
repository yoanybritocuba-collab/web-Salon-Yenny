// Configuración de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID",
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Pedir permiso al usuario para recibir notificaciones
Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
        console.log("Notificaciones permitidas");

        // Obtener token del dispositivo
        messaging.getToken({ vapidKey: "TU_VAPID_PUBLIC_KEY" })
            .then((token) => {
                if (token) {
                    console.log("Token del dispositivo:", token);
                    // Guardar token en Firestore en la cita correspondiente
                    guardarTokenEnFirestore(token);
                } else {
                    console.log("No se pudo obtener token");
                }
            });
    }
});

// Función para guardar token en Firestore
function guardarTokenEnFirestore(token) {
    const codigoCita = "EU2BXC"; // Aquí pones el código de la cita que corresponde
    firebase.firestore().collection("citas")
        .doc(codigoCita)
        .update({ token: token })
        .then(() => console.log("Token guardado correctamente en Firestore"))
        .catch((err) => console.error("Error guardando token:", err));
}
