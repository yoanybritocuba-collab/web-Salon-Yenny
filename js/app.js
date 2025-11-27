import { db } from './config/firebase.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc,
    onSnapshot,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Servicios con NOMBRES EXACTOS de imágenes según tu listado
const services = [
    {
        id: 1,
        name: "Lavado normal",
        price: 55,
        duration: 10,
        image: "imagenes/servicios/imagen7.png", // NOMBRE EXACTO
        description: "Lavado y secado profesional"
    },
    {
        id: 2,
        name: "Lavado con línea",
        price: 70,
        duration: 60,
        image: "imagenes/servicios/imagen6.png", // NOMBRE EXACTO
        description: "Lavado con corte de puntas"
    },
    {
        id: 3,
        name: "Lavado con rolos",
        price: 75,
        duration: 90,
        image: "imagenes/servicios/imagen8.png", // NOMBRE EXACTO
        description: "Lavado con peinado con rolos"
    },
    {
        id: 4,
        name: "Color",
        price: 120,
        duration: 120,
        image: "imagenes/servicios/imagen9.png", // NOMBRE EXACTO
        description: "Coloración profesional"
    },
    {
        id: 5,
        name: "Botox capilar",
        price: 150,
        duration: 120,
        image: "imagenes/servicios/imagen1.png", // NOMBRE EXACTO
        description: "Tratamiento botox capilar"
    },
    {
        id: 6,
        name: "Keratina",
        price: 200,
        duration: 120,
        image: "imagenes/servicios/imagen2.png", // NOMBRE EXACTO
        description: "Tratamiento de keratina"
    },
    {
        id: 7,
        name: "Microsring",
        price: 200,
        duration: 120,
        image: "imagenes/servicios/imagen3.png", // NOMBRE EXACTO
        description: "Extensiones microsring"
    },
    {
        id: 8,
        name: "Extensiones x línea",
        price: 20,
        duration: 40,
        image: "imagenes/servicios/imagen4.png", // NOMBRE EXACTO
        description: "Extensiones por línea"
    },
    {
        id: 9,
        name: "Extensiones completas",
        price: 200,
        duration: 120,
        image: "imagenes/servicios/imagen5.png", // NOMBRE EXACTO
        description: "Extensiones completas"
    }
];

// ... (el resto del código se mantiene IGUAL desde aquí) ...

// Elementos del DOM
const servicesContainer = document.getElementById('servicesContainer');
const productsContainer = document.getElementById('productsContainer');
const galleryContainer = document.getElementById('galleryContainer');
const bookingBtn = document.getElementById('bookingBtn');
const adminBtn = document.getElementById('adminBtn');
const heroBookingBtn = document.getElementById('heroBookingBtn');
const bookingModal = document.getElementById('bookingModal');
const adminModal = document.getElementById('adminModal');
const imageViewerModal = document.getElementById('imageViewerModal');
const closeButtons = document.querySelectorAll('.close');
const bookingForm = document.getElementById('bookingForm');
const dateInput = document.getElementById('date');
const timeSlotsContainer = document.getElementById('timeSlots');
const adminContent = document.getElementById('adminContent');
const viewerImage = document.getElementById('viewerImage');
const prevImageBtn = document.getElementById('prevImage');
const nextImageBtn = document.getElementById('nextImage');
const servicesFooter = document.getElementById('servicesFooter');
const selectedServicesList = document.getElementById('selectedServicesList');
const totalPriceElement = document.getElementById('totalPrice');
const totalDurationElement = document.getElementById('totalDuration');
const bookSelectedServicesBtn = document.getElementById('bookSelectedServices');
const modalServicesList = document.getElementById('modalServicesList');
const modalTotalPriceElement = document.getElementById('modalTotalPrice');
const modalTotalDurationElement = document.getElementById('modalTotalDuration');

// Estado global
let currentAppointments = [];
let selectedTime = null;
let unsubscribeAppointments = null;
let currentImages = [];
let currentImageIndex = 0;
let selectedServices = [];
let isBookingPaused = false;

// Configurar fecha mínima (hoy) y restricciones
function initializeDateInput() {
    const today = new Date();
    dateInput.min = today.toISOString().split('T')[0];
    
    // Establecer fecha máxima (3 meses desde hoy)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    // Deshabilitar domingos
    dateInput.addEventListener('change', function() {
        const selectedDate = new Date(this.value);
        const dayOfWeek = selectedDate.getDay();
        
        if (dayOfWeek === 0) { // Domingo
            showNotification('❌ Los domingos estamos cerrados. Por favor selecciona otro día.', 'error');
            this.value = '';
            timeSlotsContainer.innerHTML = '<div class="time-slots-message error">Selecciona un día de lunes a sábado</div>';
        } else {
            updateAvailableTimes();
        }
    });
}

// Verificar si es día laboral (lunes a sábado)
function isBusinessDay(dateString) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 6; // 1=Lunes, 6=Sábado
}

// Cargar servicios - CORREGIDO con nombres exactos
function loadServices() {
    servicesContainer.innerHTML = '';
    
    services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.innerHTML = `
            <div class="service-image-container">
                <img src="${service.image}" alt="${service.name}" class="service-image" 
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPiR7c2VydmljZS5uYW1lfTwvdGV4dD48L3N2Zz4='">
                <div class="service-overlay">
                    <span class="service-price">$${service.price}</span>
                    <span class="service-duration">${service.duration}min</span>
                </div>
            </div>
            <div class="service-content">
                <h3>${service.name}</h3>
                <p class="service-description">${service.description}</p>
            </div>
        `;
        servicesContainer.appendChild(serviceCard);

        // Event listener para seleccionar servicio
        serviceCard.addEventListener('click', () => {
            toggleServiceSelection(service, serviceCard);
        });
    });
}

// ... (el resto del código se mantiene EXACTAMENTE IGUAL) ...

// Alternar selección de servicio
function toggleServiceSelection(service, card) {
    const index = selectedServices.findIndex(s => s.id === service.id);
    if (index === -1) {
        selectedServices.push(service);
        card.classList.add('selected');
    } else {
        selectedServices.splice(index, 1);
        card.classList.remove('selected');
    }
    updateSelectedServicesUI();
}

// Actualizar UI de servicios seleccionados
function updateSelectedServicesUI() {
    if (selectedServices.length > 0) {
        servicesFooter.style.display = 'block';
        selectedServicesList.innerHTML = '';
        let totalPrice = 0;
        let totalDuration = 0;

        selectedServices.forEach(service => {
            totalPrice += service.price;
            totalDuration += service.duration;
            const serviceItem = document.createElement('div');
            serviceItem.className = 'selected-service-item';
            serviceItem.innerHTML = `
                <span>${service.name}</span>
                <span>$${service.price} - ${service.duration}min</span>
            `;
            selectedServicesList.appendChild(serviceItem);
        });

        totalPriceElement.textContent = totalPrice;
        totalDurationElement.textContent = totalDuration;
    } else {
        servicesFooter.style.display = 'none';
    }
}

// Cargar productos
function loadProducts() {
    productsContainer.innerHTML = '';
    
    for (let i = 1; i <= 7; i++) {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="imagenes/productos/imagen${i}.jpg" alt="Producto ${i}" class="product-image" 
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2R1Y3RvICR7aX08L3RleHQ+PC9zdmc+='">
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

        // Event listener para visualización de productos
        productCard.addEventListener('click', () => {
            openProductViewer(i);
        });
    }
}

// Cargar galería
function loadGallery() {
    galleryContainer.innerHTML = '';
    
    for (let i = 1; i <= 8; i++) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `
            <img src="imagenes/imagen${i}.jpg" alt="Trabajo ${i}" class="gallery-image" 
                 onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbGVyw61hICR7aX08L3RleHQ+PC9zdmc+='">
            <div class="gallery-overlay">
                <span class="gallery-text">Trabajo ${i}</span>
            </div>
        `;
        galleryContainer.appendChild(galleryItem);

        // Event listener para visualización de galería
        galleryItem.addEventListener('click', () => {
            openGalleryViewer(i);
        });
    }
}

// Visualizador de productos
function openProductViewer(productIndex) {
    currentImages = [];
    for (let i = 1; i <= 7; i++) {
        currentImages.push(`imagenes/productos/imagen${i}.jpg`);
    }
    currentImageIndex = productIndex - 1;
    openImageViewer(currentImageIndex);
}

// Visualizador de galería
function openGalleryViewer(imageIndex) {
    currentImages = [];
    for (let i = 1; i <= 8; i++) {
        currentImages.push(`imagenes/imagen${i}.jpg`);
    }
    currentImageIndex = imageIndex - 1;
    openImageViewer(currentImageIndex);
}

// Sistema mejorado de visualización de imágenes
function openImageViewer(index) {
    viewerImage.src = currentImages[index];
    imageViewerModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    updateImageControls();
}

function updateImageControls() {
    prevImageBtn.style.display = currentImageIndex > 0 ? 'block' : 'none';
    nextImageBtn.style.display = currentImageIndex < currentImages.length - 1 ? 'block' : 'none';
}

function closeImageViewer() {
    imageViewerModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentImages = [];
    currentImageIndex = 0;
}

// Sistema IA para calcular disponibilidad - Horario 9:00 a 18:00 (Lunes a Sábado)
function calculateAvailableTimes(selectedDate, totalDuration) {
    // Verificar si es día laboral
    if (!isBusinessDay(selectedDate)) {
        return [];
    }

    const workStart = 9 * 60; // 9:00 en minutos
    const workEnd = 18 * 60; // 18:00 en minutos (6:00 PM)
    const slotDuration = 30; // Intervalos de 30 minutos
    const bufferTime = 15; // Tiempo entre citas
    
    const availableSlots = [];
    
    // Si el sistema está pausado, no hay horarios disponibles
    if (isBookingPaused) {
        return availableSlots;
    }
    
    // Generar todos los slots posibles
    for (let time = workStart; time <= workEnd - totalDuration; time += slotDuration) {
        const slotStart = time;
        const slotEnd = time + totalDuration;
        
        // Verificar si el slot está disponible
        const isAvailable = !currentAppointments.some(appointment => {
            if (appointment.date !== selectedDate) return false;
            
            const appointmentStart = timeToMinutes(appointment.time);
            const appointmentEnd = appointmentStart + appointment.serviceDuration;
            
            // Verificar superposición con buffer
            return (slotStart < appointmentEnd + bufferTime) && 
                   (slotEnd + bufferTime > appointmentStart);
        });
        
        if (isAvailable) {
            availableSlots.push({
                time: minutesToTime(slotStart),
                display: minutesToDisplayTime(slotStart),
                duration: totalDuration
            });
        }
    }
    
    return availableSlots;
}

// Conversión de tiempo
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function minutesToDisplayTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Actualizar horas disponibles
function updateAvailableTimes() {
    const selectedDate = dateInput.value;
    
    if (!selectedDate || selectedServices.length === 0) {
        timeSlotsContainer.innerHTML = '<div class="time-slots-message">Selecciona fecha y al menos un servicio</div>';
        return;
    }
    
    // Verificar si es día laboral
    if (!isBusinessDay(selectedDate)) {
        timeSlotsContainer.innerHTML = '<div class="time-slots-message error">❌ Solo abrimos de lunes a sábado</div>';
        return;
    }
    
    // Verificar si el sistema está pausado
    if (isBookingPaused) {
        timeSlotsContainer.innerHTML = '<div class="time-slots-message error">⚠️ El sistema de citas está temporalmente pausado</div>';
        return;
    }
    
    const totalDuration = selectedServices.reduce((total, service) => total + service.duration, 0);
    const availableSlots = calculateAvailableTimes(selectedDate, totalDuration);
    
    timeSlotsContainer.innerHTML = '';
    
    if (availableSlots.length === 0) {
        timeSlotsContainer.innerHTML = '<div class="time-slots-message error">No hay horarios disponibles para esta fecha</div>';
        return;
    }
    
    availableSlots.forEach(slot => {
        const timeSlot = document.createElement('button');
        timeSlot.type = 'button';
        timeSlot.className = 'time-slot';
        timeSlot.innerHTML = `
            <span class="time-slot-text">${slot.display}</span>
            <span class="time-slot-duration">${slot.duration}min</span>
        `;
        
        timeSlot.addEventListener('click', () => {
            document.querySelectorAll('.time-slot').forEach(ts => {
                ts.classList.remove('selected');
            });
            timeSlot.classList.add('selected');
            selectedTime = slot.time;
        });
        
        timeSlotsContainer.appendChild(timeSlot);
    });
}

// Escuchar citas en tiempo real
function listenToAppointments() {
    const q = query(collection(db, "appointments"), 
                   where("status", "==", "active"),
                   orderBy("timestamp", "desc"));
    
    unsubscribeAppointments = onSnapshot(q, (snapshot) => {
        currentAppointments = [];
        snapshot.forEach((doc) => {
            currentAppointments.push({ id: doc.id, ...doc.data() });
        });
        
        if (bookingModal.style.display === 'block') {
            updateAvailableTimes();
        }
        
        if (adminModal.style.display === 'block') {
            loadAdminAppointments();
        }
    });
}

// Abrir modal de reserva
function openBookingModal() {
    if (selectedServices.length === 0) {
        showNotification('Selecciona al menos un servicio', 'warning');
        return;
    }

    if (isBookingPaused) {
        showNotification('El sistema de citas está temporalmente pausado', 'error');
        return;
    }

    bookingModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Actualizar servicios en el modal
    modalServicesList.innerHTML = '';
    let totalPrice = 0;
    let totalDuration = 0;

    selectedServices.forEach(service => {
        totalPrice += service.price;
        totalDuration += service.duration;
        const serviceItem = document.createElement('div');
        serviceItem.className = 'modal-service-item';
        serviceItem.innerHTML = `
            <span>${service.name}</span>
            <span>$${service.price} - ${service.duration}min</span>
        `;
        modalServicesList.appendChild(serviceItem);
    });

    modalTotalPriceElement.textContent = totalPrice;
    modalTotalDurationElement.textContent = totalDuration;
    
    listenToAppointments();
    updateAvailableTimes();
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Remover notificaciones existentes
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
    
    // Cerrar notificación
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto cerrar después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Cerrar modales
function closeModals() {
    bookingModal.style.display = 'none';
    adminModal.style.display = 'none';
    imageViewerModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (unsubscribeAppointments) {
        unsubscribeAppointments();
        unsubscribeAppointments = null;
    }
}

// Cargar panel admin mejorado
function loadAdminPanel() {
    adminContent.innerHTML = `
        <div class="admin-login" id="adminLogin">
            <div class="login-header">
                <h3>🔐 Acceso Administrativo</h3>
                <p>Ingresa la contraseña para acceder al panel</p>
            </div>
            <form id="loginForm" class="login-form">
                <div class="form-group">
                    <label for="password">Contraseña:</label>
                    <input type="password" id="password" placeholder="Ingresa la contraseña" required>
                </div>
                <button type="submit" class="btn btn-fuchsia btn-login">
                    <span class="btn-icon">🔑</span>
                    Acceder al Panel
                </button>
            </form>
        </div>
        <div class="admin-panel" id="adminPanel" style="display: none;">
            <div class="admin-header">
                <h3>📊 Panel de Control - YennyHair Salón</h3>
                <p>Tellstrase 32, 8400 Winterthur</p>
            </div>
            
            <div class="admin-stats">
                <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-info">
                        <span class="stat-number" id="activeAppointmentsCount">0</span>
                        <span class="stat-label">Citas Activas</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-info">
                        <span class="stat-number" id="dailyRevenue">$0</span>
                        <span class="stat-label">Ingresos Hoy</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚙️</div>
                    <div class="stat-info">
                        <span class="stat-number" id="systemStatus">Activo</span>
                        <span class="stat-label">Estado Sistema</span>
                    </div>
                </div>
            </div>

            <div class="admin-section">
                <div class="section-header">
                    <h4>📋 Citas Activas</h4>
                    <button class="btn btn-outline btn-sm" id="refreshAppointments">
                        <span class="btn-icon">🔄</span>
                        Actualizar
                    </button>
                </div>
                <div class="appointments-list" id="appointmentsList">
                    <div class="loading">Cargando citas activas...</div>
                </div>
            </div>
            
            <div class="admin-section">
                <div class="section-header">
                    <h4>⚙️ Control del Sistema</h4>
                </div>
                <div class="system-controls">
                    <button class="btn btn-warning" id="stopBookingBtn" ${isBookingPaused ? 'style="display:none"' : ''}>
                        <span class="btn-icon">⏸️</span>
                        Pausar Sistema
                    </button>
                    <button class="btn btn-success" id="enableBookingBtn" ${isBookingPaused ? '' : 'style="display:none"'}>
                        <span class="btn-icon">▶️</span>
                        Reanudar Sistema
                    </button>
                    <button class="btn btn-info" id="clearSelectionsBtn">
                        <span class="btn-icon">🧹</span>
                        Limpiar Selecciones
                    </button>
                </div>
            </div>
        </div>
    `;

    // Login admin
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        if (password === '1994') {
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            loadAdminAppointments();
            listenToAppointments();
        } else {
            showNotification('❌ Contraseña incorrecta', 'error');
        }
    });

    document.getElementById('refreshAppointments').addEventListener('click', loadAdminAppointments);
    
    document.getElementById('stopBookingBtn').addEventListener('click', function() {
        if (confirm('¿Pausar el sistema de citas? Los clientes no podrán agendar nuevas citas.')) {
            isBookingPaused = true;
            this.style.display = 'none';
            document.getElementById('enableBookingBtn').style.display = 'inline-flex';
            document.getElementById('systemStatus').textContent = 'Pausado';
            document.getElementById('systemStatus').style.color = '#f39c12';
            showNotification('⏸️ Sistema de citas pausado', 'warning');
        }
    });

    document.getElementById('enableBookingBtn').addEventListener('click', function() {
        isBookingPaused = false;
        this.style.display = 'none';
        document.getElementById('stopBookingBtn').style.display = 'inline-flex';
        document.getElementById('systemStatus').textContent = 'Activo';
        document.getElementById('systemStatus').style.color = '#27ae60';
        showNotification('✅ Sistema de citas activado', 'success');
    });

    document.getElementById('clearSelectionsBtn').addEventListener('click', function() {
        selectedServices = [];
        document.querySelectorAll('.service-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        updateSelectedServicesUI();
        showNotification('🧹 Selecciones limpiadas', 'info');
    });
}

// Cargar citas en admin
async function loadAdminAppointments() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const q = query(collection(db, "appointments"), 
                       orderBy("timestamp", "desc"));
        
        const querySnapshot = await getDocs(q);
        const appointmentsList = document.getElementById('appointmentsList');
        
        let activeAppointments = [];
        let todayRevenue = 0;

        querySnapshot.forEach((doc) => {
            const appointment = { id: doc.id, ...doc.data() };
            if (appointment.status === 'active') {
                activeAppointments.push(appointment);
                if (appointment.date === today) {
                    todayRevenue += appointment.servicePrice || 0;
                }
            }
        });

        document.getElementById('activeAppointmentsCount').textContent = activeAppointments.length;
        document.getElementById('dailyRevenue').textContent = `$${todayRevenue}`;

        if (activeAppointments.length === 0) {
            appointmentsList.innerHTML = '<div class="empty-state">No hay citas activas</div>';
        } else {
            let html = '<div class="appointments-grid">';
            activeAppointments.forEach((appointment, index) => {
                html += `
                    <div class="appointment-card">
                        <div class="appointment-header">
                            <span class="appointment-number">#${index + 1}</span>
                            <span class="appointment-date">${appointment.date} • ${appointment.time}</span>
                        </div>
                        <div class="appointment-body">
                            <div class="appointment-client">
                                <strong>${appointment.clientName}</strong>
                                <span class="appointment-phone">${appointment.clientPhone}</span>
                            </div>
                            <div class="appointment-service">
                                ${appointment.serviceName}
                                <span class="appointment-price">$${appointment.servicePrice}</span>
                            </div>
                            <div class="appointment-duration">
                                ⏱️ ${appointment.serviceDuration} minutos
                            </div>
                        </div>
                        <div class="appointment-actions">
                            <button class="btn btn-success complete-btn" data-id="${appointment.id}">
                                ✅ Completar
                            </button>
                            <button class="btn btn-danger cancel-btn" data-id="${appointment.id}">
                                ❌ Cancelar
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            appointmentsList.innerHTML = html;
        }

        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                if (confirm('¿Cancelar esta cita?')) {
                    await updateDoc(doc(db, "appointments", id), {
                        status: 'cancelled',
                        cancelledAt: new Date()
                    });
                    showNotification('❌ Cita cancelada', 'error');
                }
            });
        });

        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                if (confirm('¿Marcar esta cita como completada?')) {
                    await updateDoc(doc(db, "appointments", id), {
                        status: 'completed',
                        completedAt: new Date()
                    });
                    showNotification('✅ Cita completada', 'success');
                }
            });
        });

    } catch (error) {
        console.error("Error loading appointments: ", error);
        document.getElementById('appointmentsList').innerHTML = 
            '<div class="error-state">Error al cargar las citas</div>';
    }
}

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeDateInput();
    loadServices();
    loadProducts();
    loadGallery();
    
    // Event listeners para visualización de imágenes
    prevImageBtn.addEventListener('click', () => {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            viewerImage.src = currentImages[currentImageIndex];
            updateImageControls();
        }
    });

    nextImageBtn.addEventListener('click', () => {
        if (currentImageIndex < currentImages.length - 1) {
            currentImageIndex++;
            viewerImage.src = currentImages[currentImageIndex];
            updateImageControls();
        }
    });

    // Event listeners para modales
    bookingBtn.addEventListener('click', openBookingModal);
    heroBookingBtn.addEventListener('click', openBookingModal);
    bookSelectedServicesBtn.addEventListener('click', openBookingModal);
    
    adminBtn.addEventListener('click', () => {
        adminModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        loadAdminPanel();
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === bookingModal || e.target === adminModal || e.target === imageViewerModal) {
            closeModals();
        }
    });
    
    // Formulario de citas
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedTime) {
            showNotification('❌ Selecciona una hora disponible', 'error');
            return;
        }
        
        const formData = new FormData(bookingForm);
        const date = formData.get('date');
        const time = selectedTime;
        const name = formData.get('name');
        const phone = formData.get('phone');
        
        // Validar que sea día laboral
        if (!isBusinessDay(date)) {
            showNotification('❌ Solo atendemos de lunes a sábado', 'error');
            return;
        }
        
        const serviceNames = selectedServices.map(s => s.name).join(', ');
        const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
        const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
        
        try {
            await addDoc(collection(db, "appointments"), {
                serviceName: serviceNames,
                servicePrice: totalPrice,
                serviceDuration: totalDuration,
                date: date,
                time: time,
                clientName: name,
                clientPhone: phone,
                status: 'active',
                timestamp: new Date()
            });
            
            // Mostrar indicador verde de cita concertada
            showNotification('✅ ¡Cita concertada exitosamente! Te esperamos en Tellstrase 32', 'success');
            
            // Resetear formulario
            bookingForm.reset();
            selectedTime = null;
            selectedServices = [];
            updateSelectedServicesUI();
            
            // Cerrar modal después de 2 segundos
            setTimeout(() => {
                closeModals();
            }, 2000);
            
        } catch (error) {
            console.error("Error al reservar cita: ", error);
            showNotification('❌ Error al reservar la cita', 'error');
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModals();
    });

    // Touch events para móviles
    document.addEventListener('touchstart', function() {}, {passive: true});
});

// Estilos para notificaciones
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--border-radius);
        color: white;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-md);
        box-shadow: var(--shadow-lg);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        background: #27ae60;
        border-left: 4px solid #219653;
    }
    
    .notification-error {
        background: #e74c3c;
        border-left: 4px solid #c0392b;
    }
    
    .notification-warning {
        background: #f39c12;
        border-left: 4px solid #e67e22;
    }
    
    .notification-info {
        background: #3498db;
        border-left: 4px solid #2980b9;
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
    
    @media (max-width: 768px) {
        .notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
            transform: translateY(-100px);
        }
        
        .notification.show {
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(notificationStyles);