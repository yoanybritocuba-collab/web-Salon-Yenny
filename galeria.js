<<<<<<< HEAD
let galeriaActual=[];
let indiceImagenActual=0;
let inicioX=0;
let movimientoX=0;

function inicializarGaleriaModerno(){
  document.getElementById('gallery-close').addEventListener('click', cerrarGaleriaModerno);
  document.getElementById('gallery-prev').addEventListener('click', galeriaAnterior);
  document.getElementById('gallery-next').addEventListener('click', galeriaSiguiente);
  const slides = document.getElementById('gallery-slides');
  slides.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; movimientoX=0; });
  slides.addEventListener('touchmove', (e) => { movimientoX = e.touches[0].clientX - inicioX; });
  slides.addEventListener('touchend', () => {
    const umbral = 50;
    if(movimientoX>umbral) galeriaAnterior();
    else if(movimientoX<-umbral) galeriaSiguiente();
    inicioX=0; movimientoX=0;
  });
  document.addEventListener('keydown', (e) => {
    if(document.getElementById('gallery-modal').style.display==='flex'){
      if(e.key==='ArrowLeft') galeriaAnterior();
      else if(e.key==='ArrowRight') galeriaSiguiente();
      else if(e.key==='Escape') cerrarGaleriaModerno();
    }
  });
}

function abrirGaleriaModerno(imagenes, indiceInicial){
  galeriaActual=imagenes;
  indiceImagenActual=indiceInicial;
  const modal=document.getElementById('gallery-modal');
  const slides=document.getElementById('gallery-slides');
  const thumbnails=document.getElementById('gallery-thumbnails');
  slides.innerHTML=''; thumbnails.innerHTML='';
  imagenes.forEach((imagen,index)=>{
    const slide=document.createElement('div'); slide.className='gallery-slide';
    const img=document.createElement('img'); img.src=imagen.src; img.alt=imagen.alt;
    slide.appendChild(img); slides.appendChild(slide);
    const thumb=document.createElement('div'); thumb.className='gallery-thumb';
    if(index===indiceInicial) thumb.classList.add('active');
    const thumbImg=document.createElement('img'); thumbImg.src=imagen.src; thumbImg.alt=imagen.alt;
    thumb.appendChild(thumbImg);
    thumb.addEventListener('click',()=>cambiarImagenGaleria(index));
    thumbnails.appendChild(thumb);
  });
  modal.style.display='flex';
  actualizarContadorGaleria();
  slides.style.transform=`translateX(-${indiceImagenActual*100}%)`;
}

function cerrarGaleriaModerno(){ document.getElementById('gallery-modal').style.display='none'; galeriaActual=[]; }
function galeriaAnterior(){ if(indiceImagenActual>0) cambiarImagenGaleria(indiceImagenActual-1); else cambiarImagenGaleria(galeriaActual.length-1); }
function galeriaSiguiente(){ if(indiceImagenActual<galeriaActual.length-1) cambiarImagenGaleria(indiceImagenActual+1); else cambiarImagenGaleria(0); }
function cambiarImagenGaleria(nuevoIndice){
  indiceImagenActual=nuevoIndice;
  const slides=document.getElementById('gallery-slides');
  const thumbnails=document.getElementById('gallery-thumbnails').children;
  slides.style.transform=`translateX(-${indiceImagenActual*100}%)`;
  for(let i=0;i<thumbnails.length;i++){
    if(i===indiceImagenActual) thumbnails[i].classList.add('active');
    else thumbnails[i].classList.remove('active');
  }
  actualizarContadorGaleria();
}
function actualizarContadorGaleria(){
  const counter=document.getElementById('gallery-counter');
  counter.textContent=`${indiceImagenActual+1} / ${galeriaActual.length}`;
}
let galeriaActual=[];
let indiceImagenActual=0;
let inicioX=0;
let movimientoX=0;

function inicializarGaleriaModerno(){
  document.getElementById('gallery-close').addEventListener('click', cerrarGaleriaModerno);
  document.getElementById('gallery-prev').addEventListener('click', galeriaAnterior);
  document.getElementById('gallery-next').addEventListener('click', galeriaSiguiente);
  const slides = document.getElementById('gallery-slides');
  slides.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; movimientoX=0; });
  slides.addEventListener('touchmove', (e) => { movimientoX = e.touches[0].clientX - inicioX; });
  slides.addEventListener('touchend', () => {
    const umbral = 50;
    if(movimientoX>umbral) galeriaAnterior();
    else if(movimientoX<-umbral) galeriaSiguiente();
    inicioX=0; movimientoX=0;
  });
  document.addEventListener('keydown', (e) => {
    if(document.getElementById('gallery-modal').style.display==='flex'){
      if(e.key==='ArrowLeft') galeriaAnterior();
      else if(e.key==='ArrowRight') galeriaSiguiente();
      else if(e.key==='Escape') cerrarGaleriaModerno();
    }
  });
}

function abrirGaleriaModerno(imagenes, indiceInicial){
  galeriaActual=imagenes;
  indiceImagenActual=indiceInicial;
  const modal=document.getElementById('gallery-modal');
  const slides=document.getElementById('gallery-slides');
  const thumbnails=document.getElementById('gallery-thumbnails');
  slides.innerHTML=''; thumbnails.innerHTML='';
  imagenes.forEach((imagen,index)=>{
    const slide=document.createElement('div'); slide.className='gallery-slide';
    const img=document.createElement('img'); img.src=imagen.src; img.alt=imagen.alt;
    slide.appendChild(img); slides.appendChild(slide);
    const thumb=document.createElement('div'); thumb.className='gallery-thumb';
    if(index===indiceInicial) thumb.classList.add('active');
    const thumbImg=document.createElement('img'); thumbImg.src=imagen.src; thumbImg.alt=imagen.alt;
    thumb.appendChild(thumbImg);
    thumb.addEventListener('click',()=>cambiarImagenGaleria(index));
    thumbnails.appendChild(thumb);
  });
  modal.style.display='flex';
  actualizarContadorGaleria();
  slides.style.transform=`translateX(-${indiceImagenActual*100}%)`;
}

function cerrarGaleriaModerno(){ document.getElementById('gallery-modal').style.display='none'; galeriaActual=[]; }
function galeriaAnterior(){ if(indiceImagenActual>0) cambiarImagenGaleria(indiceImagenActual-1); else cambiarImagenGaleria(galeriaActual.length-1); }
function galeriaSiguiente(){ if(indiceImagenActual<galeriaActual.length-1) cambiarImagenGaleria(indiceImagenActual+1); else cambiarImagenGaleria(0); }
function cambiarImagenGaleria(nuevoIndice){
  indiceImagenActual=nuevoIndice;
  const slides=document.getElementById('gallery-slides');
  const thumbnails=document.getElementById('gallery-thumbnails').children;
  slides.style.transform=`translateX(-${indiceImagenActual*100}%)`;
  for(let i=0;i<thumbnails.length;i++){
    if(i===indiceImagenActual) thumbnails[i].classList.add('active');
    else thumbnails[i].classList.remove('active');
  }
  actualizarContadorGaleria();
}
function actualizarContadorGaleria(){
  const counter=document.getElementById('gallery-counter');
  counter.textContent=`${indiceImagenActual+1} / ${galeriaActual.length}`;
}
=======
let galeriaActual=[];
let indiceImagenActual=0;
let inicioX=0;
let movimientoX=0;

function inicializarGaleriaModerno(){
  document.getElementById('gallery-close').addEventListener('click', cerrarGaleriaModerno);
  document.getElementById('gallery-prev').addEventListener('click', galeriaAnterior);
  document.getElementById('gallery-next').addEventListener('click', galeriaSiguiente);
  const slides = document.getElementById('gallery-slides');
  slides.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; movimientoX=0; });
  slides.addEventListener('touchmove', (e) => { movimientoX = e.touches[0].clientX - inicioX; });
  slides.addEventListener('touchend', () => {
    const umbral = 50;
    if(movimientoX>umbral) galeriaAnterior();
    else if(movimientoX<-umbral) galeriaSiguiente();
    inicioX=0; movimientoX=0;
  });
  document.addEventListener('keydown', (e) => {
    if(document.getElementById('gallery-modal').style.display==='flex'){
      if(e.key==='ArrowLeft') galeriaAnterior();
      else if(e.key==='ArrowRight') galeriaSiguiente();
      else if(e.key==='Escape') cerrarGaleriaModerno();
    }
  });
}

function abrirGaleriaModerno(imagenes, indiceInicial){
  galeriaActual=imagenes;
  indiceImagenActual=indiceInicial;
  const modal=document.getElementById('gallery-modal');
  const slides=document.getElementById('gallery-slides');
  const thumbnails=document.getElementById('gallery-thumbnails');
  slides.innerHTML=''; thumbnails.innerHTML='';
  imagenes.forEach((imagen,index)=>{
    const slide=document.createElement('div'); slide.className='gallery-slide';
    const img=document.createElement('img'); img.src=imagen.src; img.alt=imagen.alt;
    slide.appendChild(img); slides.appendChild(slide);
    const thumb=document.createElement('div'); thumb.className='gallery-thumb';
    if(index===indiceInicial) thumb.classList.add('active');
    const thumbImg=document.createElement('img'); thumbImg.src=imagen.src; thumbImg.alt=imagen.alt;
    thumb.appendChild(thumbImg);
    thumb.addEventListener('click',()=>cambiarImagenGaleria(index));
    thumbnails.appendChild(thumb);
  });
  modal.style.display='flex';
  actualizarContadorGaleria();
  slides.style.transform=`translateX(-${indiceImagenActual*100}%)`;
}

function cerrarGaleriaModerno(){ document.getElementById('gallery-modal').style.display='none'; galeriaActual=[]; }
function galeriaAnterior(){ if(indiceImagenActual>0) cambiarImagenGaleria(indiceImagenActual-1); else cambiarImagenGaleria(galeriaActual.length-1); }
function galeriaSiguiente(){ if(indiceImagenActual<galeriaActual.length-1) cambiarImagenGaleria(indiceImagenActual+1); else cambiarImagenGaleria(0); }
function cambiarImagenGaleria(nuevoIndice){
  indiceImagenActual=nuevoIndice;
  const slides=document.getElementById('gallery-slides');
  const thumbnails=document.getElementById('gallery-thumbnails').children;
  slides.style.transform=`translateX(-${indiceImagenActual*100}%)`;
  for(let i=0;i<thumbnails.length;i++){
    if(i===indiceImagenActual) thumbnails[i].classList.add('active');
    else thumbnails[i].classList.remove('active');
  }
  actualizarContadorGaleria();
}
function actualizarContadorGaleria(){
  const counter=document.getElementById('gallery-counter');
  counter.textContent=`${indiceImagenActual+1} / ${galeriaActual.length}`;
}
let galeriaActual=[];
let indiceImagenActual=0;
let inicioX=0;
let movimientoX=0;

function inicializarGaleriaModerno(){
  document.getElementById('gallery-close').addEventListener('click', cerrarGaleriaModerno);
  document.getElementById('gallery-prev').addEventListener('click', galeriaAnterior);
  document.getElementById('gallery-next').addEventListener('click', galeriaSiguiente);
  const slides = document.getElementById('gallery-slides');
  slides.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; movimientoX=0; });
  slides.addEventListener('touchmove', (e) => { movimientoX = e.touches[0].clientX - inicioX; });
  slides.addEventListener('touchend', () => {
    const umbral = 50;
    if(movimientoX>umbral) galeriaAnterior();
    else if(movimientoX<-umbral) galeriaSiguiente();
    inicioX=0; movimientoX=0;
  });
  document.addEventListener('keydown', (e) => {
    if(document.getElementById('gallery-modal').style.display==='flex'){
      if(e.key==='ArrowLeft') galeriaAnterior();
      else if(e.key==='ArrowRight') galeriaSiguiente();
      else if(e.key==='Escape') cerrarGaleriaModerno();
    }
  });
}

function abrirGaleriaModerno(imagenes, indiceInicial){
  galeriaActual=imagenes;
  indiceImagenActual=indiceInicial;
  const modal=document.getElementById('gallery-modal');
  const slides=document.getElementById('gallery-slides');
  const thumbnails=document.getElementById('gallery-thumbnails');
  slides.innerHTML=''; thumbnails.innerHTML='';
  imagenes.forEach((imagen,index)=>{
    const slide=document.createElement('div'); slide.className='gallery-slide';
    const img=document.createElement('img'); img.src=imagen.src; img.alt=imagen.alt;
    slide.appendChild(img); slides.appendChild(slide);
    const thumb=document.createElement('div'); thumb.className='gallery-thumb';
    if(index===indiceInicial) thumb.classList.add('active');
    const thumbImg=document.createElement('img'); thumbImg.src=imagen.src; thumbImg.alt=imagen.alt;
    thumb.appendChild(thumbImg);
    thumb.addEventListener('click',()=>cambiarImagenGaleria(index));
    thumbnails.appendChild(thumb);
  });
  modal.style.display='flex';
  actualizarContadorGaleria();
  slides.style.transform=`translateX(-${indiceImagenActual*100}%)`;
}

function cerrarGaleriaModerno(){ document.getElementById('gallery-modal').style.display='none'; galeriaActual=[]; }
function galeriaAnterior(){ if(indiceImagenActual>0) cambiarImagenGaleria(indiceImagenActual-1); else cambiarImagenGaleria(galeriaActual.length-1); }
function galeriaSiguiente(){ if(indiceImagenActual<galeriaActual.length-1) cambiarImagenGaleria(indiceImagenActual+1); else cambiarImagenGaleria(0); }
function cambiarImagenGaleria(nuevoIndice){
  indiceImagenActual=nuevoIndice;
  const slides=document.getElementById('gallery-slides');
  const thumbnails=document.getElementById('gallery-thumbnails').children;
  slides.style.transform=`translateX(-${indiceImagenActual*100}%)`;
  for(let i=0;i<thumbnails.length;i++){
    if(i===indiceImagenActual) thumbnails[i].classList.add('active');
    else thumbnails[i].classList.remove('active');
  }
  actualizarContadorGaleria();
}
function actualizarContadorGaleria(){
  const counter=document.getElementById('gallery-counter');
  counter.textContent=`${indiceImagenActual+1} / ${galeriaActual.length}`;
}
>>>>>>> 16bea41df7823b6febede32db9f73f258bb39282
