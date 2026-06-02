import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../FireBase/config";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const [cargando, setCargando] = useState(true);

  async function registrar(nombre, correo, password) {
    const credencial = await createUserWithEmailAndPassword(auth, correo, password);
    await updateProfile(credencial.user, { displayName: nombre });
    await setDoc(doc(db, "usuarios", credencial.user.uid), {
      uid: credencial.user.uid,
      nombre,
      correo,
      rol: "usuario",
      fechaCreacion: new Date().toISOString(),
    });
    await signOut(auth);
    return credencial.user;
  }

  async function iniciarSesion(correo, password) {
    return signInWithEmailAndPassword(auth, correo, password);
  }

  async function iniciarSesionGoogle() {
    const provider = new GoogleAuthProvider();
    const credencial = await signInWithPopup(auth, provider);
    const user = credencial.user;
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nombre: user.displayName || "Usuario Google",
        correo: user.email,
        rol: "usuario",
        fechaCreacion: new Date().toISOString(),
      });
    }
    return user;
  }

  async function cerrarSesion() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user);
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (snap.exists()) setRol(snap.data().rol);
      } else {
        setUsuario(null);
        setRol(null);
      }
      setCargando(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, rol, cargando, registrar, iniciarSesion, iniciarSesionGoogle, cerrarSesion }}>
      {!cargando && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
