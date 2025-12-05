// ========== VARIABLES GLOBALES ==========
let currentImages = [];
let currentImageIndex = 0;
let currentAppointments = [];
let selectedTime = null;
let selectedServices = [];
let isBookingPaused = false;
let bookingResumeDate = '';
let lastScrollTop = 0;
let currentSection = 'inicio';
let zoomLevel = 1;

// Variables para el control del botón "atrás" del móvil
let backButtonPressCount = 0;
let backButtonTimeout = null;
let isBackButtonEnabled = true;

// Variables para el carrusel
let carouselTrack = null;
let carouselItems = [];
let isDragging = false;
let startPos = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let animationID = 0;
let currentSlide = 0;

// Variables para el contador de citas (NUEVO)
let appointmentListeners = [];
let appointmentsUnsubscribe = null;
let statsUnsubscribe = null;
let todayCitasCount = 0;
let totalCitasCount = 0;

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    onSnapshot,
    query,
    orderBy,
    where,
    getDocs,
    getDoc,
    setDoc,
    Timestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBCJn0JDvKPNRb-5TkSZyaWZtTpF1-3Wg",
  authDomain: "web-salon-yenny.firebaseapp.com",
  projectId: "web-salon-yenny",
  storageBucket: "web-salon-yenny.firebasestorage.app",
  messagingSenderId: "1060411840618",
  appId: "1:1060411840618:web:84c7f408ae6ce0a0e09213"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencia a la configuración del sistema
const configRef = doc(db, "config", "booking");

// ========== FUNCIÓN PARA LIMPIAR LISTENERS (NUEVO) ==========
function cleanUpListeners() {
    // Limpiar todos los listeners de citas
    appointmentListeners.forEach(listener => {
        if (listener && typeof listener === 'function') {
            listener();
        }
    });
    appointmentListeners = [];
    
    // Limpiar unsubscribe específicos
    if (appointmentsUnsubscribe && typeof appointmentsUnsubscribe === 'function') {
        appointmentsUnsubscribe();
        appointmentsUnsubscribe = null;
    }
    
    if (statsUnsubscribe && typeof statsUnsubscribe === 'function') {
        statsUnsubscribe();
        statsUnsubscribe = null;
    }
}

// ========== FUNCIONES PARA CONTROLAR EL INDICADOR DE SERVICIOS ==========
function showServicesIndicator() {
    const indicator = getElement('servicesIndicator');
    if (indicator) {
        indicator.style.display = 'block';
        
        // Mostrar solo por 6 segundos en lugar de 8
        setTimeout(() => {
            if (indicator && indicator.style.display === 'block') {
                indicator.style.display = 'none';
            }
        }, 6000);
    }
}

function initServicesIndicatorScroll() {
    const servicesSection = document.getElementById('servicios');
    const indicator = getElement('servicesIndicator');
    
    if (!servicesSection || !indicator) return;
    
    // Crear un Intersection Observer para detectar cuando la sección de servicios está visible
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Cuando la sección de servicios es visible
                    // Esperar 1 segundo y luego ocultar el indicador si aún está visible
                    setTimeout(() => {
                        if (indicator.style.display === 'block') {
                            indicator.style.display = 'none';
                        }
                    }, 1000);
                }
            });
        },
        {
            threshold: 0.3 // Cuando el 30% de la sección es visible
        }
    );
    
    // Observar la sección de servicios
    observer.observe(servicesSection);
    
    // También ocultar cuando el usuario interactúa con los servicios
    const servicesContainer = getElement('servicesContainer');
    if (servicesContainer) {
        servicesContainer.addEventListener('click', () => {
            if (indicator.style.display === 'block') {
                indicator.style.display = 'none';
            }
        });
    }
    
    // Ocultar al hacer scroll en la sección de servicios
    window.addEventListener('scroll', () => {
        const servicesSection = document.getElementById('servicios');
        if (!servicesSection) return;
        
        const rect = servicesSection.getBoundingClientRect();
        
        // Si la sección de servicios está visible en la ventana
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            if (indicator.style.display === 'block') {
                // Esperar un momento y ocultar
                setTimeout(() => {
                    if (indicator.style.display === 'block') {
                        indicator.style.display = 'none';
                    }
                }, 500);
            }
        }
    }, { passive: true });
}

// ========== SISTEMA DE CONTROL DEL BOTÓN "ATRÁS" DEL MÓVIL ==========
function initBackButtonControl() {
    console.log("🔄 Inicializando control del botón atrás...");
    
    // Agregar un estado inicial al historial
    if (history.state === null) {
        history.replaceState({ page: "main", section: "inicio" }, "", "");
    }
    
    // Variable para controlar si estamos en el panel admin
    let isInAdminPanel = false;
    let adminBackButton = null;

    // Crear botón de retorno simplificado para todos los dispositivos
    function createAdminBackButton() {
        console.log("🔄 Creando botón de retorno para admin...");
        
        // Verificar si ya existe un botón
        const existingBtn = document.querySelector('.admin-back-to-home, .admin-back-simple');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const isMobile = window.innerWidth <= 768;
        const backButton = document.createElement('button');
        
        if (isMobile) {
            // Para móviles: botón simple "<"
            backButton.className = 'admin-back-simple';
            backButton.innerHTML = '←';
            backButton.title = 'Volver al Inicio';
            backButton.setAttribute('aria-label', 'Volver al inicio');
        } else {
            // Para desktop: botón con texto
            backButton.className = 'admin-back-to-home';
            backButton.innerHTML = `
                <span class="back-icon">←</span>
                <span class="back-text">Volver al Inicio</span>
            `;
            backButton.setAttribute('aria-label', 'Volver al inicio');
        }
        
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("👆 Botón de retorno clickeado");
            
            const adminModal = getElement('adminModal');
            if (adminModal && adminModal.style.display === 'block') {
                adminModal.style.display = 'none';
                adminModal.classList.remove('show');
                isInAdminPanel = false;
                
                // Limpiar formulario de autenticación
                const adminAuth = getElement('adminAuth');
                const adminContent = getElement('adminContent');
                const adminPasswordInput = getElement('adminPasswordInput');
                
                if (adminAuth) adminAuth.style.display = 'block';
                if (adminContent) adminContent.style.display = 'none';
                if (adminPasswordInput) adminPasswordInput.value = '';
            }
            
            // Ir al inicio
            switchSection('inicio');
            
            // Mostrar confirmación
            showNotification('🏠 Volviendo al inicio', 'info');
            
            // Remover el botón después de usarlo
            if (backButton.parentNode) {
                backButton.remove();
            }
        });
        
        return backButton;
    }

    // Escuchar cambios en el estado del historial (botón físico "atrás")
    window.addEventListener("popstate", function(e) {
        console.log("📱 Popstate detectado", e.state);
        
        // Si el usuario está en el panel admin
        if (isInAdminPanel) {
            console.log("🔙 Cerrando panel admin desde botón físico atrás");
            
            // Prevenir comportamiento por defecto
            e.preventDefault();
            
            const adminModal = getElement('adminModal');
            if (adminModal) {
                adminModal.style.display = 'none';
                adminModal.classList.remove('show');
                isInAdminPanel = false;
                
                // Limpiar formulario de autenticación
                const adminAuth = getElement('adminAuth');
                const adminContent = getElement('adminContent');
                const adminPasswordInput = getElement('adminPasswordInput');
                
                if (adminAuth) adminAuth.style.display = 'block';
                if (adminContent) adminContent.style.display = 'none';
                if (adminPasswordInput) adminPasswordInput.value = '';
            }
            
            // Ir al inicio
            switchSection('inicio');
            
            // Mostrar confirmación
            showNotification('🏠 Volviendo al inicio', 'info');
            
            // Actualizar historial
            history.replaceState({ page: "main", section: "inicio" }, "", "");
            
            return;
        }

        // Control del botón físico "atrás" del móvil para navegación general
        if (isBackButtonEnabled) {
            if (backButtonPressCount < 2) {
                e.preventDefault();
                
                backButtonPressCount++;
                
                // Mostrar feedback visual
                showBackButtonFeedback(backButtonPressCount);
                
                // Navegar a inicio si no está ahí
                if (currentSection !== 'inicio') {
                    switchSection('inicio');
                } else {
                    // Si ya está en inicio, mostrar mensaje
                    showBackButtonMessage(backButtonPressCount);
                }
                
                // Prevenir la salida
                history.pushState({ page: "main", section: currentSection }, "", "");
                
                // Reiniciar contador después de 3 segundos
                clearTimeout(backButtonTimeout);
                backButtonTimeout = setTimeout(() => {
                    backButtonPressCount = 0;
                    hideBackButtonFeedback();
                }, 3000);
                
            } else {
                // Tercera vez - Mostrar mensaje final
                showExitMessage();
                // Permitir salida natural después del mensaje
                setTimeout(() => {
                    // No hacemos nada, dejamos que el navegador maneje la salida
                }, 2000);
                return;
            }
        }
    });

    // Observar cambios en el DOM para detectar cuando se abre el panel admin
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                const adminModal = getElement('adminModal');
                const adminContent = getElement('adminContent');
                
                // Verificar si el panel admin está visible
                const isAdminVisible = adminModal && 
                    adminModal.style.display === 'block' &&
                    adminContent && 
                    adminContent.style.display !== 'none';
                
                if (isAdminVisible && !isInAdminPanel) {
                    console.log("👁️‍🗨️ Panel admin abierto - agregando botón de retorno");
                    isInAdminPanel = true;
                    
                    // Agregar botón de retorno si no existe
                    if (!adminBackButton || !document.body.contains(adminBackButton)) {
                        adminBackButton = createAdminBackButton();
                        document.body.appendChild(adminBackButton);
                        
                        // Forzar visibilidad inmediata
                        setTimeout(() => {
                            if (adminBackButton) {
                                adminBackButton.style.opacity = '1';
                                adminBackButton.style.visibility = 'visible';
                                adminBackButton.style.display = 'flex';
                            }
                        }, 10);
                    }
                    
                    // Actualizar historial para capturar el botón atrás
                    history.pushState({ page: "admin", section: "panel" }, "", "");
                    
                } else if (!isAdminVisible && isInAdminPanel) {
                    console.log("👁️‍🗨️ Panel admin cerrado - removiendo botón de retorno");
                    isInAdminPanel = false;
                    
                    // Limpiar listeners cuando se cierra el panel (NUEVO)
                    cleanUpListeners();
                    
                    // Remover botón de retorno
                    if (adminBackButton && adminBackButton.parentNode) {
                        adminBackButton.style.opacity = '0';
                        adminBackButton.style.visibility = 'hidden';
                        setTimeout(() => {
                            if (adminBackButton && adminBackButton.parentNode) {
                                adminBackButton.parentNode.removeChild(adminBackButton);
                                adminBackButton = null;
                            }
                        }, 300);
                    }
                }
            }
        });
    });

    // Observar cambios en el modal de admin y su contenido
    const adminModal = getElement('adminModal');
    const adminContent = getElement('adminContent');
    
    if (adminModal) {
        observer.observe(adminModal, { 
            attributes: true, 
            attributeFilter: ['style', 'class'],
            childList: true,
            subtree: true
        });
    }
    
    if (adminContent) {
        observer.observe(adminContent, { 
            attributes: true, 
            attributeFilter: ['style'],
            childList: true
        });
    }

    // Agregar estilos CSS para las animaciones si no existen
    if (!document.querySelector('#back-button-styles')) {
        const style = document.createElement('style');
        style.id = 'back-button-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            .admin-back-simple {
                position: fixed !important;
                top: 15px !important;
                left: 15px !important;
                z-index: 10001 !important;
                background: linear-gradient(135deg, #E75480, #D147A3) !important;
                color: white !important;
                border: none !important;
                border-radius: 50% !important;
                width: 40px !important;
                height: 40px !important;
                font-weight: bold !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 1.5rem !important;
                box-shadow: 0 4px 15px rgba(231, 84, 128, 0.3) !important;
                transition: all 0.3s ease !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            .admin-back-simple:hover {
                transform: scale(1.1) !important;
                box-shadow: 0 6px 20px rgba(231, 84, 128, 0.4) !important;
            }
            
            .back-button-feedback {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px 40px;
                border-radius: 15px;
                z-index: 10000;
                font-size: 2rem;
                font-weight: bold;
                animation: fadeIn 0.3s ease, bounce 0.5s ease;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            
            .back-button-message {
                font-size: 1rem;
                opacity: 0.9;
                text-align: center;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% {
                    transform: translate(-50%, -50%) scale(1);
                }
                40% {
                    transform: translate(-50%, -50%) scale(1.1);
                }
                60% {
                    transform: translate(-50%, -50%) scale(1.05);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ========== FUNCIONES AUXILIARES PARA EL BOTÓN ATRÁS ==========
function showBackButtonFeedback(count) {
    // Remover feedback anterior si existe
    const existingFeedback = document.querySelector('.back-button-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    const feedback = document.createElement('div');
    feedback.className = 'back-button-feedback';
    
    let message = '';
    let remaining = 3 - count;
    
    if (remaining === 2) {
        message = 'Presiona 2 veces más para salir';
    } else if (remaining === 1) {
        message = 'Presiona 1 vez más para salir';
    }
    
    feedback.innerHTML = `
        <div style="font-size: 3rem;">${count}</div>
        <div class="back-button-message">${message}</div>
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.remove();
                }
            }, 300);
        }
    }, 1500);
}

function hideBackButtonFeedback() {
    const feedback = document.querySelector('.back-button-feedback');
    if (feedback) {
        feedback.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 300);
    }
}

function showBackButtonMessage(count) {
    const remaining = 3 - count;
    const messages = [
        '',
        'Presiona 2 veces más para salir',
        'Presiona 1 vez más para salir'
    ];
    
    if (messages[count]) {
        showNotification(`⬅️ ${messages[count]}`, 'warning', 2000);
    }
}

function showExitMessage() {
    const exitMessage = document.createElement('div');
    exitMessage.className = 'back-button-feedback';
    exitMessage.innerHTML = `
        <div style="font-size: 3rem; color: #e74c3c;">⚠️</div>
        <div class="back-button-message" style="color: #e74c3c;">
            <strong>Saliendo...</strong><br>
            ¡Gracias por visitarnos!
        </div>
    `;
    
    document.body.appendChild(exitMessage);
    
    setTimeout(() => {
        if (exitMessage.parentNode) {
            exitMessage.style.opacity = '0';
            exitMessage.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                if (exitMessage.parentNode) {
                    exitMessage.remove();
                }
            }, 300);
        }
    }, 2000);
}

// ========== SERVICIOS CON RUTAS CORREGIDAS ==========
const services = [
    {
        id: 1,
        name: "Lavado normal",
        price: 55,
        duration: 30,
        image: "imagenes/servicios/lavado-solo.png",
        description: "Lavado y secado profesional",
        category: "basico"
    },
    {
        id: 2,
        name: "Lavado con línea",
        price: 70,
        duration: 60,
        image: "imagenes/servicios/lavado-con-linea.png",
        description: "Lavado con corte de puntas",
        category: "basico"
    },
    {
        id: 3,
        name: "Lavado con rolos",
        price: 75,
        duration: 90,
        image: "imagenes/servicios/lavado-con-rolos.png",
        description: "Lavado con peinado con rolos",
        category: "avanzado"
    },
    {
        id: 4,
        name: "Color",
        price: 120,
        duration: 120,
        image: "imagenes/servicios/color.png",
        description: "Coloración profesional",
        category: "coloracion"
    },
    {
        id: 5,
        name: "Botox capilar",
        price: 150,
        duration: 120,
        image: "imagenes/servicios/botox-capilar.png",
        description: "Tratamiento botox capilar",
        category: "tratamiento"
    },
    {
        id: 6,
        name: "Keratina",
        price: 200,
        duration: 120,
        image: "imagenes/servicios/keratina.png",
        description: "Tratamiento de keratina",
        category: "tratamiento"
    },
    {
        id: 7,
        name: "Microsring",
        price: 200,
        duration: 180,
        image: "imagenes/servicios/microsring.png",
        description: "Extensiones microsring",
        category: "extensiones"
    },
    {
        id: 8,
        name: "Extensiones x línea",
        price: 20,
        duration: 40,
        image: "imagenes/servicios/extensiones-por-lineas.png",
        description: "Extensiones por línea",
        category: "extensiones"
    },
    {
        id: 9,
        name: "Extensiones completas",
        price: 200,
        duration: 180,
        image: "imagenes/servicios/extensiones-completas.png",
        description: "Extensiones completas",
        category: "extensiones"
    }
];

// ========== SISTEMA INTELIGENTE DE GESTIÓN DE HORARIOS ==========
class ScheduleManager {
    constructor() {
        this.workDayStart = 9 * 60;
        this.workDayEnd = 18 * 60;
        this.maxDailyCapacity = 540;
        this.timeSlotInterval = 30;
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    generateAllTimeSlots() {
        const slots = [];
        for (let time = this.workDayStart; time < this.workDayEnd; time += this.timeSlotInterval) {
            slots.push(this.minutesToTime(time));
        }
        return slots;
    }

    async calculateAvailability(selectedDate, selectedServices) {
        const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
        const allSlots = this.generateAllTimeSlots();
        const availability = {};
        
        try {
            const existingAppointments = await this.getExistingAppointments(selectedDate);
            
            allSlots.forEach(slot => {
                const slotStart = this.timeToMinutes(slot);
                const slotEnd = slotStart + totalDuration;
                
                if (slotEnd > this.workDayEnd) {
                    availability[slot] = { status: 'unavailable', reason: 'Fuera de horario laboral' };
                    return;
                }
                
                const hasConflict = existingAppointments.some(appointment => {
                    const appointmentStart = this.timeToMinutes(appointment.hora);
                    const appointmentEnd = appointmentStart + appointment.duracion;
                    return (slotStart < appointmentEnd && slotEnd > appointmentStart);
                });
                
                if (hasConflict) {
                    availability[slot] = { status: 'unavailable', reason: 'Horario ocupado' };
                } else {
                    availability[slot] = { status: 'available', reason: 'Disponible' };
                }
            });
            
            return availability;
        } catch (error) {
            console.error('Error calculando disponibilidad:', error);
            allSlots.forEach(slot => {
                availability[slot] = { status: 'unavailable', reason: 'Error de sistema' };
            });
            return availability;
        }
    }

    async getExistingAppointments(date) {
        try {
            const q = query(
                collection(db, "citas"),
                where("fecha", "==", date),
                where("estado", "==", "confirmada")
            );
            const querySnapshot = await getDocs(q);
            const appointments = [];
            
            querySnapshot.forEach((doc) => {
                appointments.push(doc.data());
            });
            
            return appointments;
        } catch (error) {
            console.error('Error obteniendo citas existentes:', error);
            return [];
        }
    }

    async checkSpecificAvailability(selectedDate, selectedTime, selectedServices) {
        // 🔴 PRIMERO VERIFICAR SI LAS CITAS ESTÁN PAUSADAS
        try {
            const configDoc = await getDoc(configRef);
            if (configDoc.exists()) {
                const configData = configDoc.data();
                if (configData.isPaused) {
                    return { 
                        available: false, 
                        reason: configData.resumeDate 
                            ? `Citas pausadas hasta ${configData.resumeDate}` 
                            : 'Citas temporalmente desactivadas' 
                    };
                }
            }
        } catch (error) {
            console.error('Error verificando configuración:', error);
        }
        
        // Si las citas no están pausadas, continuar con la verificación normal
        const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
        const timeStart = this.timeToMinutes(selectedTime);
        const timeEnd = timeStart + totalDuration;
        
        if (timeStart < this.workDayStart || timeEnd > this.workDayEnd) {
            return { available: false, reason: 'Fuera del horario laboral' };
        }
        
        const existingAppointments = await this.getExistingAppointments(selectedDate);
        
        const hasConflict = existingAppointments.some(appointment => {
            const appointmentStart = this.timeToMinutes(appointment.hora);
            const appointmentEnd = appointmentStart + appointment.duracion;
            return (timeStart < appointmentEnd && timeEnd > appointmentStart);
        });
        
        if (hasConflict) {
            return { available: false, reason: 'Horario ya reservado' };
        }
        
        return { available: true, reason: 'Disponible' };
    }
}

const scheduleManager = new ScheduleManager();

// ========== INICIALIZACIÓN SEGURA DEL DOM ==========
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Elemento no encontrado: ${id}`);
    }
    return element;
}

// ========== SISTEMA DE CONFIGURACIÓN EN TIEMPO REAL ==========
async function initBookingConfig() {
    try {
        const docSnap = await getDoc(configRef);
        
        if (!docSnap.exists()) {
            // Crear configuración inicial
            await setDoc(configRef, {
                isPaused: false,
                resumeDate: '',
                lastUpdated: new Date()
            });
        }
        
        // Escuchar cambios en tiempo real
        onSnapshot(configRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                isBookingPaused = data.isPaused || false;
                bookingResumeDate = data.resumeDate || '';
                
                // 🔴 CERRAR EL MODAL DE CITAS SI ESTÁ ABIERTO Y SE PAUSAN
                if (isBookingPaused) {
                    const bookingModal = getElement('bookingModal');
                    if (bookingModal && bookingModal.style.display === 'block') {
                        closeBookingModal();
                        showNotification('⏸️ Las citas han sido pausadas temporalmente', 'warning');
                    }
                }
                
                // Actualizar todos los botones de citas
                updateBookingButtons();
                
                // Actualizar panel admin si está abierto
                const adminContent = getElement('adminContent');
                if (adminContent && adminContent.style.display !== 'none') {
                    updateAdminControls();
                }
            }
        });
        
    } catch (error) {
        console.error('Error inicializando configuración:', error);
        showNotification('⚠️ Error de conexión con el servidor', 'error');
    }
}

// ========== ACTUALIZACIÓN DE BOTONES DE CITAS ==========
function updateBookingButtons() {
    const bookingButtons = [
        getElement('bookingBtn'),
        getElement('heroBookingBtn'),
        getElement('bigBookingBtn'),
        getElement('floatingBookBtn')
    ];
    
    bookingButtons.forEach(btn => {
        if (btn) {
            if (isBookingPaused) {
                btn.classList.remove('btn-fuchsia', 'btn-active');
                btn.classList.add('btn-paused');
                
                let message = '⏸️ CITAS PAUSADAS';
                if (bookingResumeDate) {
                    message = `⏸️ NO HAY CITAS HASTA ${bookingResumeDate}`;
                }
                
                btn.innerHTML = `<span class="btn-icon">⏸️</span> ${message}`;
                btn.disabled = true;
                btn.style.cursor = 'not-allowed';
            } else {
                btn.classList.remove('btn-paused');
                btn.classList.add('btn-fuchsia', 'btn-active');
                
                const originalText = btn.getAttribute('data-original-text') || 'Reservar Cita';
                btn.innerHTML = `<span class="btn-icon">📅</span> ${originalText}`;
                btn.disabled = false;
                btn.style.cursor = 'pointer';
            }
        }
    });
}

// ========== SISTEMA DE PORTALES SEPARADOS ==========
function initPortalNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            switchSection(targetSection);
            
            const navCompact = document.querySelector('.nav-compact');
            const mobileMenuToggle = document.getElementById('mobileMenuToggle');
            if (navCompact && navCompact.classList.contains('mobile-open')) {
                navCompact.classList.remove('mobile-open');
                mobileMenuToggle.classList.remove('active');
            }
        });
    });
    
    switchSection('inicio');
}

function switchSection(sectionId) {
    closeAllModals();
    
    const bigBookingContainer = getElement('bigBookingContainer');
    if (bigBookingContainer) {
        if (sectionId === 'servicios') {
            bigBookingContainer.style.display = 'block';
        } else {
            bigBookingContainer.style.display = 'none';
        }
    }
    
    const sections = document.querySelectorAll('.section-portal');
    sections.forEach(section => {
        section.classList.remove('section-active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('section-active');
        currentSection = sectionId;
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    updateActiveNav(sectionId);
}

function updateActiveNav(activeSection) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('data-section') === activeSection) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    const navCompact = document.querySelector('.nav-compact');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (navCompact && navCompact.classList.contains('mobile-open')) {
        navCompact.classList.remove('mobile-open');
        mobileMenuToggle.classList.remove('active');
    }
}

function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollThreshold = 100;
        
        if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
        
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    }, { passive: true });
}

function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navCompact = document.querySelector('.nav-compact');
    
    if (mobileMenuToggle && navCompact) {
        mobileMenuToggle.addEventListener('click', function() {
            navCompact.classList.toggle('mobile-open');
            this.classList.toggle('active');
        });
    }

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(e) {
        const navCompact = document.querySelector('.nav-compact');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        
        if (navCompact && navCompact.classList.contains('mobile-open') && 
            !navCompact.contains(e.target) && 
            e.target !== mobileMenuToggle) {
            navCompact.classList.remove('mobile-open');
            if (mobileMenuToggle) {
                mobileMenuToggle.classList.remove('active');
            }
        }
    });

    // Configurar botón admin en menú móvil
    const adminMobileBtn = document.getElementById('adminMobileBtn');
    if (adminMobileBtn) {
        adminMobileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAdminModal();
            
            // Cerrar menú móvil después de hacer clic
            const navCompact = document.querySelector('.nav-compact');
            const mobileMenuToggle = document.getElementById('mobileMenuToggle');
            if (navCompact && navCompact.classList.contains('mobile-open')) {
                navCompact.classList.remove('mobile-open');
                mobileMenuToggle.classList.remove('active');
            }
        });
    }
}

function scrollToServices() {
    switchSection('servicios');
    setTimeout(showServicesIndicator, 500);
}

function initSmartBooking() {
    const bookingBtn = getElement('bookingBtn');
    const heroBookingBtn = getElement('heroBookingBtn');
    const bigBookingBtn = getElement('bigBookingBtn');
    const bigBookingContainer = getElement('bigBookingContainer');
    
    if (bookingBtn) {
        bookingBtn.setAttribute('data-original-text', 'HACER TU CITA AQUI');
        bookingBtn.addEventListener('click', handleBookingButtonClick);
    }
    
    if (heroBookingBtn) {
        heroBookingBtn.setAttribute('data-original-text', 'Reservar Cita');
        heroBookingBtn.addEventListener('click', handleBookingButtonClick);
    }
    
    if (bigBookingBtn) {
        bigBookingBtn.setAttribute('data-original-text', 'Realizar tu cita aquí');
        bigBookingBtn.addEventListener('click', function() {
            if (bigBookingContainer) {
                bigBookingContainer.style.display = 'none';
            }
            handleBookingButtonClick();
        });
    }
    
    // Botón en el recuadro flotante
    const floatingBookBtn = getElement('floatingBookBtn');
    if (floatingBookBtn) {
        floatingBookBtn.setAttribute('data-original-text', 'Reservar Ahora');
        floatingBookBtn.addEventListener('click', handleBookingButtonClick);
    }
}

function handleBookingButtonClick() {
    if (isBookingPaused) {
        let message = '⏸️ Las citas están temporalmente desactivadas.';
        if (bookingResumeDate) {
            message = `⏸️ No hay citas disponibles hasta el ${bookingResumeDate}.`;
        }
        showNotification(message, 'warning');
        return;
    }
    
    const bigBookingContainer = getElement('bigBookingContainer');
    if (bigBookingContainer) {
        bigBookingContainer.style.display = 'none';
    }
    
    if (selectedServices.length === 0) {
        switchSection('servicios');
        showServicesIndicator();
        showNotification('👆 Selecciona los servicios que deseas reservar', 'info');
    } else {
        openBookingModal();
    }
}

// ========== NUEVO SISTEMA DE SERVICIOS FLOTANTE ==========
function initFloatingServices() {
    const closeFloatingBtn = document.querySelector('.close-floating');
    if (closeFloatingBtn) {
        closeFloatingBtn.addEventListener('click', () => {
            const floatingServices = getElement('floatingServices');
            if (floatingServices) {
                floatingServices.style.display = 'none';
            }
        });
    }
    
    // Mostrar/ocultar recuadro flotante según servicios seleccionados
    updateFloatingServices();
}

function updateFloatingServices() {
    const floatingServices = getElement('floatingServices');
    const floatingServicesList = getElement('floatingServicesList');
    
    if (!floatingServices || !floatingServicesList) return;
    
    floatingServicesList.innerHTML = '';
    
    if (selectedServices.length === 0) {
        floatingServices.style.display = 'none';
        return;
    }
    
    // Mostrar recuadro flotante
    floatingServices.style.display = 'flex';
    
    let totalPrice = 0;
    let totalDuration = 0;
    
    selectedServices.forEach((service, index) => {
        totalPrice += service.price;
        totalDuration += service.duration;
        
        const serviceItem = document.createElement('div');
        serviceItem.className = 'floating-service-item';
        serviceItem.innerHTML = `
            <div class="floating-service-info">
                <h5>${service.name}</h5>
                <p>$${service.price} • ${service.duration}min</p>
            </div>
            <button class="remove-service" data-index="${index}">×</button>
        `;
        floatingServicesList.appendChild(serviceItem);
        
        // Añadir evento para eliminar servicio
        const removeBtn = serviceItem.querySelector('.remove-service');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeService(index);
        });
    });
    
    // Actualizar botón flotante
    const floatingBookBtn = getElement('floatingBookBtn');
    if (floatingBookBtn) {
        floatingBookBtn.innerHTML = `
            <span class="btn-icon">📅</span> 
            Reservar Ahora 
            <span class="floating-total">(${selectedServices.length} servicios - $${totalPrice})</span>
        `;
    }
}

function removeService(index) {
    if (index >= 0 && index < selectedServices.length) {
        const removedService = selectedServices[index];
        selectedServices.splice(index, 1);
        
        // Actualizar tarjetas de servicios
        const serviceCard = document.querySelector(`[data-service-id="${removedService.id}"]`);
        if (serviceCard) {
            serviceCard.classList.remove('selected');
            const bookBtn = serviceCard.querySelector('.service-book-btn');
            if (bookBtn) {
                bookBtn.classList.remove('added');
                bookBtn.innerHTML = '<span class="btn-icon">➕</span> Agregar';
                bookBtn.style.background = 'linear-gradient(135deg, #E75480, #D147A3)';
            }
        }
        
        // Actualizar recuadro flotante
        updateFloatingServices();
        
        // Actualizar vista previa en modal (si está abierto)
        updateBookingPreview();
        
        showNotification(`🗑️ ${removedService.name} removido`, 'info');
    }
}

// ========== FUNCIÓN MEJORADA PARA CARGAR SERVICIOS ==========
function loadServices() {
    const servicesContainer = getElement('servicesContainer');
    if (!servicesContainer) return;

    servicesContainer.innerHTML = '';
    
    services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.setAttribute('data-service-id', service.id);
        serviceCard.innerHTML = `
            <div class="service-image-container">
                <img src="${service.image}" alt="${service.name}" class="service-image"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlNlcnZpY2lvPC90ZXh0Pjwvc3ZnPg=='">
                <div class="service-overlay">
                    <span class="service-price">$${service.price}</span>
                    <span class="service-duration">${service.duration}min</span>
                </div>
            </div>
            <div class="service-content">
                <h3>${service.name}</h3>
                <p class="service-description">${service.description}</p>
                <div class="service-category">${service.category}</div>
            </div>
            <button class="service-book-btn" data-service-id="${service.id}">
                <span class="btn-icon">➕</span>
                Agregar
            </button>
        `;
        servicesContainer.appendChild(serviceCard);

        const bookBtn = serviceCard.querySelector('.service-book-btn');
        bookBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleServiceSelection(service, serviceCard, bookBtn);
        });

        serviceCard.addEventListener('click', () => {
            toggleServiceSelection(service, serviceCard, bookBtn);
        });
    });
}

function toggleServiceSelection(service, card, bookBtn) {
    const index = selectedServices.findIndex(s => s.id === service.id);
    
    if (index === -1) {
        selectedServices.push(service);
        card.classList.add('selected');
        bookBtn.classList.add('added');
        bookBtn.innerHTML = '<span class="btn-icon">✓</span> Agregado';
        showNotification(`✅ ${service.name} añadido`, 'success');
        bookBtn.style.background = 'linear-gradient(135deg, #27ae60, #219653)';
    } else {
        selectedServices.splice(index, 1);
        card.classList.remove('selected');
        bookBtn.classList.remove('added');
        bookBtn.innerHTML = '<span class="btn-icon">➕</span> Agregar';
        showNotification(`🗑️ ${service.name} removido`, 'info');
        bookBtn.style.background = 'linear-gradient(135deg, #E75480, #D147A3)';
    }
    
    // Ocultar el indicador de servicios cuando se selecciona un servicio
    const indicator = getElement('servicesIndicator');
    if (indicator && indicator.style.display === 'block') {
        indicator.style.display = 'none';
    }
    
    // Actualizar recuadro flotante
    updateFloatingServices();
}

function initMobileKeyboardFix() {
    const bookingModal = getElement('bookingModal');
    const modalContent = document.querySelector('.modern-booking-modal');
    
    if (!bookingModal || !modalContent) return;
    
    const inputs = bookingModal.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            document.body.classList.add('modal-open');
            setTimeout(() => {
                this.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }, 300);
        });
        
        input.addEventListener('blur', function() {
            if (!bookingModal.querySelector('input:focus, select:focus, textarea:focus')) {
                document.body.classList.remove('modal-open');
            }
        });
    });
    
    window.addEventListener('resize', function() {
        if (window.innerHeight < 500) {
            modalContent.style.maxHeight = '95vh';
        } else {
            modalContent.style.maxHeight = '90vh';
        }
    });
}

async function openBookingModal() {
    if (isBookingPaused) {
        let message = '⏸️ Las citas están temporalmente desactivadas. Por favor, intente más tarde.';
        if (bookingResumeDate) {
            message = `⏸️ No hay citas disponibles hasta el ${bookingResumeDate}.`;
        }
        showNotification(message, 'warning');
        return;
    }
    
    if (selectedServices.length === 0) {
        showNotification('⚠️ Primero selecciona al menos un servicio', 'warning');
        return;
    }
    
    const modal = getElement('bookingModal');
    if (!modal) return;
    
    updateBookingPreview();
    modal.style.display = 'block';
    
    // 🔴 BLOQUEAR FORMULARIO SI LAS CITAS ESTÁN PAUSADAS
    const bookingForm = getElement('bookingForm');
    if (bookingForm) {
        bookingForm.style.opacity = isBookingPaused ? '0.5' : '1';
        bookingForm.style.pointerEvents = isBookingPaused ? 'none' : 'auto';
        
        // Mostrar mensaje de bloqueo
        const timeSlots = getElement('timeSlots');
        if (timeSlots && isBookingPaused) {
            timeSlots.innerHTML = `
                <div class="time-slots-placeholder" style="color: #e74c3c;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">⏸️</div>
                    <strong>CITAS PAUSADAS</strong>
                    <p style="margin-top: 5px; font-size: 0.9rem;">
                        ${bookingResumeDate ? `Reanudación: ${bookingResumeDate}` : 'No hay citas disponibles temporalmente'}
                    </p>
                </div>
            `;
        }
    }
    
    const dateInput = getElement('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
    
    const timeSlots = getElement('timeSlots');
    if (timeSlots && !isBookingPaused) {
        timeSlots.innerHTML = `
            <div class="time-slots-placeholder">
                <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
                <strong>Calculando disponibilidad...</strong>
                <p style="margin-top: 5px; font-size: 0.9rem;">Analizando horarios con IA</p>
            </div>
        `;
    }
    
    if (!isBookingPaused) {
        setTimeout(() => {
            generateTimeSlots();
        }, 300);
    }
    
    setTimeout(initMobileKeyboardFix, 100);
}

function closeBookingModal() {
    const modal = getElement('bookingModal');
    if (modal) {
        modal.style.display = 'none';
        selectedTime = null;
    }
}

function updateBookingPreview() {
    const servicesPreview = getElement('servicesPreview');
    const previewTotalPrice = getElement('previewTotalPrice');
    const previewTotalDuration = getElement('previewTotalDuration');
    const servicesCount = getElement('servicesCount');
    
    if (!servicesPreview || !previewTotalPrice || !previewTotalDuration || !servicesCount) return;
    
    servicesPreview.innerHTML = '';
    let totalPrice = 0;
    let totalDuration = 0;
    
    selectedServices.forEach(service => {
        totalPrice += service.price;
        totalDuration += service.duration;
        
        const serviceElement = document.createElement('div');
        serviceElement.className = 'preview-service-item';
        serviceElement.innerHTML = `
            <span class="preview-service-name">${service.name}</span>
            <div class="preview-service-details">
                <span class="preview-price">$${service.price}</span>
                <span class="preview-duration">${service.duration}min</span>
            </div>
        `;
        servicesPreview.appendChild(serviceElement);
    });
    
    previewTotalPrice.textContent = totalPrice;
    previewTotalDuration.textContent = totalDuration;
    servicesCount.textContent = `${selectedServices.length} servicio${selectedServices.length !== 1 ? 's' : ''}`;
}

// ========== GENERACIÓN DE HORARIOS INTELIGENTE ==========
async function generateTimeSlots() {
    const timeSlots = getElement('timeSlots');
    const dateInput = getElement('date');
    if (!timeSlots || !dateInput) return;

    const selectedDate = dateInput.value;
    
    timeSlots.innerHTML = '';
    selectedTime = null;

    if (!selectedDate) {
        timeSlots.innerHTML = `
            <div class="time-slots-placeholder">
                <div style="font-size: 2rem; margin-bottom: 10px;">📅</div>
                <strong>Selecciona una fecha primero</strong>
                <p style="margin-top: 5px; font-size: 0.9rem;">Elige la fecha para ver los horarios disponibles</p>
            </div>
        `;
        return;
    }

    try {
        const availability = await scheduleManager.calculateAvailability(selectedDate, selectedServices);
        const allSlots = scheduleManager.generateAllTimeSlots();
        
        let availableSlots = [];
        let unavailableSlots = [];

        allSlots.forEach(slot => {
            if (availability[slot].status === 'available') {
                availableSlots.push(slot);
            } else {
                unavailableSlots.push(slot);
            }
        });

        const timeGrid = document.createElement('div');
        timeGrid.className = 'time-slots-modern';
        
        availableSlots.forEach(slot => {
            const slotElement = createTimeSlot(slot, 'available', 'Disponible');
            timeGrid.appendChild(slotElement);
        });

        unavailableSlots.forEach(slot => {
            const slotElement = createTimeSlot(slot, 'unavailable', 'Ocupado');
            timeGrid.appendChild(slotElement);
        });
        
        timeSlots.appendChild(timeGrid);

    } catch (error) {
        console.error('❌ Error generando horarios:', error);
        timeSlots.innerHTML = `
            <div class="time-slots-placeholder">
                <div style="font-size: 2rem; margin-bottom: 10px;">❌</div>
                <strong>Error al cargar horarios</strong>
                <p style="margin-top: 5px; font-size: 0.9rem;">Intenta nuevamente</p>
            </div>
        `;
    }
}

function createTimeSlot(time, status, statusText) {
    const slotElement = document.createElement('button');
    slotElement.type = 'button';
    slotElement.className = `time-slot ${status}`;
    slotElement.innerHTML = `
        ${time}
        <span class="time-slot-status">${statusText}</span>
    `;
    
    if (status === 'available') {
        slotElement.addEventListener('click', function() {
            document.querySelectorAll('.time-slot.selected').forEach(s => {
                s.classList.remove('selected');
            });
            
            this.classList.add('selected');
            selectedTime = time;
            
            updateTimeSlotStatus(this, 'selected', 'Seleccionado');
            showNotification(`🕐 Hora seleccionada: ${selectedTime}`, 'success');
        });
    } else {
        slotElement.disabled = true;
    }
    
    return slotElement;
}

function updateTimeSlotStatus(element, status, statusText) {
    element.classList.remove('available', 'unavailable', 'selected');
    element.classList.add(status);
    
    const statusSpan = element.querySelector('.time-slot-status');
    if (statusSpan) {
        statusSpan.textContent = statusText;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// ========== CARRUSEL DE IMÁGENES ==========
function initCarousel() {
    carouselTrack = getElement('carouselTrack');
    
    if (!carouselTrack) return;
    
    // Configurar eventos táctiles
    carouselTrack.addEventListener('touchstart', touchStart);
    carouselTrack.addEventListener('touchmove', touchMove);
    carouselTrack.addEventListener('touchend', touchEnd);
    
    // Configurar eventos del mouse
    carouselTrack.addEventListener('mousedown', mouseDown);
    carouselTrack.addEventListener('mousemove', mouseMove);
    carouselTrack.addEventListener('mouseup', mouseUp);
    carouselTrack.addEventListener('mouseleave', mouseLeave);
    
    // Configurar botones de navegación
    const prevBtn = getElement('prevImage');
    const nextBtn = getElement('nextImage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateCarousel(-1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateCarousel(1));
    }
}

function touchStart(e) {
    e.preventDefault();
    startPos = e.touches[0].clientX;
    isDragging = true;
    carouselTrack.classList.add('touch-active');
    cancelAnimationFrame(animationID);
}

function touchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const currentPosition = e.touches[0].clientX;
    const diff = currentPosition - startPos;
    setPosition(currentTranslate + diff);
}

function touchEnd() {
    isDragging = false;
    carouselTrack.classList.remove('touch-active');
    const movedBy = currentTranslate - prevTranslate;
    
    if (movedBy < -100 && currentSlide < currentImages.length - 1) {
        currentSlide += 1;
    }
    
    if (movedBy > 100 && currentSlide > 0) {
        currentSlide -= 1;
    }
    
    setSlidePosition();
}

function mouseDown(e) {
    e.preventDefault();
    startPos = e.clientX;
    isDragging = true;
    carouselTrack.classList.add('touch-active');
    cancelAnimationFrame(animationID);
}

function mouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const currentPosition = e.clientX;
    const diff = currentPosition - startPos;
    setPosition(currentTranslate + diff);
}

function mouseUp() {
    isDragging = false;
    carouselTrack.classList.remove('touch-active');
    const movedBy = currentTranslate - prevTranslate;
    
    if (movedBy < -100 && currentSlide < currentImages.length - 1) {
        currentSlide += 1;
    }
    
    if (movedBy > 100 && currentSlide > 0) {
        currentSlide -= 1;
    }
    
    setSlidePosition();
}

function mouseLeave() {
    if (isDragging) {
        isDragging = false;
        carouselTrack.classList.remove('touch-active');
        setSlidePosition();
    }
}

function setPosition(position) {
    currentTranslate = position;
    carouselTrack.style.transform = `translateX(${currentTranslate}px)`;
}

function setSlidePosition() {
    const slideWidth = carouselTrack.clientWidth;
    currentTranslate = currentSlide * -slideWidth;
    prevTranslate = currentTranslate;
    
    carouselTrack.style.transform = `translateX(${currentTranslate}px)`;
    updateCarouselClasses();
    updateIndicators();
    updateImageInfo();
}

function navigateCarousel(direction) {
    const newSlide = currentSlide + direction;
    
    if (newSlide >= 0 && newSlide < currentImages.length) {
        currentSlide = newSlide;
        setSlidePosition();
        
        // Añadir animación
        carouselItems.forEach((item, index) => {
            if (index === currentSlide) {
                item.classList.add('slide-in-left');
                setTimeout(() => item.classList.remove('slide-in-left'), 500);
            }
        });
    }
}

function updateCarouselClasses() {
    if (!carouselItems.length) return;
    
    carouselItems.forEach((item, index) => {
        item.classList.remove('active', 'prev', 'next', 'far-prev', 'far-next');
        
        if (index === currentSlide) {
            item.classList.add('active');
        } else if (index === currentSlide - 1) {
            item.classList.add('prev');
        } else if (index === currentSlide + 1) {
            item.classList.add('next');
        } else if (index === currentSlide - 2) {
            item.classList.add('far-prev');
        } else if (index === currentSlide + 2) {
            item.classList.add('far-next');
        }
    });
}

function updateIndicators() {
    const indicatorsContainer = getElement('carouselIndicators');
    if (!indicatorsContainer) return;
    
    indicatorsContainer.innerHTML = '';
    
    currentImages.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = `carousel-indicator ${index === currentSlide ? 'active' : ''}`;
        indicator.addEventListener('click', () => {
            currentSlide = index;
            setSlidePosition();
        });
        indicatorsContainer.appendChild(indicator);
    });
}

function updateImageInfo() {
    const imageInfo = getElement('imageInfo');
    if (!imageInfo || !currentImages[currentSlide]) return;
    
    const currentImage = currentImages[currentSlide];
    imageInfo.innerHTML = `
        <h3>${currentImage.descripcion || currentImage.nombre || 'Imagen'}</h3>
        ${currentImage.precio ? `<p>Precio: $${currentImage.precio}</p>` : ''}
        ${currentImage.descripcion && !currentImage.precio ? `<p>${currentImage.descripcion}</p>` : ''}
    `;
}

// ========== FUNCIÓN MEJORADA PARA CARGAR PRODUCTOS ==========
async function loadProducts() {
    try {
        const response = await fetch('js/galeria.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar galeria.json');
        }
        const data = await response.json();
        const productsContainer = getElement('productsContainer');
        
        if (!productsContainer) return;
        
        productsContainer.innerHTML = '';
        
        // Verificar que hay productos
        if (!data.productos || !Array.isArray(data.productos)) {
            productsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">📦</div>
                    <h3>No hay productos disponibles</h3>
                    <p>Pronto agregaremos nuestros productos exclusivos</p>
                </div>
            `;
            return;
        }
        
        data.productos.forEach((product, index) => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image-container">
                    <img src="imagenes/productos/${product.imagen}" alt="${product.nombre}" 
                         class="product-image" loading="lazy"
                         onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2R1Y3RvPC90ZXh0Pjwvc3ZnPg=='">
                </div>
                <div class="product-content">
                    <h3>${product.nombre}</h3>
                    <p class="product-description">${product.descripcion}</p>
                    <div class="product-price">$${product.precio}</div>
                </div>
            `;
            
            productCard.addEventListener('click', () => {
                openProductCarousel(index);
            });
            
            productsContainer.appendChild(productCard);
        });
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        const productsContainer = getElement('productsContainer');
        if (productsContainer) {
            productsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">❌</div>
                    <h3>Error al cargar productos</h3>
                    <p>No se pudieron cargar los productos. Intenta recargar la página.</p>
                </div>
            `;
        }
    }
}

// ========== FUNCIÓN MEJORADA PARA CARGAR GALERÍA ==========
async function loadGallery() {
    try {
        const galleryContainer = getElement('galleryContainer');
        
        if (!galleryContainer) return;
        
        galleryContainer.innerHTML = '';
        
        // Array de imágenes de galería - ajustado a tu estructura
        const galeriaTrabajos = [
            { id: 1, archivo: "imagen1.jpg", descripcion: "Trabajo profesional de coloración" },
            { id: 2, archivo: "imagen2.jpg", descripcion: "Corte y peinado moderno" },
            { id: 3, archivo: "imagen3.jpg", descripcion: "Extensiones de cabello" },
            { id: 4, archivo: "imagen4.jpg", descripcion: "Tratamiento de keratina" },
            { id: 5, archivo: "imagen5.jpg", descripcion: "Peinado para eventos" },
            { id: 6, archivo: "imagen6.jpg", descripcion: "Coloración fantasía" },
            { id: 7, archivo: "imagen7.jpg", descripcion: "Corte profesional" },
            { id: 8, archivo: "imagen8.jpg", descripcion: "Maquillaje y estilismo" }
        ];
        
        currentImages = galeriaTrabajos;
        
        galeriaTrabajos.forEach((image, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.innerHTML = `
                <img src="imagenes/Galería-Trabajo/${image.archivo}" alt="${image.descripcion}" 
                     class="gallery-image" loading="lazy"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbGVyXHUwMGVkYSBkZSBUcmFiYWpvczwvdGV4dD48L3N2Zz4='">
                <div class="gallery-overlay">
                    <div class="gallery-text">${image.descripcion}</div>
                </div>
            `;
            
            galleryItem.addEventListener('click', () => openGalleryCarousel(index));
            galleryContainer.appendChild(galleryItem);
        });
    } catch (error) {
        console.error('❌ Error cargando galería:', error);
        const galleryContainer = getElement('galleryContainer');
        if (galleryContainer) {
            galleryContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">❌</div>
                    <h3>Error al cargar galería</h3>
                    <p>No se pudieron cargar las imágenes. Intenta recargar la página.</p>
                </div>
            `;
        }
    }
}

// ========== FUNCIÓN MEJORADA PARA ABRIR GALERÍA ==========
function openGalleryCarousel(index) {
    const viewerModal = getElement('imageViewerModal');
    const carouselTrack = getElement('carouselTrack');
    
    if (!viewerModal || !carouselTrack) return;
    
    currentSlide = index;
    carouselTrack.innerHTML = '';
    carouselItems = [];
    
    currentImages.forEach((image, idx) => {
        const carouselItem = document.createElement('div');
        carouselItem.className = 'carousel-item';
        if (idx === currentSlide) carouselItem.classList.add('active');
        
        const img = document.createElement('img');
        img.src = `imagenes/Galería-Trabajo/${image.archivo}`;
        img.alt = image.descripcion;
        img.loading = 'lazy';
        img.style.maxHeight = '70vh';
        img.style.objectFit = 'contain';
        
        img.onerror = function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbGVyXHUwMGVkYSBkZSBUcmFiYWpvczwvdGV4dD48L3N2Zz4=';
        };
        
        carouselItem.appendChild(img);
        carouselTrack.appendChild(carouselItem);
        carouselItems.push(carouselItem);
    });
    
    viewerModal.style.display = 'block';
    setTimeout(() => {
        setSlidePosition();
        updateIndicators();
        updateImageInfo();
    }, 50);
}

// ========== FUNCIÓN MEJORADA PARA ABRIR PRODUCTOS ==========
function openProductCarousel(index) {
    fetch('js/galeria.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar productos');
            }
            return response.json();
        })
        .then(data => {
            const viewerModal = getElement('imageViewerModal');
            const carouselTrack = getElement('carouselTrack');
            
            if (!viewerModal || !carouselTrack) return;
            
            currentImages = data.productos.map((product, idx) => ({
                id: idx + 1,
                archivo: product.imagen,
                descripcion: product.nombre,
                precio: product.precio,
                nombre: product.nombre
            }));
            
            currentSlide = index;
            carouselTrack.innerHTML = '';
            carouselItems = [];
            
            currentImages.forEach((product, idx) => {
                const carouselItem = document.createElement('div');
                carouselItem.className = 'carousel-item';
                if (idx === currentSlide) carouselItem.classList.add('active');
                
                const img = document.createElement('img');
                img.src = `imagenes/productos/${product.archivo}`;
                img.alt = product.descripcion;
                img.loading = 'lazy';
                img.style.maxHeight = '70vh';
                img.style.objectFit = 'contain';
                
                img.onerror = function() {
                    this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2R1Y3RvPC90ZXh0Pjwvc3ZnPg==';
                };
                
                carouselItem.appendChild(img);
                carouselTrack.appendChild(carouselItem);
                carouselItems.push(carouselItem);
            });
            
            viewerModal.style.display = 'block';
            setTimeout(() => {
                setSlidePosition();
                updateIndicators();
                updateImageInfo();
            }, 50);
        })
        .catch(error => {
            console.error('Error cargando productos para carrusel:', error);
            showNotification('❌ Error al cargar las imágenes', 'error');
        });
}

function closeImageViewer() {
    const viewerModal = getElement('imageViewerModal');
    if (viewerModal) {
        viewerModal.style.display = 'none';
    }
}

function initializeDateInput() {
    const dateInput = getElement('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
        
        dateInput.addEventListener('change', function() {
            selectedTime = null;
            
            const timeSlots = getElement('timeSlots');
            if (timeSlots) {
                timeSlots.innerHTML = `
                    <div class="time-slots-placeholder">
                        <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
                        <strong>Calculando disponibilidad...</strong>
                        <p style="margin-top: 5px; font-size: 0.9rem;">Analizando horarios para ${this.value}</p>
                    </div>
                `;
            }
            
            setTimeout(() => {
                generateTimeSlots();
            }, 500);
        });
        
        setTimeout(() => {
            generateTimeSlots();
        }, 1000);
    }
}

async function setupBookingForm() {
    const bookingForm = getElement('bookingForm');
    if (!bookingForm) return;
    
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (isBookingPaused) {
            let message = '⏸️ Las citas están temporalmente desactivadas. Por favor, intente más tarde.';
            if (bookingResumeDate) {
                message = `⏸️ No hay citas disponibles hasta el ${bookingResumeDate}.`;
            }
            showNotification(message, 'warning');
            return;
        }
        
        if (selectedServices.length === 0) {
            showNotification('⚠️ Selecciona al menos un servicio', 'warning');
            return;
        }
        
        if (!selectedTime) {
            showNotification('⚠️ Selecciona una hora para tu cita', 'warning');
            return;
        }
        
        const formData = new FormData(this);
        const date = formData.get('date');
        const name = formData.get('name');
        const phone = formData.get('phone');
        
        if (!date || !name || !phone) {
            showNotification('⚠️ Completa todos los campos requeridos', 'warning');
            return;
        }
        
        if (phone.length < 8) {
            showNotification('⚠️ Ingresa un número de teléfono válido', 'warning');
            return;
        }
        
        try {
            // 🔴 VERIFICACIÓN DOBLE: PRIMERO SI LAS CITAS ESTÁN PAUSADAS
            const configDoc = await getDoc(configRef);
            if (configDoc.exists()) {
                const configData = configDoc.data();
                if (configData.isPaused) {
                    let message = '⏸️ Las citas están temporalmente desactivadas.';
                    if (configData.resumeDate) {
                        message = `⏸️ No hay citas disponibles hasta el ${configData.resumeDate}.`;
                    }
                    showNotification(message, 'warning');
                    closeBookingModal();
                    return;
                }
            }
            
            const availabilityCheck = await scheduleManager.checkSpecificAvailability(date, selectedTime, selectedServices);
            
            if (!availabilityCheck.available) {
                showNotification(`❌ ${availabilityCheck.reason}. Por favor, selecciona otro horario.`, 'error');
                generateTimeSlots();
                return;
            }
            
            const total = selectedServices.reduce((sum, service) => sum + service.price, 0);
            const duration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
            
            const docRef = await addDoc(collection(db, "citas"), {
                fecha: date,
                hora: selectedTime,
                nombre: name,
                telefono: phone,
                servicios: selectedServices.map(s => s.name),
                total: total,
                duracion: duration,
                estado: 'confirmada',
                timestamp: new Date(),
                codigo: generateBookingCode()
            });
            
            showCentralConfirmation(name, selectedTime, date);
            
            closeBookingModal();
            
            // Limpiar servicios seleccionados
            selectedServices = [];
            updateFloatingServices();
            
            // Resetear formulario
            bookingForm.reset();
            selectedTime = null;
            
            const dateInput = getElement('date');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
            }
            
            generateTimeSlots();
            
        } catch (error) {
            console.error('❌ Error guardando cita:', error);
            showNotification('❌ Error al guardar la cita. Por favor, intenta nuevamente.', 'error');
        }
    });
}

function showCentralConfirmation(clientName, time, date) {
    const confirmationOverlay = document.createElement('div');
    confirmationOverlay.className = 'central-confirmation-overlay';
    confirmationOverlay.innerHTML = `
        <div class="central-confirmation-content">
            <div class="confirmation-icon">✅</div>
            <h2>¡Cita Confirmada!</h2>
            <p class="confirmation-message">${clientName}, tu cita ha sido agendada exitosamente</p>
            <div class="confirmation-details">
                <div class="confirmation-detail">
                    <span class="detail-icon">📅</span>
                    <span>${date}</span>
                </div>
                <div class="confirmation-detail">
                    <span class="detail-icon">⏰</span>
                    <span>${time}</span>
                </div>
                <div class="confirmation-detail">
                    <span class="detail-icon">📍</span>
                    <span>Tellstrase 32, 8400 Winterthur</span>
                </div>
            </div>
            <div class="confirmation-actions">
                <button class="btn-confirmation-close">Entendido</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmationOverlay);
    
    const styles = `
        .central-confirmation-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
        
        .central-confirmation-content {
            background: linear-gradient(135deg, #27ae60, #219653);
            color: white;
            padding: 40px 30px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideInUp 0.5s ease;
        }
        
        .confirmation-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            animation: bounce 1s ease;
        }
        
        .central-confirmation-content h2 {
            font-size: 1.8rem;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .confirmation-message {
            font-size: 1.1rem;
            margin-bottom: 25px;
            opacity: 0.9;
        }
        
        .confirmation-details {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
        }
        
        .confirmation-detail {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            justify-content: center;
        }
        
        .confirmation-detail:last-child {
            margin-bottom: 0;
        }
        
        .detail-icon {
            font-size: 1.2rem;
        }
        
        .btn-confirmation-close {
            background: white;
            color: #27ae60;
            border: none;
            padding: 12px 30px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
        }
        
        .btn-confirmation-close:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideInUp {
            from { 
                opacity: 0;
                transform: translateY(50px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }
    `;
    
    if (!document.querySelector('#confirmation-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'confirmation-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    confirmationOverlay.querySelector('.btn-confirmation-close').addEventListener('click', () => {
        confirmationOverlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (confirmationOverlay.parentNode) {
                confirmationOverlay.remove();
            }
        }, 300);
    });
    
    confirmationOverlay.addEventListener('click', (e) => {
        if (e.target === confirmationOverlay) {
            confirmationOverlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (confirmationOverlay.parentNode) {
                    confirmationOverlay.remove();
                }
            }, 300);
        }
    });
}

function generateBookingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// ========== CONFIGURACIÓN MODAL ADMIN - COMPLETAMENTE CORREGIDO ==========
function openAdminModal() {
    console.log("🔓 Abriendo modal admin...");
    const adminModal = getElement('adminModal');
    if (adminModal) {
        // Limpiar listeners anteriores (NUEVO)
        cleanUpListeners();
        
        // Mostrar la sección de autenticación primero
        const adminAuth = getElement('adminAuth');
        const adminContent = getElement('adminContent');
        
        if (adminAuth) adminAuth.style.display = 'block';
        if (adminContent) {
            adminContent.style.display = 'none';
            adminContent.innerHTML = '';
        }
        
        // Limpiar formulario
        const adminPasswordInput = getElement('adminPasswordInput');
        if (adminPasswordInput) adminPasswordInput.value = '';
        
        adminModal.style.display = 'block';
        adminModal.classList.add('show');
        
        // Enfocar el campo de contraseña automáticamente
        setTimeout(() => {
            const passwordInput = getElement('adminPasswordInput');
            if (passwordInput) passwordInput.focus();
        }, 300);
    }
}

function setupAdminModal() {
    console.log("🛠️ Configurando modal admin...");
    
    const adminBtn = getElement('adminBtn');
    const adminModal = getElement('adminModal');
    
    if (adminBtn && adminModal) {
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openAdminModal();
        });
    }

    // Configurar evento para cerrar modal admin
    const closeAdminBtn = adminModal?.querySelector('.close');
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log("❌ Cerrando modal admin...");
            
            // Limpiar listeners (NUEVO)
            cleanUpListeners();
            
            adminModal.style.display = 'none';
            adminModal.classList.remove('show');
            
            // Limpiar formulario
            const adminPasswordInput = getElement('adminPasswordInput');
            if (adminPasswordInput) adminPasswordInput.value = '';
            
            // Asegurar que volvemos al inicio
            switchSection('inicio');
            
            // Mostrar confirmación
            showNotification('🏠 Volviendo al inicio', 'info');
        });
    }

    // Configurar botón admin en menú móvil
    const adminMobileBtn = document.getElementById('adminMobileBtn');
    if (adminMobileBtn) {
        adminMobileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            openAdminModal();
            
            // Cerrar menú móvil después de hacer clic
            const navCompact = document.querySelector('.nav-compact');
            const mobileMenuToggle = document.getElementById('mobileMenuToggle');
            if (navCompact && navCompact.classList.contains('mobile-open')) {
                navCompact.classList.remove('mobile-open');
                mobileMenuToggle.classList.remove('active');
            }
        });
    }

    // Configurar el formulario de autenticación
    const adminAuthForm = getElement('adminAuthForm');
    if (adminAuthForm) {
        adminAuthForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const passwordInput = getElement('adminPasswordInput');
            if (passwordInput && passwordInput.value === 'y1994') {
                console.log("✅ Contraseña correcta - accediendo al panel");
                
                // Contraseña correcta, mostrar contenido de admin
                const adminAuth = getElement('adminAuth');
                const adminContent = getElement('adminContent');
                
                if (adminAuth) adminAuth.style.display = 'none';
                if (adminContent) {
                    adminContent.style.display = 'block';
                    // Asegurar que el botón de retorno se cree
                    setTimeout(() => {
                        // Forzar la creación del botón de retorno
                        const adminModal = getElement('adminModal');
                        if (adminModal && adminModal.style.display === 'block') {
                            console.log("🔄 Forzando creación de botón de retorno...");
                            initBackButtonControl();
                        }
                    }, 100);
                }
                
                loadAdminContent();
                showNotification('🔓 Acceso admin concedido', 'success');
            } else {
                showNotification('❌ Contraseña incorrecta', 'error');
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }
}

// ========== PANEL DE ADMINISTRACIÓN COMPACTO ==========
async function loadAdminContent() {
    console.log("📋 Cargando contenido admin...");
    
    const adminContent = getElement('adminContent');
    if (!adminContent) return;
    
    try {
        const configDoc = await getDoc(configRef);
        const configData = configDoc.exists() ? configDoc.data() : { isPaused: false, resumeDate: '' };
        
        adminContent.innerHTML = `
            <div class="admin-content-container">
                <div class="admin-header" id="adminHeader">
                    <h2>🔧 Panel Admin</h2>
                    <p>Gestión de citas y horarios</p>
                    
                    <div class="admin-global-controls">
                        <div class="control-group">
                            <button class="btn ${configData.isPaused ? 'btn-success' : 'btn-warning'}" id="toggleBookingBtn">
                                ${configData.isPaused ? '▶️ Reanudar' : '⏸️ Pausar'}
                            </button>
                            
                            <div class="resume-date-control" ${!configData.isPaused ? 'style="display: none;"' : ''}>
                                <label for="resumeDateInput">Reanudación:</label>
                                <input type="date" id="resumeDateInput" value="${configData.resumeDate || ''}" class="modern-input">
                                <button class="btn btn-sm" id="saveResumeDateBtn">💾 Guardar</button>
                            </div>
                            
                            <p class="status-indicator ${configData.isPaused ? 'paused' : 'active'}">
                                <strong>${configData.isPaused ? '⏸️ CITAS PAUSADAS' : '✅ CITAS ACTIVAS'}</strong>
                                ${configData.isPaused && configData.resumeDate ? `<br><small>Reanuda: ${configData.resumeDate}</small>` : ''}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="admin-tabs">
                    <button class="tab-btn active" data-tab="citas">📅 Citas (<span id="citasCount">0</span>)</button>
                    <button class="tab-btn" data-tab="estadisticas">📊 Stats</button>
                </div>
                
                <div class="admin-content">
                    <div id="citasTab" class="tab-content active">
                        <div class="citas-header">
                            <h3>Citas Confirmadas</h3>
                            <div class="citas-stats">
                                <span class="stat-item">Total: <strong id="totalCitas">0</strong></span>
                                <span class="stat-item">Hoy: <strong id="citasHoy">0</strong></span>
                                <span class="stat-item">Pend: <strong id="citasPendientes">0</strong></span>
                            </div>
                        </div>
                        <div class="citas-list-container">
                            <div id="citasList" class="citas-list">
                                Cargando citas...
                            </div>
                        </div>
                    </div>
                    
                    <div id="estadisticasTab" class="tab-content">
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">💰</div>
                                <div class="stat-info">
                                    <span class="stat-value">$<span id="ingresosHoy">0</span></span>
                                    <span class="stat-label">Hoy</span>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">⏰</div>
                                <div class="stat-info">
                                    <span class="stat-value"><span id="tiempoTotal">0</span>m</span>
                                    <span class="stat-label">Tiempo</span>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">👥</div>
                                <div class="stat-info">
                                    <span class="stat-value"><span id="clientesHoy">0</span></span>
                                    <span class="stat-label">Clientes</span>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">📊</div>
                                <div class="stat-info">
                                    <span class="stat-value">$<span id="ingresosTotales">0</span></span>
                                    <span class="stat-label">Total</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Configurar scroll para hacer compacto el header
        const adminContentContainer = adminContent.querySelector('.admin-content-container');
        const adminHeader = getElement('adminHeader');
        
        if (adminContentContainer && adminHeader) {
            adminContentContainer.addEventListener('scroll', function() {
                if (this.scrollTop > 50) {
                    adminHeader.classList.add('compact');
                } else {
                    adminHeader.classList.remove('compact');
                }
            });
        }
        
        // Configurar eventos del panel admin
        setupAdminControls();
        loadCitas();
        loadEstadisticas();
        setupAdminTabs();
        
    } catch (error) {
        console.error('Error cargando contenido admin:', error);
        adminContent.innerHTML = '<div style="padding: 20px; text-align: center; color: #e74c3c;">❌ Error cargando el panel</div>';
    }
}

function setupAdminControls() {
    // Botón de pausar/reanudar citas
    const toggleBookingBtn = getElement('toggleBookingBtn');
    if (toggleBookingBtn) {
        toggleBookingBtn.addEventListener('click', async function() {
            try {
                const configDoc = await getDoc(configRef);
                const currentData = configDoc.exists() ? configDoc.data() : { isPaused: false, resumeDate: '' };
                
                const newIsPaused = !currentData.isPaused;
                
                await updateDoc(configRef, {
                    isPaused: newIsPaused,
                    lastUpdated: new Date()
                });
                
                showNotification(
                    newIsPaused ? '⏸️ Citas pausadas' : '✅ Citas reanudadas',
                    newIsPaused ? 'warning' : 'success'
                );
                
                // Si se reanudan, eliminar la fecha de reanudación
                if (!newIsPaused) {
                    await updateDoc(configRef, {
                        resumeDate: '',
                        lastUpdated: new Date()
                    });
                }
                
            } catch (error) {
                console.error('Error actualizando estado:', error);
                showNotification('❌ Error actualizando el estado', 'error');
            }
        });
    }
    
    // Botón para guardar fecha de reanudación
    const saveResumeDateBtn = getElement('saveResumeDateBtn');
    if (saveResumeDateBtn) {
        saveResumeDateBtn.addEventListener('click', async function() {
            const resumeDateInput = getElement('resumeDateInput');
            if (!resumeDateInput || !resumeDateInput.value) {
                showNotification('⚠️ Selecciona una fecha válida', 'warning');
                return;
            }
            
            try {
                await updateDoc(configRef, {
                    resumeDate: resumeDateInput.value,
                    lastUpdated: new Date()
                });
                
                showNotification('✅ Fecha de reanudación guardada', 'success');
            } catch (error) {
                console.error('Error guardando fecha:', error);
                showNotification('❌ Error guardando la fecha', 'error');
            }
        });
    }
    
    // Mostrar/ocultar control de fecha según estado
    const configObserver = onSnapshot(configRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const resumeDateControl = document.querySelector('.resume-date-control');
            const statusIndicator = document.querySelector('.status-indicator');
            
            if (resumeDateControl) {
                resumeDateControl.style.display = data.isPaused ? 'block' : 'none';
            }
            
            if (statusIndicator) {
                statusIndicator.className = `status-indicator ${data.isPaused ? 'paused' : 'active'}`;
                let statusHTML = `<strong>${data.isPaused ? '⏸️ CITAS PAUSADAS' : '✅ CITAS ACTIVAS'}</strong>`;
                if (data.isPaused && data.resumeDate) {
                    statusHTML += `<br><small>Reanuda: ${data.resumeDate}</small>`;
                }
                statusIndicator.innerHTML = statusHTML;
            }
        }
    });
    
    // Guardar el listener para limpiarlo después
    appointmentListeners.push(configObserver);
}

function setupAdminTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab') + 'Tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ========== NUEVO SISTEMA DE CONTADOR DE CITAS - SIN DUPLICADOS ==========
function loadCitas() {
    const citasList = document.getElementById('citasList');
    if (!citasList) return;
    
    // Limpiar listener anterior si existe
    if (appointmentsUnsubscribe) {
        appointmentsUnsubscribe();
    }
    
    const q = query(collection(db, "citas"), orderBy("timestamp", "desc"));
    
    // Solo un listener activo a la vez
    appointmentsUnsubscribe = onSnapshot(q, (snapshot) => {
        citasList.innerHTML = '';
        
        if (snapshot.empty) {
            citasList.innerHTML = '<div class="no-citas"><p>📭 No hay citas programadas</p></div>';
            updateCitasCount(0, 0, 0);
            return;
        }
        
        let totalCitas = 0;
        let citasHoy = 0;
        let citasPendientes = 0;
        const today = new Date().toISOString().split('T')[0];
        
        snapshot.forEach((doc) => {
            const cita = doc.data();
            totalCitas++;
            
            if (cita.fecha === today) {
                citasHoy++;
            }
            
            if (cita.estado === 'confirmada') {
                citasPendientes++;
            }
            
            const citaElement = document.createElement('div');
            citaElement.className = `cita-item ${cita.estado}`;
            citaElement.innerHTML = `
                <div class="cita-header">
                    <div class="cita-cliente">
                        <h4>👤 ${cita.nombre}</h4>
                        <span class="cita-telefono">📞 ${cita.telefono}</span>
                        ${cita.codigo ? `<span class="cita-codigo">🔑 ${cita.codigo}</span>` : ''}
                    </div>
                    <div class="cita-estado-badge ${cita.estado}">
                        ${cita.estado === 'confirmada' ? '✅ Confirmada' : '❌ Cancelada'}
                    </div>
                </div>
                
                <div class="cita-details">
                    <div class="cita-fecha">
                        <strong>📅 ${cita.fecha}</strong>
                        <span class="cita-hora">⏰ ${cita.hora}</span>
                    </div>
                    <div class="cita-servicios">
                        <strong>💇 Servicios:</strong> 
                        <span>${cita.servicios.join(', ')}</span>
                    </div>
                    <div class="cita-totales">
                        <span class="cita-precio">💰 $${cita.total}</span>
                        <span class="cita-duracion">⏱️ ${cita.duracion}min</span>
                    </div>
                </div>
                
                <div class="cita-actions">
                    <button class="btn btn-danger btn-sm" onclick="cancelarCita('${doc.id}')">
                        ❌ Cancelar Cita
                    </button>
                </div>
            `;
            citasList.appendChild(citaElement);
        });

        updateCitasCount(totalCitas, citasHoy, citasPendientes);
    });
    
    // Guardar referencia para limpiar después
    appointmentListeners.push(() => {
        if (appointmentsUnsubscribe) {
            appointmentsUnsubscribe();
            appointmentsUnsubscribe = null;
        }
    });
}

function updateCitasCount(total, hoy, pendientes) {
    const totalCitasElement = getElement('totalCitas');
    const citasHoyElement = getElement('citasHoy');
    const citasPendientesElement = getElement('citasPendientes');
    const citasCountElement = getElement('citasCount');
    
    if (totalCitasElement) totalCitasElement.textContent = total;
    if (citasHoyElement) citasHoyElement.textContent = hoy;
    if (citasPendientesElement) citasPendientesElement.textContent = pendientes;
    if (citasCountElement) citasCountElement.textContent = hoy; // Mostrar citas de hoy en la pestaña
}

// ========== NUEVO SISTEMA DE ESTADÍSTICAS - SIN DUPLICADOS ==========
function loadEstadisticas() {
    // Limpiar listener anterior si existe
    if (statsUnsubscribe) {
        statsUnsubscribe();
    }
    
    const q = query(collection(db, "citas"), orderBy("timestamp", "desc"));
    
    // Solo un listener activo a la vez
    statsUnsubscribe = onSnapshot(q, (snapshot) => {
        let ingresosHoy = 0;
        let tiempoTotal = 0;
        let clientesHoy = 0;
        let ingresosTotales = 0;
        const today = new Date().toISOString().split('T')[0];
        const clientesSet = new Set();
        
        snapshot.forEach((doc) => {
            const cita = doc.data();
            
            ingresosTotales += cita.total;
            
            if (cita.fecha === today && cita.estado === 'confirmada') {
                ingresosHoy += cita.total;
                tiempoTotal += cita.duracion;
                clientesSet.add(cita.telefono);
            }
        });
        
        clientesHoy = clientesSet.size;

        const ingresosHoyElement = getElement('ingresosHoy');
        const tiempoTotalElement = getElement('tiempoTotal');
        const clientesHoyElement = getElement('clientesHoy');
        const ingresosTotalesElement = getElement('ingresosTotales');
        
        if (ingresosHoyElement) ingresosHoyElement.textContent = ingresosHoy;
        if (tiempoTotalElement) tiempoTotalElement.textContent = tiempoTotal;
        if (clientesHoyElement) clientesHoyElement.textContent = clientesHoy;
        if (ingresosTotalesElement) ingresosTotalesElement.textContent = ingresosTotales;
    });
    
    // Guardar referencia para limpiar después
    appointmentListeners.push(() => {
        if (statsUnsubscribe) {
            statsUnsubscribe();
            statsUnsubscribe = null;
        }
    });
}

async function cancelarCita(citaId) {
    if (confirm('¿Estás seguro de cancelar esta cita? El horario quedará disponible para otros clientes.')) {
        try {
            await deleteDoc(doc(db, "citas", citaId));
            showNotification('✅ Cita cancelada - El horario ahora está disponible', 'success');
            
            const bookingModal = getElement('bookingModal');
            if (bookingModal && bookingModal.style.display === 'block') {
                generateTimeSlots();
            }
        } catch (error) {
            console.error('Error cancelando cita:', error);
            showNotification('❌ Error cancelando cita', 'error');
        }
    }
}

function updateAdminControls() {
    // Esta función se llama cuando cambia la configuración
    const toggleBookingBtn = getElement('toggleBookingBtn');
    if (toggleBookingBtn) {
        toggleBookingBtn.textContent = isBookingPaused ? '▶️ Reanudar Citas' : '⏸️ Pausar Citas';
        toggleBookingBtn.className = `btn ${isBookingPaused ? 'btn-success' : 'btn-warning'}`;
    }
}

function setupGlobalEventListeners() {
    document.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                // Limpiar listeners si es el modal admin (NUEVO)
                if (modal.id === 'adminModal') {
                    cleanUpListeners();
                }
                
                modal.style.display = 'none';
                modal.classList.remove('show');
                
                // Si es el modal admin, limpiar formulario
                if (modal.id === 'adminModal') {
                    const adminPasswordInput = getElement('adminPasswordInput');
                    if (adminPasswordInput) adminPasswordInput.value = '';
                    
                    // Ir al inicio
                    switchSection('inicio');
                    showNotification('🏠 Volviendo al inicio', 'info');
                }
            }
        });
    });
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            // Limpiar listeners si es el modal admin (NUEVO)
            if (modal.id === 'adminModal') {
                cleanUpListeners();
            }
            
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    });
    
    const closeSuccessBtn = getElement('closeSuccessModal');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', closeSuccessModal);
    }
    
    const prevImageBtn = getElement('prevImage');
    const nextImageBtn = getElement('nextImage');
    
    if (prevImageBtn) prevImageBtn.addEventListener('click', () => navigateCarousel(-1));
    if (nextImageBtn) nextImageBtn.addEventListener('click', () => navigateCarousel(1));
}

function closeSuccessModal() {
    const successModal = getElement('successModal');
    if (successModal) {
        successModal.style.display = 'none';
    }
}

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            switchSection(targetSection);
        });
    });
}

// ========== INICIALIZACIÓN PRINCIPAL MEJORADA ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación YennyHair-Salón...');
    
    // Inicializar configuración de Firebase
    initBookingConfig();
    
    // Inicializar control del botón atrás del móvil (PRIMERO y principal)
    initBackButtonControl();
    
    // Inicializar componentes
    initHeaderScroll();
    initMobileMenu();
    initPortalNavigation();
    initNavigation();
    initSmartBooking();
    initCarousel();
    initFloatingServices();
    
    // Inicializar el control del indicador de servicios
    initServicesIndicatorScroll();
    
    // Cargar contenido con manejo de errores
    try {
        loadServices();
        loadProducts();
        loadGallery();
        initializeDateInput();
    } catch (error) {
        console.error('❌ Error cargando contenido:', error);
        showNotification('⚠️ Error cargando algunos elementos', 'warning');
    }
    
    // Configurar eventos globales
    setupGlobalEventListeners();
    setupBookingForm();
    setupAdminModal();
    
    console.log('✅ Aplicación cargada correctamente');
    
    // Forzar que el botón atrás funcione incluso si hay problemas
    setTimeout(() => {
        console.log('🔄 Verificando sistema de botón atrás...');
        // Reforzar la inicialización
        initBackButtonControl();
    }, 1000);
});

// ========== FUNCIONES GLOBALES ==========
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.openGalleryCarousel = openGalleryCarousel;
window.openProductCarousel = openProductCarousel;
window.closeImageViewer = closeImageViewer;
window.navigateCarousel = navigateCarousel;
window.cancelarCita = cancelarCita;
window.switchSection = switchSection;
window.scrollToServices = scrollToServices;
window.openAdminModal = openAdminModal;
window.removeService = removeService;
window.initBackButtonControl = initBackButtonControl;
window.cleanUpListeners = cleanUpListeners;
window.showServicesIndicator = showServicesIndicator;