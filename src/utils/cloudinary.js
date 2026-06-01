// Cloudinary config - subir imagenes sin necesidad de Firebase Storage
const CLOUD_NAME = "drsmav0kl";
const UPLOAD_PRESET = "ua_incidentes";

export async function subirImagen(archivo) {
  const formData = new FormData();
  formData.append("file", archivo);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Error al subir imagen");
  const data = await res.json();
  return data.secure_url; // URL publica de la imagen
}