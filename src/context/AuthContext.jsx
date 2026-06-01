import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../FireBase/config";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Registrar nuevo usuario
  async function registrar(nombre, correo, password) {
    const credencial = await createUserWithEmailAndPassword(auth, correo, password);
    await updateProfile(credencial.user, { displayName: nombre });
    // Guardar en Firestore con rol "usuario"
    await setDoc(doc(db, "usuarios", credencial.user.uid), {
      uid: credencial.user.uid,
      nombre,
      correo,
      rol: "usuario",
      fechaCreacion: new Date().toISOString(),
    });
    return credencial.user;
  }

  // Iniciar sesión
  async function iniciarSesion(correo, password) {
    return signInWithEmailAndPassword(auth, correo, password);
  }

  // Cerrar sesión
  async function cerrarSesion() {
    return signOut(auth);
  }

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user);
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (snap.exists()) {
          setRol(snap.data().rol);
        }
      } else {
        setUsuario(null);
        setRol(null);
      }
      setCargando(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, rol, cargando, registrar, iniciarSesion, cerrarSesion }}>
      {!cargando && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
