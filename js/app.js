// ========== VARIABLES GLOBALES ==========
let currentImages = [];
let currentImageIndex = 0;
let currentAppointments = [];
let selectedTime = null;
let selectedServices = [];
let isBookingPaused = false;
let lastScrollTop = 0;

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
    orderBy
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

// ========== INICIALIZACIÓN SEGURA DEL DOM ==========
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Elemento no encontrado: ${id}`);
    }
    return element;
}

// ========== HEADER SCROLL EFFECT MEJORADO ==========
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollThreshold = 100;
        
        if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
            // Scrolling down - hide header
            header.classList.add('hidden');
        } else {
            // Scrolling up - show header
            header.classList.remove('hidden');
        }
        
        // Add scrolled class for styling
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    }, { passive: true });
}

// ========== MOBILE MENU TOGGLE ==========
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navCompact = document.querySelector('.nav-compact');
    
    if (mobileMenuToggle && navCompact) {
        mobileMenuToggle.addEventListener('click', function() {
            navCompact.classList.toggle('mobile-open');
            mobileMenuToggle.textContent = navCompact.classList.contains('mobile-open') ? '✕' : '☰';
        });
        
        // Close mobile menu when clicking on a link
        navCompact.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navCompact.classList.remove('mobile-open');
                mobileMenuToggle.textContent = '☰';
            });
        });
    }
}

// ========== CARGA DE SERVICIOS ==========
function loadServices() {
    console.log('🔧 Cargando servicios...');
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
        `;
        servicesContainer.appendChild(serviceCard);

        serviceCard.addEventListener('click', () => {
            toggleServiceSelection(service, serviceCard);
        });
    });
    console.log('✅ Servicios cargados:', services.length);
}

function toggleServiceSelection(service, card) {
    const index = selectedServices.findIndex(s => s.id === service.id);
    
    if (index === -1) {
        selectedServices.push(service);
        card.classList.add('selected');
        showNotification(`✅ ${service.name} añadido`, 'success');
    } else {
        selectedServices.splice(index, 1);
        card.classList.remove('selected');
        showNotification(`🗑️ ${service.name} removido`, 'info');
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
        insertarCitaBtn.innerHTML = '<span class="btn-icon">📅</span> Insertar Cita';
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

        // Event listeners para botones de eliminar
        selectedServicesPanel.querySelectorAll('.remove-service').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const serviceId = parseInt(btn.getAttribute('data-id'));
                const service = services.find(s => s.id === serviceId);
                const card = document.querySelector(`.service-card[data-service-id="${serviceId}"]`);
                if (card) {
                    card.classList.remove('selected');
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
            <span class="btn-icon">📅</span>
            Insertar Cita (${totalDuration}min)
        `;
    }
}

// ========== CARGA DE PRODUCTOS ==========
function loadProducts() {
    console.log('🔧 Cargando productos...');
    const productsContainer = getElement('productsContainer');
    if (!productsContainer) return;
    
    productsContainer.innerHTML = '';
    
    for (let i = 1; i <= 7; i++) {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="imagenes/productos/imagen${i}.jpg" alt="Producto ${i}" class="product-image"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2R1Y3RvICR7aX08L3RleHQ+PC9zdmc+='">
                <div class="product-overlay">
                    <div class="product-overlay-text">Ver Producto</div>
                </div>
            </div>
            <div class="product-info">
                <h3>Producto Premium ${i}</h3>
                <p>Calidad profesional para el cuidado de tu belleza</p>
            </div>
        `;
        productsContainer.appendChild(productCard);

        productCard.addEventListener('click', () => {
            openProductViewer(i);
        });
    }
    console.log('✅ Productos cargados: 7');
}

// ========== CARGA DE GALERÍA ==========
function loadGallery() {
    console.log('🔧 Cargando galería...');
    const galleryContainer = getElement('galleryContainer');
    if (!galleryContainer) return;
    
    galleryContainer.innerHTML = '';
    
    for (let i = 1; i <= 8; i++) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `
            <img src="imagenes/imagen${i}.jpg" alt="Trabajo ${i}" class="gallery-image"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbGVyw61hICR7aX08L3RleHQ+PC9zdmc+='">
            <div class="gallery-overlay">
                <span class="gallery-text">Trabajo ${i}</span>
            </div>
        `;
        galleryContainer.appendChild(galleryItem);

        galleryItem.addEventListener('click', () => {
            openGalleryViewer(i);
        });
    }
    console.log('✅ Galería cargada: 8 imágenes');
}

// ========== SISTEMA DE VISUALIZACIÓN DE IMÁGENES ==========
function openProductViewer(productIndex) {
    currentImages = [];
    for (let i = 1; i <= 7; i++) {
        currentImages.push(`imagenes/productos/imagen${i}.jpg`);
    }
    currentImageIndex = productIndex - 1;
    openImageViewer(currentImageIndex);
}

function openGalleryViewer(imageIndex) {
    currentImages = [];
    for (let i = 1; i <= 8; i++) {
        currentImages.push(`imagenes/imagen${i}.jpg`);
    }
    currentImageIndex = imageIndex - 1;
    openImageViewer(currentImageIndex);
}

function openImageViewer(index) {
    const viewerImage = getElement('viewerImage');
    const imageViewerModal = getElement('imageViewerModal');
    if (!viewerImage || !imageViewerModal) return;
    
    viewerImage.src = currentImages[index];
    imageViewerModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    updateImageControls();
}

function updateImageControls() {
    const prevImageBtn = getElement('prevImage');
    const nextImageBtn = getElement('nextImage');
    
    if (prevImageBtn) {
        prevImageBtn.style.display = currentImageIndex > 0 ? 'block' : 'none';
    }
    if (nextImageBtn) {
        nextImageBtn.style.display = currentImageIndex < currentImages.length - 1 ? 'block' : 'none';
    }
}

function closeImageViewer() {
    const imageViewerModal = getElement('imageViewerModal');
    if (!imageViewerModal) return;
    
    imageViewerModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentImages = [];
    currentImageIndex = 0;
}

// ========== SISTEMA DE CITAS ==========
function initializeDateInput() {
    const dateInput = getElement('date');
    if (!dateInput) return;
    
    const today = new Date();
    dateInput.min = today.toISOString().split('T')[0];
    
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    dateInput.addEventListener('change', function() {
        updateAvailableTimes();
    });
}

function openBookingModal() {
    if (selectedServices.length === 0) {
        showNotification('Por favor selecciona al menos un servicio', 'warning');
        return;
    }

    const bookingModal = getElement('bookingModal');
    if (!bookingModal) return;

    bookingModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    updateBookingPreview();
    listenToAppointments();
    updateAvailableTimes();
}

function updateBookingPreview() {
    const servicesPreview = getElement('servicesPreview');
    const servicesCount = getElement('servicesCount');
    const previewTotalPrice = getElement('previewTotalPrice');
    const previewTotalDuration = getElement('previewTotalDuration');
    
    if (!servicesPreview || !servicesCount || !previewTotalPrice || !previewTotalDuration) return;
    
    servicesPreview.innerHTML = '';
    let totalPrice = 0;
    let totalDuration = 0;

    selectedServices.forEach(service => {
        totalPrice += service.price;
        totalDuration += service.duration;
        
        const serviceItem = document.createElement('div');
        serviceItem.className = 'service-preview-item';
        serviceItem.innerHTML = `
            <span class="service-preview-name">${service.name}</span>
            <span class="service-preview-price">$${service.price}</span>
        `;
        servicesPreview.appendChild(serviceItem);
    });

    servicesCount.textContent = `${selectedServices.length} servicio${selectedServices.length !== 1 ? 's' : ''}`;
    previewTotalPrice.textContent = totalPrice;
    previewTotalDuration.textContent = totalDuration;
}

function updateAvailableTimes() {
    const timeSlotsContainer = getElement('timeSlots');
    const dateInput = getElement('date');
    
    if (!timeSlotsContainer || !dateInput) return;
    
    const selectedDate = dateInput.value;
    
    if (!selectedDate || selectedServices.length === 0) {
        timeSlotsContainer.innerHTML = '<div class="time-slots-placeholder">Selecciona una fecha primero</div>';
        return;
    }
    
    const totalDuration = selectedServices.reduce((total, service) => total + service.duration, 0);
    
    // Horarios simples de 9:00 a 18:00
    const availableSlots = generateSimpleTimeSlots(totalDuration, selectedDate);
    
    timeSlotsContainer.innerHTML = '';
    
    if (availableSlots.length === 0) {
        timeSlotsContainer.innerHTML = '<div class="time-slots-placeholder">No hay horarios disponibles</div>';
        return;
    }
    
    availableSlots.forEach(slot => {
        const timeSlot = document.createElement('button');
        timeSlot.type = 'button';
        timeSlot.className = 'time-slot-modern';
        timeSlot.innerHTML = `
            <div class="time-slot-content">
                <span class="time-slot-text">${slot.display}</span>
                <span class="time-slot-duration">${slot.duration}min</span>
            </div>
        `;
        
        timeSlot.addEventListener('click', () => {
            document.querySelectorAll('.time-slot-modern').forEach(ts => {
                ts.classList.remove('selected');
            });
            timeSlot.classList.add('selected');
            selectedTime = slot.time;
        });
        
        timeSlotsContainer.appendChild(timeSlot);
    });
}

function generateSimpleTimeSlots(totalDuration, selectedDate) {
    const slots = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour <= endHour - Math.ceil(totalDuration / 60); hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const displayTime = `${hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
            
            slots.push({
                time: timeString,
                display: displayTime,
                duration: totalDuration
            });
        }
    }
    
    return slots;
}

function listenToAppointments() {
    const q = query(collection(db, "appointments"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        currentAppointments = [];
        snapshot.forEach((doc) => {
            currentAppointments.push({ id: doc.id, ...doc.data() });
        });
    });
}

function showSuccessModal() {
    const bookingModal = getElement('bookingModal');
    const successModal = getElement('successModal');
    if (!bookingModal || !successModal) return;
    
    bookingModal.style.display = 'none';
    successModal.style.display = 'block';
}

// ========== SISTEMA ADMIN ==========
function showAdminLogin() {
    const adminContent = getElement('adminContent');
    if (!adminContent) return;
    
    adminContent.innerHTML = `
        <div class="admin-login">
            <div class="login-header">
                <h3>🔐 Acceso Administrativo</h3>
                <p>Ingresa la contraseña para acceder al panel</p>
            </div>
            <form id="adminLoginForm" class="login-form">
                <div class="form-group">
                    <label for="adminPassword">Contraseña</label>
                    <input type="password" id="adminPassword" class="modern-input" required>
                </div>
                <button type="submit" class="btn btn-fuchsia btn-login">
                    Acceder al Panel
                </button>
            </form>
        </div>
    `;

    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPassword').value;
            if (password === "yenny2024") {
                loadAdminPanel();
            } else {
                showNotification('❌ Contraseña incorrecta', 'error');
            }
        });
    }
}

function loadAdminPanel() {
    const adminContent = getElement('adminContent');
    if (!adminContent) return;
    
    adminContent.innerHTML = `
        <div class="admin-panel">
            <div class="admin-header">
                <h3>🛠️ Panel de Control</h3>
                <p>Gestión de citas del salón</p>
            </div>
            
            <div class="admin-stats">
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-info">
                        <div class="stat-number">${currentAppointments.length}</div>
                        <div class="stat-label">Total Citas</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-info">
                        <div class="stat-number">${currentAppointments.filter(a => a.status === 'active').length}</div>
                        <div class="stat-label">Activas</div>
                    </div>
                </div>
            </div>

            <div class="admin-section">
                <div class="section-header">
                    <h4>📅 Citas Activas</h4>
                </div>
                <div class="appointments-grid" id="adminAppointmentsGrid">
                    ${loadAdminAppointments()}
                </div>
            </div>
        </div>
    `;
}

function loadAdminAppointments() {
    const activeAppointments = currentAppointments.filter(apt => apt.status === 'active');
    
    if (activeAppointments.length === 0) {
        return '<div class="empty-state">No hay citas activas</div>';
    }
    
    return activeAppointments.map(appointment => `
        <div class="appointment-card">
            <div class="appointment-header">
                <div class="appointment-number">Cita #${appointment.id.slice(-6)}</div>
                <div class="appointment-date">${appointment.date} ${appointment.time}</div>
            </div>
            <div class="appointment-body">
                <div class="appointment-client">
                    <strong>${appointment.clientName}</strong>
                    <span>📞 ${appointment.clientPhone}</span>
                </div>
                <div class="appointment-service">
                    <span>${appointment.serviceName}</span>
                    <span class="appointment-price">$${appointment.servicePrice}</span>
                </div>
                <div class="appointment-duration">${appointment.serviceDuration} min</div>
            </div>
            <div class="appointment-actions">
                <button class="btn btn-outline btn-sm" onclick="cancelAppointment('${appointment.id}')">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `).join('');
}

// Función global para cancelar citas
window.cancelAppointment = async function(appointmentId) {
    if (confirm('¿Cancelar esta cita?')) {
        try {
            const appointmentRef = doc(db, "appointments", appointmentId);
            await updateDoc(appointmentRef, {
                status: 'cancelada',
                canceledAt: new Date()
            });
            showNotification('✅ Cita cancelada', 'success');
            loadAdminPanel();
        } catch (error) {
            console.error("Error:", error);
            showNotification('❌ Error al cancelar', 'error');
        }
    }
}

// ========== NOTIFICACIONES ==========
function showNotification(message, type = 'info') {
    // Eliminar notificaciones existentes
    document.querySelectorAll('.notification').forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Animación de entrada
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Cerrar al hacer clic
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// ========== CONTROL DE MODALES ==========
function closeModals() {
    const modals = ['bookingModal', 'adminModal', 'successModal', 'imageViewerModal'];
    modals.forEach(modalId => {
        const modal = getElement(modalId);
        if (modal) modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// ========== INICIALIZACIÓN PRINCIPAL ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando aplicación...');
    
    // Inicializar efectos del header
    initHeaderScroll();
    initMobileMenu();
    
    // Cargar contenido
    loadServices();
    loadProducts();
    loadGallery();
    initializeDateInput();
    
    // Botones de citas
    const bookingBtn = getElement('bookingBtn');
    const heroBookingBtn = getElement('heroBookingBtn');
    const insertarCitaBtn = getElement('insertarCitaBtn');
    
    if (bookingBtn) {
        bookingBtn.addEventListener('click', () => {
            const servicesSection = document.getElementById('servicios');
            if (servicesSection) {
                servicesSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    if (heroBookingBtn) {
        heroBookingBtn.addEventListener('click', () => {
            const servicesSection = document.getElementById('servicios');
            if (servicesSection) {
                servicesSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    if (insertarCitaBtn) {
        insertarCitaBtn.addEventListener('click', openBookingModal);
    }
    
    // Botón admin
    const adminBtn = getElement('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            const adminModal = getElement('adminModal');
            if (adminModal) {
                adminModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                showAdminLogin();
            }
        });
    }
    
    // Cerrar modales
    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    const closeSuccessModal = getElement('closeSuccessModal');
    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', closeModals);
    }
    
    // Cerrar al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
    
    // Navegación de imágenes
    const prevImageBtn = getElement('prevImage');
    const nextImageBtn = getElement('nextImage');
    
    if (prevImageBtn) {
        prevImageBtn.addEventListener('click', () => {
            if (currentImageIndex > 0) {
                currentImageIndex--;
                const viewerImage = getElement('viewerImage');
                if (viewerImage) viewerImage.src = currentImages[currentImageIndex];
                updateImageControls();
            }
        });
    }
    
    if (nextImageBtn) {
        nextImageBtn.addEventListener('click', () => {
            if (currentImageIndex < currentImages.length - 1) {
                currentImageIndex++;
                const viewerImage = getElement('viewerImage');
                if (viewerImage) viewerImage.src = currentImages[currentImageIndex];
                updateImageControls();
            }
        });
    }
    
    // Formulario de citas
    const bookingForm = getElement('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!selectedTime) {
                showNotification('❌ Selecciona una hora', 'error');
                return;
            }
            
            const formData = new FormData(bookingForm);
            const serviceNames = selectedServices.map(s => s.name).join(', ');
            const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
            const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
            
            try {
                await addDoc(collection(db, "appointments"), {
                    serviceName: serviceNames,
                    servicePrice: totalPrice,
                    serviceDuration: totalDuration,
                    date: formData.get('date'),
                    time: selectedTime,
                    clientName: formData.get('name'),
                    clientPhone: formData.get('phone'),
                    status: 'active',
                    timestamp: new Date()
                });
                
                showSuccessModal();
                bookingForm.reset();
                selectedTime = null;
                selectedServices = [];
                updateBookingPanel();
                document.querySelectorAll('.service-card.selected').forEach(card => {
                    card.classList.remove('selected');
                });
                
            } catch (error) {
                console.error("Error:", error);
                showNotification('❌ Error al reservar', 'error');
            }
        });
    }
    
    // Tecla Escape para cerrar modales
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModals();
    });

    console.log('✅ Aplicación inicializada correctamente');
});

// Estilos para notificaciones
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        background: #27ae60;
    }
    
    .notification-error {
        background: #e74c3c;
    }
    
    .notification-warning {
        background: #f39c12;
    }
    
    .notification-info {
        background: #3498db;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;
document.head.appendChild(notificationStyles);