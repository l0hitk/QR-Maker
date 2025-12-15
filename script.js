// Global Variables
let qrHistory = [];
let currentQRData = null;
let currentTemplate = null;
let canvas = null;
let ctx = null;
let zoomLevel = 1;
let canvasScale = 1;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('templateCanvas');
    ctx = canvas.getContext('2d');

    // Enter key to generate
    document.getElementById('qrText').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateQR();
        }
    });
});

// Social Media Template Configurations
const templates = {
    'instagram-post': {
        width: 1080,
        height: 1080,
        name: 'Instagram Post',
        gradient: ['#833ab4', '#fd1d1d', '#fcb045']
    },
    'instagram-story': {
        width: 1080,
        height: 1920,
        name: 'Instagram Story',
        gradient: ['#833ab4', '#fd1d1d', '#fcb045']
    },
    'facebook': {
        width: 1200,
        height: 630,
        name: 'Facebook Post',
        gradient: ['#3b5998', '#5b7bd5']
    },
    'twitter': {
        width: 1200,
        height: 675,
        name: 'Twitter/X Post',
        gradient: ['#1da1f2', '#0d8bd9']
    },
    'linkedin': {
        width: 1200,
        height: 627,
        name: 'LinkedIn Post',
        gradient: ['#0077b5', '#00a0dc']
    },
    'business-card': {
        width: 850,
        height: 550,
        name: 'Business Card',
        gradient: ['#2c3e50', '#34495e']
    }
};

// Set Content Type
function setContent(type) {
    const textarea = document.getElementById('qrText');
    let placeholder = '';

    switch(type) {
        case 'url':
            placeholder = 'https://example.com';
            break;
        case 'email':
            placeholder = 'mailto:your@email.com';
            break;
        case 'phone':
            placeholder = 'tel:+1234567890';
            break;
        case 'text':
            placeholder = 'Your custom text here...';
            break;
    }

    textarea.placeholder = placeholder;
    textarea.focus();
}

// Generate QR Code
function generateQR() {
    const qrText = document.getElementById('qrText').value;
    const qrSize = document.getElementById('qrSize').value;
    const qrColor = document.getElementById('qrColor').value.replace('#', '');

    if (qrText.trim().length === 0) {
        const textarea = document.getElementById('qrText');
        textarea.classList.add('error');
        showToast('Please enter some content!', 'error');
        setTimeout(() => textarea.classList.remove('error'), 500);
        return;
    }

    // Show loading
    showLoading(true);

    // Store current QR data
    currentQRData = {
        text: qrText,
        size: qrSize,
        color: qrColor,
        url: `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}&color=${qrColor}`
    };

    // If template selected, update canvas
    if (currentTemplate) {
        updateCanvas();
    } else {
        // Show simple QR code
        displaySimpleQR();
    }

    // Add to history
    addToHistory(currentQRData.url, qrText);
}

// Display Simple QR Code (no template)
function displaySimpleQR() {
    const template = templates['instagram-post']; // Default square
    canvas.width = template.width;
    canvas.height = template.height;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw QR code
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = function() {
        const qrDisplaySize = Math.min(canvas.width, canvas.height) * 0.7;
        const x = (canvas.width - qrDisplaySize) / 2;
        const y = (canvas.height - qrDisplaySize) / 2;
        ctx.drawImage(qrImg, x, y, qrDisplaySize, qrDisplaySize);

        showLoading(false);
        showActionButtons();
        updateDimensionBadge(canvas.width, canvas.height);
        showToast('QR Code generated successfully!', 'success');
    };
    qrImg.onerror = function() {
        showLoading(false);
        showToast('Failed to generate QR code. Please try again.', 'error');
    };
    qrImg.src = currentQRData.url;
}

// Apply Template
function applyTemplate(templateId) {
    if (!currentQRData) {
        showToast('Please generate a QR code first!', 'error');
        return;
    }

    currentTemplate = templateId;

    // Update active state
    document.querySelectorAll('.template-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Show template controls
    document.getElementById('templateControls').style.display = 'block';

    showLoading(true);
    updateCanvas();
}

// Update Canvas with Template
function updateCanvas() {
    if (!currentQRData || !currentTemplate) return;

    const template = templates[currentTemplate];
    const headline = document.getElementById('headlineText').value || 'Scan Me!';
    const subtext = document.getElementById('subtextInput').value || 'Point your camera here';
    const bgColor = document.getElementById('bgColor').value;

    // Set canvas size
    canvas.width = template.width;
    canvas.height = template.height;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, template.gradient[0]);
    gradient.addColorStop(1, template.gradient[template.gradient.length - 1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Overlay custom color with opacity
    ctx.fillStyle = hexToRgba(bgColor, 0.85);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw QR code
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = function() {
        // QR code size and position based on template
        let qrSize, qrX, qrY;

        if (currentTemplate === 'instagram-story') {
            qrSize = canvas.width * 0.5;
            qrX = (canvas.width - qrSize) / 2;
            qrY = canvas.height * 0.4;
        } else if (currentTemplate === 'business-card') {
            qrSize = Math.min(canvas.height * 0.6, canvas.width * 0.35);
            qrX = canvas.width * 0.6;
            qrY = (canvas.height - qrSize) / 2;
        } else {
            qrSize = Math.min(canvas.width, canvas.height) * 0.5;
            qrX = (canvas.width - qrSize) / 2;
            qrY = (canvas.height - qrSize) / 2;
        }

        // White background for QR with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        ctx.fillStyle = '#ffffff';
        const padding = 30;
        const radius = 15;
        roundRect(ctx, qrX - padding, qrY - padding, qrSize + padding * 2, qrSize + padding * 2, radius);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw QR code
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // Draw text
        drawText(headline, subtext, qrY, qrSize);

        showLoading(false);
        showActionButtons();
        updateDimensionBadge(canvas.width, canvas.height);
        updateCanvasInfo(`${template.name} - Ready to download`);

        if (!document.getElementById('toast').classList.contains('show')) {
            showToast('Template applied successfully!', 'success');
        }
    };
    qrImg.onerror = function() {
        showLoading(false);
        showToast('Failed to load QR code. Please try again.', 'error');
    };
    qrImg.src = currentQRData.url;
}

// Draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// Draw Text on Canvas
function drawText(headline, subtext, qrY, qrSize) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';

    // Add text shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    // Headline
    if (currentTemplate === 'business-card') {
        ctx.font = 'bold ' + (canvas.width * 0.08) + 'px Arial, sans-serif';
        ctx.fillText(headline, canvas.width * 0.25, canvas.height * 0.3);

        ctx.font = (canvas.width * 0.04) + 'px Arial, sans-serif';
        ctx.fillText(subtext, canvas.width * 0.25, canvas.height * 0.4);
    } else {
        const headlineY = qrY - 100;
        ctx.font = 'bold ' + (canvas.width * 0.06) + 'px Arial, sans-serif';
        ctx.fillText(headline, canvas.width / 2, headlineY);

        // Subtext
        const subtextY = qrY + qrSize + 100;
        ctx.font = (canvas.width * 0.035) + 'px Arial, sans-serif';
        ctx.fillText(subtext, canvas.width / 2, subtextY);
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

// Zoom Functions
function zoomIn() {
    if (zoomLevel < 2) {
        zoomLevel += 0.1;
        applyZoom();
        showToast('Zoomed in', 'info');
    }
}

function zoomOut() {
    if (zoomLevel > 0.5) {
        zoomLevel -= 0.1;
        applyZoom();
        showToast('Zoomed out', 'info');
    }
}

function resetZoom() {
    zoomLevel = 1;
    applyZoom();
    showToast('Zoom reset', 'info');
}

function applyZoom() {
    canvas.style.transform = `scale(${zoomLevel})`;
}

function fullscreen() {
    const container = document.getElementById('canvasContainer');
    if (container.requestFullscreen) {
        container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
    } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
    }
    showToast('Fullscreen mode', 'info');
}

// Set Color Preset
function setColor(color) {
    document.getElementById('bgColor').value = color;
    updateCanvas();
}

// Download QR Code
async function downloadQR() {
    if (!canvas || canvas.width === 0) {
        showToast('Please generate a QR code first!', 'error');
        return;
    }

    const format = document.getElementById('downloadFormat').value;
    const templateName = currentTemplate ? templates[currentTemplate].name : 'QR-Code';
    const filename = `${templateName.replace(/\s+/g, '-')}-${Date.now()}`;

    try {
        if (format === 'svg') {
            const svgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${currentQRData.size}x${currentQRData.size}&data=${encodeURIComponent(currentQRData.text)}&color=${currentQRData.color}&format=svg`;
            const response = await fetch(svgUrl);
            const svgText = await response.text();
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            downloadBlob(blob, `${filename}.svg`);
            showToast(`Downloaded as SVG!`, 'success');
        } else {
            const mimeType = getMimeType(format);
            const quality = (format === 'jpeg') ? 0.95 : undefined;

            canvas.toBlob(function(blob) {
                downloadBlob(blob, `${filename}.${format}`);
                showToast(`Downloaded as ${format.toUpperCase()}!`, 'success');
            }, mimeType, quality);
        }
    } catch (error) {
        console.error('Download error:', error);
        showToast('Error downloading. Please try again.', 'error');
    }
}

// Copy to Clipboard
async function copyToClipboard() {
    if (!canvas || canvas.width === 0) {
        showToast('Please generate a QR code first!', 'error');
        return;
    }

    try {
        canvas.toBlob(async function(blob) {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('Copied to clipboard!', 'success');
        });
    } catch (error) {
        showToast('Copy failed. Try download instead.', 'error');
    }
}

// Share QR Code
async function shareQR() {
    if (!canvas || canvas.width === 0) {
        showToast('Please generate a QR code first!', 'error');
        return;
    }

    try {
        canvas.toBlob(async function(blob) {
            const file = new File([blob], 'qr-code.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'QR Code',
                    text: 'Check out this QR code!'
                });
                showToast('Shared successfully!', 'success');
            } else {
                showToast('Sharing not supported. Use copy or download.', 'info');
            }
        });
    } catch (error) {
        showToast('Sharing cancelled.', 'info');
    }
}

// Clear All
function clearAll() {
    document.getElementById('qrText').value = '';
    document.getElementById('headlineText').value = '';
    document.getElementById('subtextInput').value = '';
    currentQRData = null;
    currentTemplate = null;
    zoomLevel = 1;

    if (canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.style.transform = 'scale(1)';
    }

    document.getElementById('templateControls').style.display = 'none';
    document.getElementById('actionButtons').style.display = 'none';
    document.getElementById('placeholderText').style.display = 'flex';
    document.getElementById('dimensionBadge').style.display = 'none';
    document.getElementById('canvasContainer').classList.remove('has-content');

    document.querySelectorAll('.template-item').forEach(item => {
        item.classList.remove('active');
    });

    showToast('Cleared successfully!', 'success');
}

// Helper Functions
function getMimeType(format) {
    const mimeTypes = {
        'png': 'image/png',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
    };
    return mimeTypes[format] || 'image/png';
}

function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function showActionButtons() {
    document.getElementById('actionButtons').style.display = 'block';
    document.getElementById('placeholderText').style.display = 'none';
    document.getElementById('canvasContainer').classList.add('has-content');
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.add('active');
    } else {
        spinner.classList.remove('active');
    }
}

function updateDimensionBadge(width, height) {
    const badge = document.getElementById('dimensionBadge');
    const text = document.getElementById('dimensionText');
    text.textContent = `${width} × ${height}px`;
    badge.style.display = 'inline-flex';
}

function updateCanvasInfo(text) {
    document.getElementById('canvasInfoText').textContent = text;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');

    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle"></i>';
    else if (type === 'error') icon = '<i class="fas fa-exclamation-circle"></i>';
    else icon = '<i class="fas fa-info-circle"></i>';

    toast.innerHTML = icon + ' ' + message;
    toast.className = 'toast show';

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// History Functions
function addToHistory(url, text) {
    if (qrHistory.length >= 6) {
        qrHistory.shift();
    }

    qrHistory.push({ url, text, timestamp: Date.now() });
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');

    if (qrHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-history">No history yet. Generate your first QR code!</p>';
        return;
    }

    historyList.innerHTML = '';
    qrHistory.slice().reverse().forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `<img src="${item.url}" alt="QR Code" title="${item.text}">`;
        historyItem.onclick = () => loadFromHistory(qrHistory.length - 1 - index);
        historyList.appendChild(historyItem);
    });
}

function loadFromHistory(index) {
    const item = qrHistory[index];
    document.getElementById('qrText').value = item.text;

    const urlParams = new URL(item.url).searchParams;
    const size = urlParams.get('size') || '300';
    const color = urlParams.get('color') || '000000';

    currentQRData = {
        text: item.text,
        size: size.split('x')[0],
        color: color,
        url: item.url
    };

    document.getElementById('qrSize').value = currentQRData.size;
    document.getElementById('qrColor').value = '#' + currentQRData.color;

    if (currentTemplate) {
        updateCanvas();
    } else {
        displaySimpleQR();
    }

    showToast('Loaded from history!', 'success');
}