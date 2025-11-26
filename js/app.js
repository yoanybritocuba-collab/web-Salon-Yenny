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

// Servicios con tiempos exactos actualizados
const services = [
    {
        id: 1,
        name: "Lavado normal",
        price: 55,
        duration: 10,
        image: "lavado_normal.jpg",
        description: "Lavado y secado profesional"
    },
    {
        id: 2,
        name: "Lavado con línea",
        price: 70,
        duration: 60,
        image: "lavado_linea.jpg",
        description: "Lavado con corte de puntas"
    },
    {
        id: 3,
        name: "Lavado con rolos",
        price: 75,
        duration: 90,
        image: "lavado_rolos.jpg", 
        description: "Lavado con peinado con rolos"
    },
    {
        id: 4,
        name: "Color",
        price: 120,
        duration: 120,
        image: "color.jpg",
        description: "Coloración profesional"
    },
    {
        id: 5,
        name: "Botox",
        price: 150,
        duration: 120,
        image: "botox.jpg",
        description: "Tratamiento botox capilar"
    },
    {
        id: 6,
        name: "Keratina",
        price: 200,
        duration: 120,
        image: "keratina.jpg",
        description: "Tratamiento de keratina"
    },
    {
        id: 7,
        name: "Microsring",
        price: 200,
        duration: 120,
        image: "microsring.jpg",
        description: "Extensiones microsring"
    },
    {
        id: 8,
        name: "Extensiones x línea",
        price: 20,
        duration: 40,
        image: "extensiones_linea.jpg",
        description: "Extensiones por línea"
    },
    {
        id: 9,
        name: "Extensiones completas",
        price: 200,
        duration: 120,
        image: "extensiones_completas.jpg",
        description: "Extensiones completas"
    },
    {
        id: 10,
        name: "Lavado solo",
        price: 10,
        duration: 15,
        image: "lavado_solo.jpg",
        description: "Solo lavado sin secado"
    }
];

// Elementos del DOM
const servicesContainer = document.getElementById('servicesContainer');
const productsContainer = document.getElementById('productsContainer');
const galleryContainer = document.getElementById('galleryContainer');
const pricesContainer = document.getElementById('pricesContainer');
const bookingBtn = document.getElementById('bookingBtn');
const adminBtn = document.getElementById('adminBtn');
const heroBookingBtn = document.getElementById('heroBookingBtn');
const bookingModal = document.getElementById('bookingModal');
const adminModal = document.getElementById('adminModal');
const imageViewerModal = document.getElementById('imageViewerModal');
const closeButtons = document.querySelectorAll('.close');
const bookingForm = document.getElementById('bookingForm');
const serviceSelect = document.getElementById('service');
const dateInput = document.getElementById('date');
const timeSlotsContainer = document.getElementById('timeSlots');
const adminContent = document.getElementById('adminContent');
const viewerImage = document.getElementById('viewerImage');
const prevImageBtn = document.getElementById('prevImage');
const nextImageBtn = document.getElementById('nextImage');

// Estado global
let currentAppointments = [];
let selectedTime = null;
let unsubscribeAppointments = null;
let currentImages = [];
let currentImageIndex = 0;

// Configurar fecha mínima (hoy)
dateInput.min = new Date().toISOString().split('T')[0];

// Cargar servicios
function loadServices() {
    servicesContainer.innerHTML = '';
    
    services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.innerHTML = `
            <div class="service-image-container">
                <img src="imagenes/servicios/${service.image}" alt="${service.name}" class="service-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPiR7c2VydmljZS5uYW1lfTwvdGV4dD48L3N2Zz4='">
                <div class="service-overlay">
                    <span class="service-price">$${service.price}</span>
                    <span class="service-duration">${service.duration}min</span>
                </div>
            </div>
            <div class="service-content">
                <h3>${service.name}</h3>
                <p class="service-description">${service.description}</p>
                <button class="btn btn-primary book-service" data-id="${service.id}">
                    <span class="btn-icon">📅</span>
                    Reservar
                </button>
            </div>
        `;
        servicesContainer.appendChild(serviceCard);
    });
    
    // Llenar select de servicios
    serviceSelect.innerHTML = '<option value="">Selecciona un servicio</option>';
    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = `${service.name} - $${service.price}`;
        serviceSelect.appendChild(option);
    });
    
    // Event listeners para botones de reserva
    document.querySelectorAll('.book-service').forEach(button => {
        button.addEventListener('click', function() {
            const serviceId = this.getAttribute('data-id');
            openBookingModal(serviceId);
        });
    });

    // Event listeners para imágenes de servicios
    document.querySelectorAll('.service-image').forEach(img => {
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            const serviceCard = this.closest('.service-card');
            serviceCard.classList.toggle('selected');
        });
    });
}

// Cargar precios
function loadPrices() {
    pricesContainer.innerHTML = '';
    
    services.forEach(service => {
        const priceCard = document.createElement('div');
        priceCard.className = 'price-card';
        priceCard.innerHTML = `
            <div class="price-header">
                <h3>${service.name}</h3>
                <span class="price-duration">${service.duration}min</span>
            </div>
            <div class="price-content">
                <span class="price-amount">$${service.price}</span>
                <p class="price-description">${service.description}</p>
            </div>
        `;
        pricesContainer.appendChild(priceCard);
    });
}

// Cargar productos
function loadProducts() {
    productsContainer.innerHTML = '';
    
    for (let i = 1; i <= 7; i++) {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="imagenes/productos/imagen${i}.jpg" alt="Producto ${i}" class="product-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2R1Y3RvICR7aX08L3RleHQ+PC9zdmc+='">
            </div>
            <div class="product-info">
                <h3>Producto Premium ${i}</h3>
                <p>Calidad profesional para el cuidado de tu belleza</p>
            </div>
        `;
        productsContainer.appendChild(productCard);
    }
}

// Cargar galería
function loadGallery() {
    galleryContainer.innerHTML = '';
    
    for (let i = 1; i <= 8; i++) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `
            <img src="imagenes/imagen${i}.jpg" alt="Trabajo ${i}" class="gallery-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdhbGVyw61hICR7aX08L3RleHQ+PC9zdmc+='">
            <div class="gallery-overlay">
                <span class="gallery-text">Trabajo ${i}</span>
            </div>
        `;
        galleryContainer.appendChild(galleryItem);
    }
}

// Sistema de visualización de imágenes
function initImageViewer() {
    // Recoger todas las imágenes de la página
    const allImages = [
        ...document.querySelectorAll('.service-image'),
        ...document.querySelectorAll('.product-image'),
        ...document.querySelectorAll('.gallery-image')
    ];

    allImages.forEach((img, index) => {
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            currentImages = allImages.map(img => img.src);
            currentImageIndex = index;
            openImageViewer(currentImageIndex);
        });
    });

    // Controles del visualizador
    prevImageBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        viewerImage.src = currentImages[currentImageIndex];
    });

    nextImageBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        viewerImage.src = currentImages[currentImageIndex];
    });

    // Navegación con teclado
    document.addEventListener('keydown', (e) => {
        if (imageViewerModal.style.display === 'block') {
            if (e.key === 'ArrowLeft') {
                prevImageBtn.click();
            } else if (e.key === 'ArrowRight') {
                nextImageBtn.click();
            } else if (e.key === 'Escape') {
                closeImageViewer();
            }
        }
    });
}

function openImageViewer(index) {
    viewerImage.src = currentImages[index];
    imageViewerModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeImageViewer() {
    imageViewerModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Sistema IA para calcular disponibilidad
function calculateAvailableTimes(selectedDate, serviceDuration) {
    const workStart = 9 * 60; // 9:00 en minutos
    const workEnd = 19 * 60; // 19:00 en minutos
    const slotDuration = 30; // Intervalos de 30 minutos
    const bufferTime = 15; // Tiempo entre citas
    
    const availableSlots = [];
    
    // Generar todos los slots posibles
    for (let time = workStart; time <= workEnd - serviceDuration; time += slotDuration) {
        const slotStart = time;
        const slotEnd = time + serviceDuration;
        
        // Verificar si el slot está disponible
        const isAvailable = !currentAppointments.some(appointment => {
            if (appointment.date !== selectedDate) return false;
            
            const appointmentStart = timeToMinutes(appointment.time);
            const appointmentEnd = appointmentStart + appointment.serviceDuration;
            
            // Verificar superposición
            return (slotStart < appointmentEnd + bufferTime) && 
                   (slotEnd + bufferTime > appointmentStart);
        });
        
        if (isAvailable) {
            availableSlots.push({
                time: minutesToTime(slotStart),
                display: minutesToDisplayTime(slotStart)
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
    const selectedServiceId = serviceSelect.value;
    
    if (!selectedDate || !selectedServiceId) {
        timeSlotsContainer.innerHTML = '<div class="time-slots-message">Selecciona fecha y servicio para ver horarios disponibles</div>';
        return;
    }
    
    const selectedService = services.find(s => s.id == selectedServiceId);
    if (!selectedService) return;
    
    const availableSlots = calculateAvailableTimes(selectedDate, selectedService.duration);
    
    timeSlotsContainer.innerHTML = '';
    
    if (availableSlots.length === 0) {
        timeSlotsContainer.innerHTML = '<div class="time-slots-message error">No hay horarios disponibles para esta fecha. Por favor selecciona otra fecha.</div>';
        return;
    }
    
    availableSlots.forEach(slot => {
        const timeSlot = document.createElement('button');
        timeSlot.type = 'button';
        timeSlot.className = 'time-slot';
        timeSlot.innerHTML = `
            <span class="time-slot-text">${slot.display}</span>
            <span class="time-slot-duration">${selectedService.duration}min</span>
        `;
        
        timeSlot.addEventListener('click', () => {
            // Remover selección anterior
            document.querySelectorAll('.time-slot').forEach(ts => {
                ts.classList.remove('selected');
            });
            
            // Seleccionar nuevo slot
            timeSlot.classList.add('selected');
            selectedTime = slot.time;
            
            // Actualizar input hidden para el formulario
            document.getElementById('selectedTime')?.remove();
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.id = 'selectedTime';
            hiddenInput.name = 'time';
            hiddenInput.value = selectedTime;
            bookingForm.appendChild(hiddenInput);
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
        
        // Actualizar horas si el modal está abierto
        if (bookingModal.style.display === 'block') {
            updateAvailableTimes();
        }
        
        // Actualizar panel admin si está abierto
        if (adminModal.style.display === 'block') {
            loadAdminAppointments();
        }
    });
}

// Abrir modal de reserva
function openBookingModal(serviceId = '') {
    bookingModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    if (serviceId) {
        serviceSelect.value = serviceId;
    }
    
    // Iniciar escucha de citas
    listenToAppointments();
    
    // Actualizar horas disponibles
    updateAvailableTimes();
}

// Cerrar modales
function closeModals() {
    bookingModal.style.display = 'none';
    adminModal.style.display = 'none';
    imageViewerModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Limpiar suscripción
    if (unsubscribeAppointments) {
        unsubscribeAppointments();
        unsubscribeAppointments = null;
    }
}

// Cargar panel admin
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
                <button type="submit" class="btn btn-primary btn-login">
                    <span class="btn-icon">🔑</span>
                    Acceder al Panel
                </button>
            </form>
        </div>
        <div class="admin-panel" id="adminPanel" style="display: none;">
            <div class="admin-header">
                <h3>📊 Panel de Control</h3>
                <p>Gestión de citas y sistema</p>
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
                    <h4>📂 Citas Canceladas</h4>
                </div>
                <div class="cancelled-list" id="cancelledList">
                    <div class="empty-state">No hay citas canceladas</div>
                </div>
            </div>
            
            <div class="admin-section">
                <div class="section-header">
                    <h4>⚙️ Control del Sistema</h4>
                </div>
                <div class="system-controls">
                    <button class="btn btn-warning" id="stopBookingBtn">
                        <span class="btn-icon">⏸️</span>
                        Pausar Sistema
                    </button>
                    <button class="btn btn-success" id="enableBookingBtn" style="display: none;">
                        <span class="btn-icon">▶️</span>
                        Reanudar Sistema
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
            alert('❌ Contraseña incorrecta. Intenta nuevamente.');
        }
    });

    // Botones admin
    document.getElementById('refreshAppointments').addEventListener('click', loadAdminAppointments);
    
    document.getElementById('stopBookingBtn').addEventListener('click', function() {
        if (confirm('¿Pausar el sistema de citas? Los clientes no podrán agendar nuevas citas.')) {
            this.style.display = 'none';
            document.getElementById('enableBookingBtn').style.display = 'inline-flex';
            alert('⏸️ Sistema pausado. No se aceptan nuevas citas.');
        }
    });

    document.getElementById('enableBookingBtn').addEventListener('click', function() {
        this.style.display = 'none';
        document.getElementById('stopBookingBtn').style.display = 'inline-flex';
        alert('✅ Sistema activado. Se aceptan nuevas citas.');
    });
}

// Cargar citas en el admin
async function loadAdminAppointments() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const q = query(collection(db, "appointments"), 
                       orderBy("timestamp", "desc"));
        
        const querySnapshot = await getDocs(q);
        const appointmentsList = document.getElementById('appointmentsList');
        const cancelledList = document.getElementById('cancelledList');
        
        let activeAppointments = [];
        let cancelledAppointments = [];
        let todayRevenue = 0;

        querySnapshot.forEach((doc) => {
            const appointment = { id: doc.id, ...doc.data() };
            
            if (appointment.status === 'cancelled') {
                cancelledAppointments.push(appointment);
            } else {
                activeAppointments.push(appointment);
                if (appointment.date === today) {
                    todayRevenue += appointment.servicePrice || 0;
                }
            }
        });

        // Actualizar estadísticas
        document.getElementById('activeAppointmentsCount').textContent = activeAppointments.length;
        document.getElementById('dailyRevenue').textContent = `$${todayRevenue}`;

        // Mostrar citas activas
        if (activeAppointments.length === 0) {
            appointmentsList.innerHTML = '<div class="empty-state">No hay citas activas</div>';
        } else {
            let html = '<div class="appointments-grid">';
            activeAppointments.forEach((appointment, index) => {
                html += `
                    <div class="appointment-card" data-id="${appointment.id}">
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

        // Mostrar citas canceladas
        if (cancelledAppointments.length === 0) {
            cancelledList.innerHTML = '<div class="empty-state">No hay citas canceladas</div>';
        } else {
            let html = '<div class="cancelled-grid">';
            cancelledAppointments.forEach((appointment) => {
                const cancelledDate = appointment.cancelledAt ? 
                    new Date(appointment.cancelledAt.seconds * 1000).toLocaleDateString() : 'Fecha no disponible';
                
                html += `
                    <div class="cancelled-card">
                        <div class="cancelled-header">
                            <span class="cancelled-client">${appointment.clientName}</span>
                            <span class="cancelled-date">Cancelada: ${cancelledDate}</span>
                        </div>
                        <div class="cancelled-body">
                            <div class="cancelled-service">${appointment.serviceName}</div>
                            <div class="cancelled-original">Original: ${appointment.date} • ${appointment.time}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            cancelledList.innerHTML = html;
        }

        // Event listeners para botones de cancelar
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-id');
                if (confirm('¿Cancelar esta cita?')) {
                    await updateDoc(doc(db, "appointments", id), {
                        status: 'cancelled',
                        cancelledAt: new Date()
                    });
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
    loadServices();
    loadPrices();
    loadProducts();
    loadGallery();
    initImageViewer();
    
    // Event listeners para modales
    bookingBtn.addEventListener('click', () => openBookingModal());
    heroBookingBtn.addEventListener('click', () => openBookingModal());
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
    
    // Event listeners para actualizar horas disponibles
    dateInput.addEventListener('change', updateAvailableTimes);
    serviceSelect.addEventListener('change', updateAvailableTimes);
    
    // Formulario de citas
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedTime) {
            alert('❌ Por favor selecciona una hora disponible');
            return;
        }
        
        const formData = new FormData(bookingForm);
        const serviceId = formData.get('service');
        const date = formData.get('date');
        const time = selectedTime;
        const name = formData.get('name');
        const phone = formData.get('phone');
        
        const selectedService = services.find(s => s.id == serviceId);
        
        if (!selectedService) {
            alert('❌ Por favor selecciona un servicio válido');
            return;
        }
        
        try {
            await addDoc(collection(db, "appointments"), {
                serviceName: selectedService.name,
                servicePrice: selectedService.price,
                serviceDuration: selectedService.duration,
                date: date,
                time: time,
                clientName: name,
                clientPhone: phone,
                status: 'active',
                timestamp: new Date()
            });
            
            alert(`🎉 ¡Cita reservada exitosamente!\n\n` +
                  `📋 Servicio: ${selectedService.name}\n` +
                  `💰 Precio: $${selectedService.price}\n` +
                  `⏱️ Duración: ${selectedService.duration}min\n` +
                  `📅 Fecha: ${date}\n` +
                  `🕐 Hora: ${minutesToDisplayTime(timeToMinutes(time))}\n` +
                  `👤 Nombre: ${name}\n` +
                  `📞 Teléfono: ${phone}\n\n` +
                  `✅ Te esperamos en el salón.`);
            
            bookingForm.reset();
            selectedTime = null;
            timeSlotsContainer.innerHTML = '';
            closeModals();
            
        } catch (error) {
            console.error("Error al reservar cita: ", error);
            alert("❌ Error al reservar la cita. Por favor intenta nuevamente.");
        }
    });
    
    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModals();
        }
    });
});