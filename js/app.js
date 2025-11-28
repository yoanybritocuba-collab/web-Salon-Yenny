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

// ========== MENÚ MÓVIL ==========
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navCompact = document.querySelector('.nav-compact');
    
    if (mobileMenuToggle && navCompact) {
        mobileMenuToggle.addEventListener('click', function() {
            navCompact.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

// ========== MOSTRAR INDICADOR DE SERVICIOS ==========
function showServicesIndicator() {
    const indicator = getElement('servicesIndicator');
    if (indicator) {
        indicator.style.display = 'block';
        
        // Ocultar después de 8 segundos
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 8000);
    }
}

// ========== CARGA DE SERVICIOS CON BOTONES FLOTANTES ==========
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
            <button class="service-book-btn" data-service-id="${service.id}">
                <span class="btn-icon">➕</span>
                Agregar
            </button>
        `;
        servicesContainer.appendChild(serviceCard);

        // Event listener para el botón flotante
        const bookBtn = serviceCard.querySelector('.service-book-btn');
        bookBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleServiceSelection(service, serviceCard, bookBtn);
        });

        // Event listener para toda la tarjeta
        serviceCard.addEventListener('click', () => {
            toggleServiceSelection(service, serviceCard, bookBtn);
        });
    });
    console.log('✅ Servicios cargados:', services.length);
}

function toggleServiceSelection(service, card, bookBtn) {
    const index = selectedServices.findIndex(s => s.id === service.id);
    
    if (index === -1) {
        // Agregar servicio
        selectedServices.push(service);
        card.classList.add('selected');
        bookBtn.classList.add('added');
        bookBtn.innerHTML = '<span class="btn-icon">✓</span> Agregado';
        showNotification(`✅ ${service.name} añadido`, 'success');
        
        // Efecto visual de confirmación
        bookBtn.style.background = 'linear-gradient(135deg, #27ae60, #219653)';
    } else {
        // Remover servicio
        selectedServices.splice(index, 1);
        card.classList.remove('selected');
        bookBtn.classList.remove('added');
        bookBtn.innerHTML = '<span class="btn-icon">➕</span> Agregar';
        showNotification(`🗑️ ${service.name} removido`, 'info');
        
        // Restaurar color original
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

        // Event listeners para botones de eliminar
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

// ========== SCROLL TO SERVICES ==========
function scrollToServices() {
    const servicesSection = document.getElementById('servicios');
    if (servicesSection) {
        servicesSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        // Mostrar indicador después de un pequeño delay
        setTimeout(showServicesIndicator, 500);
    }
}

// ========== MODAL DE CITAS ==========
function openBookingModal() {
    // Verificar si las citas están pausadas
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
    
    // Inicializar fecha mínima como hoy
    const dateInput = getElement('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today; // Establecer hoy como valor por defecto
    }
    
    // Generar horarios automáticamente al abrir el modal
    generateTimeSlots();
}

function closeBookingModal() {
    const modal = getElement('bookingModal');
    if (modal) {
        modal.style.display = 'none';
        selectedTime = null; // Resetear hora seleccionada
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
function generateTimeSlots() {
    const timeSlots = getElement('timeSlots');
    const dateInput = getElement('date');
    if (!timeSlots || !dateInput) return;

    // Obtener fecha seleccionada
    const selectedDate = dateInput.value;
    const today = new Date().toISOString().split('T')[0];
    
    // Limpiar horarios anteriores
    timeSlots.innerHTML = '';
    selectedTime = null;

    // Generar horarios de 9:00 AM a 6:00 PM cada 30 minutos
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            if (hour === 18 && minute > 0) break; // No pasar de las 18:00
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(timeString);
        }
    }

    // Si es hoy, filtrar horarios pasados
    let availableSlots = slots;
    if (selectedDate === today) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        // Solo mostrar horarios que sean al menos 30 minutos en el futuro
        availableSlots = slots.filter(slot => {
            const [hours, minutes] = slot.split(':');
            const slotTimeInMinutes = parseInt(hours) * 60 + parseInt(minutes);
            return slotTimeInMinutes > currentTimeInMinutes + 30;
        });
    }

    // Crear botones para cada horario disponible
    availableSlots.forEach(slot => {
        const slotElement = document.createElement('button');
        slotElement.type = 'button';
        slotElement.className = 'time-slot';
        slotElement.textContent = slot;
        slotElement.addEventListener('click', function() {
            // Remover selección anterior
            timeSlots.querySelectorAll('.time-slot').forEach(s => {
                s.classList.remove('selected');
            });
            
            // Seleccionar nuevo slot
            this.classList.add('selected');
            selectedTime = slot;
            console.log('✅ Hora seleccionada:', selectedTime);
        });
        
        timeSlots.appendChild(slotElement);
    });
    
    // Si no hay horarios, mostrar mensaje
    if (availableSlots.length === 0) {
        timeSlots.innerHTML = '<div class="time-slots-placeholder">No hay horarios disponibles para hoy. Por favor selecciona otra fecha.</div>';
    }
}

// ========== NOTIFICACIONES ==========
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Estilos básicos para la notificación
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
    
    // Agregar estilos de animación si no existen
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
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
    
    // Cerrar al hacer click
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// ========== PRODUCTOS ==========
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
            productsContainer.appendChild(productCard);
        });
        
        console.log('✅ Productos cargados:', data.productos.length);
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        showNotification('⚠️ Error cargando productos', 'error');
    }
}

// ========== GALERÍA CORREGIDA ==========
async function loadGallery() {
    try {
        const galleryContainer = getElement('galleryContainer');
        
        if (!galleryContainer) return;
        
        galleryContainer.innerHTML = '';
        
        // Array con las imágenes de la galería de trabajos - RUTA CORREGIDA
        const galeriaTrabajos = [
            {
                id: 1,
                archivo: "imagen1.jpg",
                descripcion: "Trabajo profesional de coloración"
            },
            {
                id: 2,
                archivo: "imagen2.jpg", 
                descripcion: "Corte y peinado moderno"
            },
            {
                id: 3,
                archivo: "imagen3.jpg",
                descripcion: "Extensiones de cabello"
            },
            {
                id: 4,
                archivo: "imagen4.jpg",
                descripcion: "Tratamiento de keratina"
            },
            {
                id: 5,
                archivo: "imagen5.jpg",
                descripcion: "Peinado para eventos"
            },
            {
                id: 6,
                archivo: "imagen6.jpg",
                descripcion: "Coloración fantasía"
            },
            {
                id: 7,
                archivo: "imagen7.jpg",
                descripcion: "Corte profesional"
            },
            {
                id: 8,
                archivo: "imagen8.jpg",
                descripcion: "Maquillaje y estilismo"
            }
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
        
        console.log('✅ Galería cargada:', galeriaTrabajos.length, 'imágenes');
        console.log('📁 Ruta utilizada: imagenes/Galería-Trabajo/');
    } catch (error) {
        console.error('❌ Error cargando galería:', error);
        showNotification('⚠️ Error cargando galería de trabajos', 'error');
        
        // Mostrar mensaje de error en la galería
        const galleryContainer = getElement('galleryContainer');
        if (galleryContainer) {
            galleryContainer.innerHTML = `
                <div class="gallery-error">
                    <div class="error-icon">📷</div>
                    <h3>Galería no disponible</h3>
                    <p>No se pudieron cargar las imágenes de trabajos.</p>
                    <p class="error-detail">Ruta esperada: imagenes/Galería-Trabajo/</p>
                    <p class="error-detail">Error: ${error.message}</p>
                </div>
            `;
        }
    }
}

// ========== VISOR DE IMÁGENES CORREGIDO ==========
function openImageViewer(index) {
    currentImageIndex = index;
    const viewerModal = getElement('imageViewerModal');
    const viewerImage = getElement('viewerImage');
    
    if (!viewerModal || !viewerImage) return;
    
    viewerImage.src = `imagenes/Galería-Trabajo/${currentImages[currentImageIndex].archivo}`;
    viewerImage.alt = currentImages[currentImageIndex].descripcion;
    viewerModal.style.display = 'block';
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
    }
}

// ========== INICIALIZACIÓN DE FECHA ==========
function initializeDateInput() {
    const dateInput = getElement('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        
        dateInput.addEventListener('change', function() {
            console.log('📅 Fecha seleccionada:', this.value);
            generateTimeSlots();
        });
    }
}

// ========== ENVÍO DE FORMULARIO ==========
function setupBookingForm() {
    const bookingForm = getElement('bookingForm');
    if (!bookingForm) return;
    
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Verificar si las citas están pausadas
        if (isBookingPaused) {
            showNotification('⏸️ Las citas están temporalmente desactivadas. Por favor, intente más tarde.', 'warning');
            return;
        }
        
        if (selectedServices.length === 0) {
            showNotification('⚠️ Selecciona al menos un servicio', 'warning');
            return;
        }
        
        if (!selectedTime) {
            showNotification('⚠️ Selecciona una hora', 'warning');
            return;
        }
        
        const formData = new FormData(this);
        const date = formData.get('date');
        const name = formData.get('name');
        const phone = formData.get('phone');
        
        // Validaciones básicas
        if (!date || !name || !phone) {
            showNotification('⚠️ Completa todos los campos', 'warning');
            return;
        }
        
        try {
            // Calcular total y duración
            const total = selectedServices.reduce((sum, service) => sum + service.price, 0);
            const duration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
            
            // Crear cita en Firebase - Estado automáticamente "confirmada"
            const docRef = await addDoc(collection(db, "citas"), {
                fecha: date,
                hora: selectedTime,
                nombre: name,
                telefono: phone,
                servicios: selectedServices.map(s => s.name),
                total: total,
                duracion: duration,
                estado: 'confirmada', // Cambiado a confirmada automáticamente
                timestamp: new Date()
            });
            
            console.log('✅ Cita guardada con ID:', docRef.id);
            
            // Mostrar modal de éxito
            closeBookingModal();
            showSuccessModal();
            
            // Resetear selección
            selectedServices = [];
            updateBookingPanel();
            
            // Resetear formulario
            bookingForm.reset();
            selectedTime = null;
            
            // Resetear horarios
            generateTimeSlots();
            
        } catch (error) {
            console.error('❌ Error guardando cita:', error);
            showNotification('❌ Error al guardar la cita', 'error');
        }
    });
}

function showSuccessModal() {
    const successModal = getElement('successModal');
    if (successModal) {
        successModal.style.display = 'block';
    }
}

function closeSuccessModal() {
    const successModal = getElement('successModal');
    if (successModal) {
        successModal.style.display = 'none';
    }
}

// ========== ADMIN - CON CONTRASEÑA ==========
function setupAdminModal() {
    const adminBtn = getElement('adminBtn');
    const adminModal = getElement('adminModal');
    
    if (adminBtn && adminModal) {
        adminBtn.addEventListener('click', () => {
            const password = prompt('🔐 Ingresa la contraseña de administración:');
            if (password === 'y1994') {
                adminModal.style.display = 'block';
                loadAdminContent();
            } else if (password !== null) {
                showNotification('❌ Contraseña incorrecta', 'error');
            }
        });
    }
}

function loadAdminContent() {
    const adminContent = getElement('adminContent');
    if (!adminContent) return;
    
    adminContent.innerHTML = `
        <div class="admin-header">
            <h2>🔧 Panel de Administración</h2>
            <p>Gestión de citas y servicios</p>
            
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
            <button class="tab-btn" data-tab="estadisticas">📊 Estadísticas</button>
        </div>
        
        <div class="admin-content">
            <div id="citasTab" class="tab-content active">
                <div class="citas-header">
                    <h3>Citas Confirmadas</h3>
                    <div class="citas-stats">
                        <span class="stat-item">Total: <strong id="totalCitas">0</strong></span>
                        <span class="stat-item">Hoy: <strong id="citasHoy">0</strong></span>
                    </div>
                </div>
                <div id="citasList" class="citas-list">
                    Cargando citas...
                </div>
            </div>
            
            <div id="estadisticasTab" class="tab-content">
                <h3>📊 Estadísticas del Día</h3>
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
                            <span class="stat-label">Tiempo Total</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-info">
                            <span class="stat-value"><span id="citasCompletadas">0</span></span>
                            <span class="stat-label">Citas Hoy</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Configurar botón de pausar/reanudar citas
    const toggleBookingBtn = getElement('toggleBookingBtn');
    if (toggleBookingBtn) {
        toggleBookingBtn.addEventListener('click', function() {
            isBookingPaused = !isBookingPaused;
            localStorage.setItem('isBookingPaused', isBookingPaused);
            showNotification(
                isBookingPaused ? '⏸️ Citas pausadas - No se aceptan nuevas reservas' : '✅ Citas reanudadas - Ya puedes aceptar reservas',
                isBookingPaused ? 'warning' : 'success'
            );
            loadAdminContent(); // Recargar para actualizar la interfaz
        });
    }
    
    // Cargar citas y estadísticas
    loadCitas();
    loadEstadisticas();
    
    // Configurar tabs
    setupAdminTabs();
}

function setupAdminTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Activar tab seleccionado
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
            
            // Contar citas de hoy
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

        // Actualizar contadores
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
            
            // Solo contar citas de hoy y confirmadas
            if (cita.fecha === today && cita.estado === 'confirmada') {
                ingresosHoy += cita.total;
                tiempoTotal += cita.duracion;
                citasCompletadas++;
            }
        });

        // Actualizar estadísticas
        const ingresosHoyElement = getElement('ingresosHoy');
        const tiempoTotalElement = getElement('tiempoTotal');
        const citasCompletadasElement = getElement('citasCompletadas');
        
        if (ingresosHoyElement) ingresosHoyElement.textContent = ingresosHoy;
        if (tiempoTotalElement) tiempoTotalElement.textContent = tiempoTotal;
        if (citasCompletadasElement) citasCompletadasElement.textContent = citasCompletadas;
    });
}

// ========== FUNCIONES ADMIN MEJORADAS ==========
async function cancelarCita(citaId) {
    if (confirm('¿Estás seguro de cancelar esta cita? El horario quedará disponible para otros clientes.')) {
        try {
            await deleteDoc(doc(db, "citas", citaId));
            showNotification('✅ Cita cancelada - El horario ahora está disponible', 'success');
        } catch (error) {
            console.error('Error cancelando cita:', error);
            showNotification('❌ Error cancelando cita', 'error');
        }
    }
}

// ========== EVENT LISTENERS GLOBALES ==========
function setupGlobalEventListeners() {
    // Cerrar modales al hacer click fuera
    document.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Cerrar modales con botón X
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Cerrar modal de éxito
    const closeSuccessBtn = getElement('closeSuccessModal');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', closeSuccessModal);
    }
    
    // Navegación de imágenes
    const prevImageBtn = getElement('prevImage');
    const nextImageBtn = getElement('nextImage');
    
    if (prevImageBtn) {
        prevImageBtn.addEventListener('click', () => navigateImage(-1));
    }
    if (nextImageBtn) {
        nextImageBtn.addEventListener('click', () => navigateImage(1));
    }
}

// ========== INICIALIZACIÓN PRINCIPAL ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando aplicación...');
    
    // Cargar estado de pausa desde localStorage
    const savedPauseState = localStorage.getItem('isBookingPaused');
    if (savedPauseState !== null) {
        isBookingPaused = savedPauseState === 'true';
    }
    
    // Inicializar efectos del header
    initHeaderScroll();
    initMobileMenu();
    
    // Cargar contenido
    loadServices();
    loadProducts();
    loadGallery();
    initializeDateInput();
    
    // Configurar eventos
    setupGlobalEventListeners();
    setupBookingForm();
    setupAdminModal();
    
    // Botones de citas
    const bookingBtn = getElement('bookingBtn');
    const heroBookingBtn = getElement('heroBookingBtn');
    const insertarCitaBtn = getElement('insertarCitaBtn');
    
    if (bookingBtn) {
        bookingBtn.addEventListener('click', scrollToServices);
    }
    
    if (heroBookingBtn) {
        heroBookingBtn.addEventListener('click', scrollToServices);
    }
    
    if (insertarCitaBtn) {
        insertarCitaBtn.addEventListener('click', openBookingModal);
    }
    
    console.log('✅ Aplicación inicializada correctamente');
    console.log('📊 Estado de citas:', isBookingPaused ? '⏸️ PAUSADAS' : '✅ ACTIVAS');
});

// ========== EXPORTAR FUNCIONES PARA HTML ==========
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.openImageViewer = openImageViewer;
window.closeImageViewer = closeImageViewer;
window.navigateImage = navigateImage;
window.cancelarCita = cancelarCita;