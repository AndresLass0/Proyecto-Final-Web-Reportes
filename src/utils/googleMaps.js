let googleMapsLoaded = false;
let googleMapsLoadingPromise = null;

export function loadGoogleMaps(apiKey) {
  if (googleMapsLoaded && window.google) return Promise.resolve(window.google);
  if (googleMapsLoadingPromise) return googleMapsLoadingPromise;

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    // Si ya existe en window, resolver de inmediato
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      resolve(window.google);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsLoaded = true;
      resolve(window.google);
    };
    script.onerror = (err) => {
      googleMapsLoadingPromise = null; // reintentar si falla
      reject(err);
    };
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
}
