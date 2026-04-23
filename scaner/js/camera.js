// Переменные состояния камеры
let stream = null;
let scanning = false;
let canvas = null;
let context = null;

// Функции управления
function toggleCamera() {
    if (scanning) { stopCamera(); } 
    else { startScanner(); }
}

function stopCamera() {
    scanning = false;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    video.srcObject = null;
    const sBtn = document.getElementById('start-camera');
    sBtn.innerText = "Найти QR";
    sBtn.disabled = false;
}

async function startScanner() {
    if (scanning) return;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        scanning = true;
        const sBtn = document.getElementById('start-camera');
        sBtn.innerText = "ВЫКЛ КАМЕРУ";
        sBtn.disabled = false;
        requestAnimationFrame(tick);
    } catch (e) { alert("Ошибка камеры"); }
}

function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA && scanning) {
        if (!canvas) { canvas = document.createElement('canvas'); context = canvas.getContext('2d'); }
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const code = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
        
        if (code) { 
            currentQR = code.data; 
            stopCamera(); 
            openModal(); 
            return; 
        }
    }
    if (scanning) requestAnimationFrame(tick);
}
