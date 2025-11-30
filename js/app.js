// ========== VARIABLES GLOBALES ==========
let currentImages = [];
let currentImageIndex = 0;
let currentAppointments = [];
let selectedTime = null;
let selectedServices = [];
let isBookingPaused = false;
let lastScrollTop = 0;
let currentSection = 'inicio';
let zoomLevel = 1;

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
    getDocs
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

// ========== SERVICIOS CON RUTAS CORREGIDAS ==========
const services = [
    {
        id: 1,
        name: "Lavado normal",
        price: 55,
        duration: 30,
        image: "imagenes/servicios/lavado solo.png",
        description: "Lavado y secado profesional",
        category: "basico"
    },
    {
        id: 2,
        name: "Lavado con línea",
        price: 70,
        duration: 60,
        image: "imagenes/servicios/lavado con linea.png",
        description: "Lavado con corte de puntas",
        category: "basico"
    },
    {
        id: 3,
        name: "Lavado con rolos",
        price: 75,
        duration: 90,
        image: "imagenes/servicios/lavado con rolos.png",
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
        image: "imagenes/servicios/botox capilar.png",
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
        image: "imagenes/servicios/extensiones por lineas.png",
        description: "Extensiones por línea",
        category: "extensiones"
    },
    {
        id: 9,
        name: "Extensiones completas",
        price: 200,
        duration: 180,
        image: "imagenes/servicios/extensiones completas.png",
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

    // NUEVO: Configurar botón admin en menú móvil
    const adminMobileBtn = document.getElementById('adminMobileBtn');
    if (adminMobileBtn) {
        adminMobileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAdminModal();
            
            // Cerrar menú móvil después de hacer clic
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

function showServicesIndicator() {
    const indicator = getElement('servicesIndicator');
    if (indicator) {
        indicator.style.display = 'block';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 8000);
    }
}

function initSmartBooking() {
    const bookingBtn = getElement('bookingBtn');
    const heroBookingBtn = getElement('heroBookingBtn');
    const bigBookingBtn = getElement('bigBookingBtn');
    const bigBookingContainer = getElement('bigBookingContainer');
    
    if (bookingBtn) {
        bookingBtn.addEventListener('click', handleBookingButtonClick);
    }
    
    if (heroBookingBtn) {
        heroBookingBtn.addEventListener('click', handleBookingButtonClick);
    }
    
    if (bigBookingBtn) {
        bigBookingBtn.addEventListener('click', function() {
            if (bigBookingContainer) {
                bigBookingContainer.style.display = 'none';
            }
            openBookingModal();
        });
    }
}

function handleBookingButtonClick() {
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
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlNlcnZpY2lvPC90ZXh0Pjwvc3ZnPg=='">
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
    updateBookingPanel();
}

function updateBookingPanel() {
    const selectedServicesPanel = getElement('selectedServicesPanel');
    const panelTotalPrice = getElement('panelTotalPrice');
    const panelTotalDuration = getElement('panelTotalDuration');
    const insertarCitaBtn = getElement('insertarCitaBtn');
    
    if (!selectedServicesPanel || !panelTotalPrice || !panelTotalDuration || !insertarCitaBtn) return;
    
    selectedServicesPanel.innerHTML = '';
    
    if (selectedServices.length === 0) {
        selectedServicesPanel.innerHTML = '<div class="empty-selection"><span>👆 Selecciona servicios</span></div>';
        insertarCitaBtn.disabled = true;
        insertarCitaBtn.innerHTML = '<span class="btn-icon">📅</span> Confirmar Cita';
        panelTotalPrice.textContent = '0';
        panelTotalDuration.textContent = '0';
    } else {
        let totalPrice = 0;
        let totalDuration = 0;

        selectedServices.forEach(service => {
            totalPrice += service.price;
            totalDuration += service.duration;
            
            const serviceItem = document.createElement('div');
            serviceItem.className = 'panel-service-item';
            serviceItem.innerHTML = `
                <div class="panel-service-main">
                    <span class="panel-service-name">${service.name}</span>
                    <button class="remove-service" data-id="${service.id}">×</button>
                </div>
                <div class="panel-service-details">
                    <span class="price">$${service.price}</span>
                    <span class="duration">${service.duration}min</span>
                </div>
            `;
            selectedServicesPanel.appendChild(serviceItem);
        });

        selectedServicesPanel.querySelectorAll('.remove-service').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const serviceId = parseInt(btn.getAttribute('data-id'));
                const service = services.find(s => s.id === serviceId);
                const card = document.querySelector(`.service-card[data-service-id="${serviceId}"]`);
                const bookBtn = card?.querySelector('.service-book-btn');
                
                if (card && bookBtn) {
                    card.classList.remove('selected');
                    bookBtn.classList.remove('added');
                    bookBtn.innerHTML = '<span class="btn-icon">➕</span> Agregar';
                    bookBtn.style.background = 'linear-gradient(135deg, #E75480, #D147A3)';
                }
                
                selectedServices = selectedServices.filter(s => s.id !== serviceId);
                updateBookingPanel();
                showNotification(`🗑️ ${service.name} removido`, 'info');
            });
        });

        panelTotalPrice.textContent = totalPrice;
        panelTotalDuration.textContent = totalDuration;
        insertarCitaBtn.disabled = false;
        insertarCitaBtn.innerHTML = `
            <span class="btn-icon">✅</span>
            Confirmar Cita (${totalDuration}min)
        `;
    }
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
        showNotification('⏸️ Las citas están temporalmente desactivadas. Por favor, intente más tarde.', 'warning');
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
    
    const dateInput = getElement('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
    
    const timeSlots = getElement('timeSlots');
    if (timeSlots) {
        timeSlots.innerHTML = `
            <div class="time-slots-placeholder">
                <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
                <strong>Calculando disponibilidad...</strong>
                <p style="margin-top: 5px; font-size: 0.9rem;">Analizando horarios con IA</p>
            </div>
        `;
    }
    
    setTimeout(() => {
        generateTimeSlots();
    }, 300);
    
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

// ========== GENERACIÓN DE HORARIOS INTELIGENTE - CORREGIDO ==========
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

async function loadProducts() {
    try {
        const response = await fetch('js/galeria.json');
        const data = await response.json();
        const productsContainer = getElement('productsContainer');
        
        if (!productsContainer) return;
        
        productsContainer.innerHTML = '';
        
        data.productos.forEach((product, index) => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image-container">
                    <img src="imagenes/productos/${product.imagen}" alt="${product.nombre}" class="product-image"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2R1Y3RvPC90ZXh0Pjwvc3ZnPg=='">
                </div>
                <div class="product-content">
                    <h3>${product.nombre}</h3>
                    <p class="product-description">${product.descripcion}</p>
                    <div class="product-price">$${product.precio}</div>
                </div>
            `;
            
            productCard.addEventListener('click', () => {
                openProductViewer(index);
            });
            
            productsContainer.appendChild(productCard);
        });
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        showNotification('⚠️ Error cargando productos', 'error');
    }
}

async function loadGallery() {
    try {
        const galleryContainer = getElement('galleryContainer');
        
        if (!galleryContainer) return;
        
        galleryContainer.innerHTML = '';
        
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
                <img src="imagenes/Galería-Trabajo/${image.archivo}" alt="${image.descripcion}" class="gallery-image"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbGVyXHUwMGVkYSBkZSBUcmFiYWpvczwvdGV4dD48L3N2Zz4='">
                <div class="gallery-overlay">
                    <div class="gallery-text">${image.descripcion}</div>
                </div>
            `;
            
            galleryItem.addEventListener('click', () => openImageViewer(index));
            galleryContainer.appendChild(galleryItem);
        });
    } catch (error) {
        console.error('❌ Error cargando galería:', error);
        showNotification('⚠️ Error cargando galería de trabajos', 'error');
    }
}

function initImageZoom() {
    const zoomInBtn = getElement('zoomIn');
    const zoomOutBtn = getElement('zoomOut');
    const resetZoomBtn = getElement('resetZoom');
    const closeImageViewerBtn = getElement('closeImageViewer');
    const viewerImage = getElement('viewerImage');
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    if (resetZoomBtn) resetZoomBtn.addEventListener('click', resetZoom);
    if (closeImageViewerBtn) closeImageViewerBtn.addEventListener('click', closeImageViewer);
    
    if (viewerImage) {
        viewerImage.addEventListener('touchstart', handleTouchStart, { passive: false });
        viewerImage.addEventListener('touchmove', handleTouchMove, { passive: false });
        viewerImage.addEventListener('touchend', handleTouchEnd);
        viewerImage.addEventListener('dblclick', toggleZoom);
        viewerImage.addEventListener('wheel', handleWheel, { passive: false });
    }
}

function zoomIn() {
    if (zoomLevel < 3) {
        zoomLevel += 0.25;
        applyZoom();
    }
}

function zoomOut() {
    if (zoomLevel > 0.5) {
        zoomLevel -= 0.25;
        applyZoom();
    }
}

function resetZoom() {
    zoomLevel = 1;
    applyZoom();
}

function toggleZoom() {
    zoomLevel = zoomLevel === 1 ? 2 : 1;
    applyZoom();
}

function applyZoom() {
    const viewerImage = getElement('viewerImage');
    if (viewerImage) {
        viewerImage.style.transform = `scale(${zoomLevel})`;
        viewerImage.style.transition = 'transform 0.3s ease';
    }
}

function handleTouchStart(e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        this.startDistance = distance;
        this.startZoom = zoomLevel;
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        if (this.startDistance) {
            const scale = distance / this.startDistance;
            zoomLevel = Math.max(0.5, Math.min(3, this.startZoom * scale));
            applyZoom();
        }
    }
}

function handleTouchEnd(e) {
    this.startDistance = null;
    this.startZoom = null;
}

function handleWheel(e) {
    e.preventDefault();
    if (e.deltaY < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
}

function openImageViewer(index) {
    currentImageIndex = index;
    const viewerModal = getElement('imageViewerModal');
    const viewerImage = getElement('viewerImage');
    
    if (!viewerModal || !viewerImage) return;
    
    viewerImage.src = `imagenes/Galería-Trabajo/${currentImages[currentImageIndex].archivo}`;
    viewerImage.alt = currentImages[currentImageIndex].descripcion;
    viewerModal.style.display = 'block';
    resetZoom();
}

function openProductViewer(index) {
    fetch('js/galeria.json')
        .then(response => response.json())
        .then(data => {
            currentImages = data.productos.map((product, idx) => ({
                id: idx + 1,
                archivo: product.imagen,
                descripcion: product.nombre
            }));
            
            currentImageIndex = index;
            const viewerModal = getElement('imageViewerModal');
            const viewerImage = getElement('viewerImage');
            
            if (!viewerModal || !viewerImage) return;
            
            viewerImage.src = `imagenes/productos/${currentImages[currentImageIndex].archivo}`;
            viewerImage.alt = currentImages[currentImageIndex].descripcion;
            viewerModal.style.display = 'block';
            resetZoom();
        })
        .catch(error => {
            console.error('Error cargando productos para visor:', error);
            showNotification('❌ Error al cargar la imagen', 'error');
        });
}

function closeImageViewer() {
    const viewerModal = getElement('imageViewerModal');
    if (viewerModal) {
        viewerModal.style.display = 'none';
    }
}

function navigateImage(direction) {
    currentImageIndex += direction;
    
    if (currentImageIndex < 0) {
        currentImageIndex = currentImages.length - 1;
    } else if (currentImageIndex >= currentImages.length) {
        currentImageIndex = 0;
    }
    
    const viewerImage = getElement('viewerImage');
    if (viewerImage) {
        viewerImage.src = `imagenes/Galería-Trabajo/${currentImages[currentImageIndex].archivo}`;
        viewerImage.alt = currentImages[currentImageIndex].descripcion;
        resetZoom();
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
            showNotification('⏸️ Las citas están temporalmente desactivadas. Por favor, intente más tarde.', 'warning');
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
            
            selectedServices = [];
            updateBookingPanel();
            
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

// ========== FUNCIÓN MEJORADA PARA ABRIR ADMIN MODAL ==========
function openAdminModal() {
    const password = prompt('🔐 Ingresa la contraseña de administración:');
    if (password === 'y1994') {
        const adminModal = getElement('adminModal');
        if (adminModal) {
            adminModal.style.display = 'block';
            adminModal.classList.add('show');
            loadAdminContent();
        }
    } else if (password !== null) {
        showNotification('❌ Contraseña incorrecta', 'error');
    }
}

function setupAdminModal() {
    const adminBtn = getElement('adminBtn');
    const adminModal = getElement('adminModal');
    
    if (adminBtn && adminModal) {
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAdminModal();
        });
    }

    // NUEVO: Configurar evento para cerrar modal admin
    const closeAdminBtn = adminModal?.querySelector('.close');
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => {
            adminModal.style.display = 'none';
            adminModal.classList.remove('show');
        });
    }
}

function loadAdminContent() {
    const adminContent = getElement('adminContent');
    if (!adminContent) return;
    
    adminContent.innerHTML = `
        <div class="admin-header">
            <h2>🔧 Panel de Administración Inteligente</h2>
            <p>Gestión avanzada de citas y horarios</p>
            
            <div class="admin-global-controls">
                <div class="control-group">
                    <h4>Control General de Citas</h4>
                    <button class="btn ${isBookingPaused ? 'btn-success' : 'btn-warning'}" id="toggleBookingBtn">
                        ${isBookingPaused ? '▶️ Reanudar Citas' : '⏸️ Pausar Citas'}
                    </button>
                    <p class="status-indicator ${isBookingPaused ? 'paused' : 'active'}">
                        Estado: <strong>${isBookingPaused ? '⏸️ CITAS PAUSADAS' : '✅ CITAS ACTIVAS'}</strong>
                    </p>
                </div>
            </div>
        </div>
        
        <div class="admin-tabs">
            <button class="tab-btn active" data-tab="citas">📅 Citas Programadas</button>
            <button class="tab-btn" data-tab="estadisticas">📊 Estadísticas Avanzadas</button>
            <button class="tab-btn" data-tab="horarios">⏰ Gestión de Horarios</button>
        </div>
        
        <div class="admin-content">
            <div id="citasTab" class="tab-content active">
                <div class="citas-header">
                    <h3>Citas Confirmadas - Sistema Inteligente</h3>
                    <div class="citas-stats">
                        <span class="stat-item">Total: <strong id="totalCitas">0</strong></span>
                        <span class="stat-item">Hoy: <strong id="citasHoy">0</strong></span>
                        <span class="stat-item">Capacidad: <strong id="capacidadDia">540</strong>min</span>
                    </div>
                </div>
                <div id="citasList" class="citas-list">
                    Cargando citas...
                </div>
            </div>
            
            <div id="estadisticasTab" class="tab-content">
                <h3 style="color: var(--primary-color); margin-bottom: 20px; text-align: center;">📊 Análisis de Rendimiento</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <span class="stat-value">$<span id="ingresosHoy">0</span></span>
                            <span class="stat-label">Ingresos Hoy</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⏰</div>
                        <div class="stat-info">
                            <span class="stat-value"><span id="tiempoTotal">0</span>min</span>
                            <span class="stat-label">Tiempo Ocupado</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📈</div>
                        <div class="stat-info">
                            <span class="stat-value"><span id="eficiencia">0</span>%</span>
                            <span class="stat-label">Eficiencia</span>
                        </div>
                    </div>
                </div>
                <div class="capacity-chart">
                    <h4>Capacidad del Día</h4>
                    <div class="capacity-bar">
                        <div class="capacity-fill" id="capacityFill" style="width: 0%"></div>
                    </div>
                    <div class="capacity-stats">
                        <span>Ocupado: <strong id="ocupadoHoy">0</strong>min</span>
                        <span>Disponible: <strong id="disponibleHoy">540</strong>min</span>
                    </div>
                </div>
            </div>
            
            <div id="horariosTab" class="tab-content">
                <h3 style="color: var(--primary-color); margin-bottom: 20px; text-align: center;">⏰ Configuración de Horarios</h3>
                <div class="schedule-config">
                    <div class="config-item">
                        <label>Horario de Apertura:</label>
                        <input type="time" id="openTime" value="09:00" class="time-input">
                    </div>
                    <div class="config-item">
                        <label>Horario de Cierre:</label>
                        <input type="time" id="closeTime" value="18:00" class="time-input">
                    </div>
                    <div class="config-item">
                        <label>Duración Máxima Diaria (min):</label>
                        <input type="number" id="maxDaily" value="540" class="number-input">
                    </div>
                    <button class="btn btn-success" id="saveScheduleConfig">💾 Guardar Configuración</button>
                </div>
            </div>
        </div>
    `;
    
    const toggleBookingBtn = getElement('toggleBookingBtn');
    if (toggleBookingBtn) {
        toggleBookingBtn.addEventListener('click', function() {
            isBookingPaused = !isBookingPaused;
            localStorage.setItem('isBookingPaused', isBookingPaused);
            showNotification(
                isBookingPaused ? '⏸️ Citas pausadas - No se aceptan nuevas reservas' : '✅ Citas reanudadas - Ya puedes aceptar reservas',
                isBookingPaused ? 'warning' : 'success'
            );
            loadAdminContent();
        });
    }
    
    loadCitas();
    loadEstadisticas();
    setupAdminTabs();
    setupScheduleConfig();
}

function setupScheduleConfig() {
    const saveConfigBtn = getElement('saveScheduleConfig');
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', function() {
            const openTime = getElement('openTime').value;
            const closeTime = getElement('closeTime').value;
            const maxDaily = parseInt(getElement('maxDaily').value);
            
            scheduleManager.workDayStart = scheduleManager.timeToMinutes(openTime);
            scheduleManager.workDayEnd = scheduleManager.timeToMinutes(closeTime);
            scheduleManager.maxDailyCapacity = maxDaily;
            
            showNotification('✅ Configuración de horarios guardada correctamente', 'success');
            
            const bookingModal = getElement('bookingModal');
            if (bookingModal && bookingModal.style.display === 'block') {
                generateTimeSlots();
            }
        });
    }
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

function loadCitas() {
    const citasList = document.getElementById('citasList');
    if (!citasList) return;
    
    const q = query(collection(db, "citas"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        citasList.innerHTML = '';
        
        if (snapshot.empty) {
            citasList.innerHTML = '<div class="no-citas"><p>📭 No hay citas programadas</p></div>';
            return;
        }
        
        let totalCitas = 0;
        let citasHoy = 0;
        const today = new Date().toISOString().split('T')[0];
        
        snapshot.forEach((doc) => {
            const cita = doc.data();
            totalCitas++;
            
            if (cita.fecha === today) {
                citasHoy++;
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

        const totalCitasElement = getElement('totalCitas');
        const citasHoyElement = getElement('citasHoy');
        if (totalCitasElement) totalCitasElement.textContent = totalCitas;
        if (citasHoyElement) citasHoyElement.textContent = citasHoy;
    });
}

function loadEstadisticas() {
    const q = query(collection(db, "citas"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        let ingresosHoy = 0;
        let tiempoTotal = 0;
        let citasCompletadas = 0;
        const today = new Date().toISOString().split('T')[0];
        
        snapshot.forEach((doc) => {
            const cita = doc.data();
            
            if (cita.fecha === today && cita.estado === 'confirmada') {
                ingresosHoy += cita.total;
                tiempoTotal += cita.duracion;
                citasCompletadas++;
            }
        });

        const ingresosHoyElement = getElement('ingresosHoy');
        const tiempoTotalElement = getElement('tiempoTotal');
        const citasCompletadasElement = getElement('citasCompletadas');
        const eficienciaElement = getElement('eficiencia');
        const ocupadoHoyElement = getElement('ocupadoHoy');
        const disponibleHoyElement = getElement('disponibleHoy');
        const capacityFill = getElement('capacityFill');
        
        if (ingresosHoyElement) ingresosHoyElement.textContent = ingresosHoy;
        if (tiempoTotalElement) tiempoTotalElement.textContent = tiempoTotal;
        if (citasCompletadasElement) citasCompletadasElement.textContent = citasCompletadas;
        
        const eficiencia = Math.round((tiempoTotal / 540) * 100);
        const disponible = 540 - tiempoTotal;
        
        if (eficienciaElement) eficienciaElement.textContent = eficiencia;
        if (ocupadoHoyElement) ocupadoHoyElement.textContent = tiempoTotal;
        if (disponibleHoyElement) disponibleHoyElement.textContent = disponible;
        if (capacityFill) capacityFill.style.width = `${eficiencia}%`;
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

function setupGlobalEventListeners() {
    document.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        });
    });
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
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
    
    if (prevImageBtn) prevImageBtn.addEventListener('click', () => navigateImage(-1));
    if (nextImageBtn) nextImageBtn.addEventListener('click', () => navigateImage(1));
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
    
    const bookingButtons = [
        getElement('bookingBtn'),
        getElement('heroBookingBtn'), 
        getElement('bigBookingBtn'),
        getElement('insertarCitaBtn')
    ];
    
    bookingButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                handleBookingButtonClick();
            });
        }
    });
    
    // NUEVO: Configuración mejorada del botón admin
    const adminBtn = getElement('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAdminModal();
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const savedPauseState = localStorage.getItem('isBookingPaused');
    if (savedPauseState !== null) {
        isBookingPaused = savedPauseState === 'true';
    }
    
    initHeaderScroll();
    initMobileMenu();
    initPortalNavigation();
    initNavigation();
    initSmartBooking();
    initImageZoom();
    
    loadServices();
    loadProducts();
    loadGallery();
    initializeDateInput();
    
    setupGlobalEventListeners();
    setupBookingForm();
    setupAdminModal(); // NUEVO: Inicializar modal admin
    
    const insertarCitaBtn = getElement('insertarCitaBtn');
    if (insertarCitaBtn) {
        insertarCitaBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openBookingModal();
        });
    }
});

window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.openImageViewer = openImageViewer;
window.closeImageViewer = closeImageViewer;
window.navigateImage = navigateImage;
window.cancelarCita = cancelarCita;
window.switchSection = switchSection;
window.scrollToServices = scrollToServices;
window.openAdminModal = openAdminModal; // NUEVO: Hacer accesible globalmente