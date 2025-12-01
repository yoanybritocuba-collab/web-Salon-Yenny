// Importa Firebase
importScripts("https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/10.1.0/firebase-messaging.js");

// Inicializa Firebase con tu configuración
firebase.initializeApp({
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
});

// Inicializa messaging
const messaging = firebase.messaging();

// Escucha notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log("Notificación recibida en segundo plano:", payload);

    // Mostrar notificación
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon || "/icono.png"
    });
});
