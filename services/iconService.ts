
export const generateExtensionIcons = () => {
  const sizes = [16, 48, 128];
  
  sizes.forEach(size => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Fondo azul redondeado
    const radius = size * 0.2;
    ctx.fillStyle = '#2563eb'; // Blue 600
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    // Dibujar Rayo (Zap) en blanco
    ctx.fillStyle = 'white';
    ctx.beginPath();
    // Coordenadas proporcionales para el rayo
    const padding = size * 0.25;
    const w = size - (padding * 2);
    const h = size - (padding * 2);
    
    // Simplificación del icono de rayo
    ctx.moveTo(padding + w * 0.6, padding);
    ctx.lineTo(padding + w * 0.1, padding + h * 0.55);
    ctx.lineTo(padding + w * 0.45, padding + h * 0.55);
    ctx.lineTo(padding + w * 0.35, padding + h * 1);
    ctx.lineTo(padding + w * 0.9, padding + h * 0.45);
    ctx.lineTo(padding + w * 0.55, padding + h * 0.45);
    ctx.closePath();
    ctx.fill();

    // Descargar el archivo
    const link = document.createElement('a');
    link.download = `icon${size}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
};
