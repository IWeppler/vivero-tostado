import imageCompression from "browser-image-compression";

export async function optimizarImagen(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.8, // Buscamos que ninguna foto pese más de 800kb
    maxWidthOrHeight: 1080, // Tamaño ideal para e-commerce (pantallas HD)
    useWebWorker: true, // Usa hilos secundarios para no congelar la pantalla
    fileType: "image/webp" as const, // Forzamos formato ultra liviano
    initialQuality: 0.8, // Calidad del 80% (casi indistinguible del original)
  };

  try {
    const compressedBlob = await imageCompression(file, options);

    // Le cambiamos la extensión al nombre original para que termine en .webp
    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";

    // Convertimos el Blob comprimido de vuelta a un objeto File estándar
    return new File([compressedBlob], newFileName, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Error comprimiendo la imagen:", error);
    return file; // Si por algún motivo ultra raro falla, devolvemos la original
  }
}
