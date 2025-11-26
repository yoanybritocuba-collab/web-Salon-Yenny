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
const imageCounter = document.getElementById('imageCounter');

// Estado global
let currentAppointments = [];
let selectedTime = null;
let unsubscribeAppointments = null;
let currentImages = [];
let currentImageIndex = 0;
let selectedServices = new Set();

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
            </div>
        `;
        
        // Event listener para seleccionar/deseleccionar servicio
        serviceCard.addEventListener('click', function(e) {
            if (!e.target.classList.contains('btn')) {
                toggleServiceSelection(service);
            }
        });
        
        servicesContainer.appendChild(serviceCard);
    });
    
    updateSelectedServicesUI();
}

// Toggle service selection
function toggleServiceSelection(service) {
    if (selectedServices.has(service.id)) {
        selectedServices.delete(service.id);
    } else {
        selectedServices.add(service.id);
    }
    
    updateSelectedServicesUI();
    updateServiceCardsUI();
}

// Update service cards visual state
function updateServiceCardsUI() {
    document.querySelectorAll('.service-card').forEach(card => {
        const serviceName = card.querySelector('h3').textContent;
        const service = services.find(s => s.name === serviceName);
        
        if (service && selectedServices.has(service.id)) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

// Update selected services summary
function updateSelectedServicesUI() {
    const summary = document.getElementById('selectedServicesSummary');
    const servicesList = document.getElementById('selectedServicesList');
    const totalTime = document.getElementById('totalTime');
    const totalPrice = document.getElementById('totalPrice');
    
    if (selectedServices.size === 0) {
        summary.style.display = 'none';
        return;
    }
    
    summary.style.display = 'block';
    servicesList.innerHTML = '';
    
    let totalDuration = 0;
    let totalCost = 0;
    
    selectedServices.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            totalDuration += service.duration;
            totalCost += service.price;
            
            const serviceItem = document.createElement('div');
            serviceItem.className = 'selected-service-item';
            serviceItem.innerHTML = `
                <div class="selected-service-info">
                    <span class="selected-service-name">${service.name}</span>
                    <div class="selected-service-details">
                        <span>$${service.price}</span>
                        <span>${service.duration}min</span>
                    </div>
                </div>
                <button type="button" class="remove-service" data-id="${service.id}">×</button>
            `;
            
            serviceItem.querySelector('.remove-service').addEventListener('click', function(e) {
                e.stopPropagation();
                selectedServices.delete(service.id);
                updateSelectedServicesUI();
                updateServiceCardsUI();
            });
            
            servicesList.appendChild(serviceItem);
        }
    });
    
    totalTime.textContent = `${totalDuration} min`;
    totalPrice.textContent = `$${totalCost}`;
    
    // Update modal totals
    document.getElementById('modalTotalTime').textContent = `${totalDuration} min`;
    document.getElementById('modalTotalPrice').textContent = `$${totalCost}`;
}

// Load selected services into booking modal
function loadSelectedServicesToModal() {
    const container = document.getElementById('selectedServicesModal');
    container.innerHTML = '';
    
    selectedServices.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            const serviceItem = document.createElement('div');
            serviceItem.className = 'selected-service-modal-item';
            serviceItem.innerHTML = `
                <span class="service-modal-name">${service.name}</span>
                <div class="service-modal-details">
                    <span>$${service.price}</span>
                    <span>${service.duration}min</span>
                </div>
            `;
            container.appendChild(serviceItem);
        }
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
        updateImageViewer();
    });

    nextImageBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        updateImageViewer();
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
    currentImageIndex = index;
    updateImageViewer();
    imageViewerModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function updateImageViewer() {
    viewerImage.src = currentImages[currentImageIndex];
    imageCounter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
}

function closeImageViewer() {
    imageViewerModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Sistema IA para calcular disponibilidad
function calculateAvailableTimes(selectedDate, totalDuration) {
    const workStart = 9 * 60; // 9:00 en minutos
    const workEnd = 19 * 60; // 19:00 en minutos
    const slotDuration = 30; // Intervalos de 30 minutos
    const bufferTime = 15; // Tiempo entre citas
    
    const availableSlots = [];
    
    // Generar todos los slots posibles
    for (let time = workStart; time <= workEnd - totalDuration; time += slotDuration) {
        const slotStart = time;
        const slotEnd = time + totalDuration;
        
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
    
    if (!selectedDate || selectedServices.size === 0) {
        timeSlotsContainer.innerHTML = '<div class="time-slots-message">Selecciona fecha y servicios para ver horarios disponibles</div>';
        return;
    }
    
    // Calcular duración total de servicios seleccionados
    let totalDuration = 0;
    selectedServices.forEach(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (service) totalDuration += service.duration;
    });
    
    const availableSlots = calculateAvailableTimes(selectedDate, totalDuration);
    
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
            <span class="time-slot-duration">${totalDuration}min</span>
        `;
        
        timeSlot.addEventListener('click', () => {
            // Remover selección anterior
            document.querySelectorAll('.time-slot').forEach(ts => {
                ts.classList.remove('selected');
            });
            
            // Seleccionar nuevo slot
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
function openBookingModal() {
    if (selectedServices.size === 0) {
        alert('❌ Por favor selecciona al menos un servicio antes de reservar.');
        return;
    }
    
    bookingModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Cargar servicios seleccionados en el modal
    loadSelectedServicesToModal();
    
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

// Cargar panel admin (mantenido igual que antes)
function loadAdminPanel() {
    // ... (código del panel admin se mantiene igual)
}

// Cargar citas en el admin (mantenido igual que antes)
async function loadAdminAppointments() {
    // ... (código de carga de citas se mantiene igual)
}

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadServices();
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
    
    // Event listener para botón de reservar servicios seleccionados
    document.getElementById('bookSelectedBtn')?.addEventListener('click', () => {
        openBookingModal();
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
    
    // Formulario de citas
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedTime) {
            alert('❌ Por favor selecciona una hora disponible');
            return;
        }
        
        const formData = new FormData(bookingForm);
        const date = formData.get('date');
        const time = selectedTime;
        const name = formData.get('name');
        const phone = formData.get('phone');
        
        // Calcular precio total y nombres de servicios
        let totalPrice = 0;
        let serviceNames = [];
        let totalDuration = 0;
        
        selectedServices.forEach(serviceId => {
            const service = services.find(s => s.id === serviceId);
            if (service) {
                totalPrice += service.price;
                serviceNames.push(service.name);
                totalDuration += service.duration;
            }
        });
        
        const serviceName = serviceNames.join(' + ');
        
        try {
            await addDoc(collection(db, "appointments"), {
                serviceName: serviceName,
                servicePrice: totalPrice,
                serviceDuration: totalDuration,
                date: date,
                time: time,
                clientName: name,
                clientPhone: phone,
                status: 'active',
                timestamp: new Date()
            });
            
            alert(`🎉 ¡Cita reservada exitosamente!\n\n` +
                  `📋 Servicios: ${serviceName}\n` +
                  `💰 Precio Total: $${totalPrice}\n` +
                  `⏱️ Duración Total: ${totalDuration}min\n` +
                  `📅 Fecha: ${date}\n` +
                  `🕐 Hora: ${minutesToDisplayTime(timeToMinutes(time))}\n` +
                  `👤 Nombre: ${name}\n` +
                  `📞 Teléfono: ${phone}\n\n` +
                  `✅ Te esperamos en el salón.`);
            
            bookingForm.reset();
            selectedTime = null;
            selectedServices.clear();
            timeSlotsContainer.innerHTML = '';
            updateSelectedServicesUI();
            updateServiceCardsUI();
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