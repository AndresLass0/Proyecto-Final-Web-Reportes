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
    
    // Garantizar que el documento exista antes de retornar
    let snap = await getDoc(doc(db, "usuarios", user.uid));
    let userRol = "usuario";
    if (!snap.exists()) {
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nombre: user.displayName || "Usuario Google",
        correo: user.email || "",
        rol: "usuario",
        fechaCreacion: new Date().toISOString(),
      });
    } else {
      userRol = snap.data().rol;
    }
    
    setUsuario(user);
    setRol(userRol);
    return { user, rol: userRol };
  }

  async function cerrarSesion() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user);
        let snap = await getDoc(doc(db, "usuarios", user.uid));
        if (!snap.exists()) {
          const esGoogle = user.providerData.some(p => p.providerId === "google.com");
          if (esGoogle) {
            await setDoc(doc(db, "usuarios", user.uid), {
              uid: user.uid,
              nombre: user.displayName || "Usuario Google",
              correo: user.email || "",
              rol: "usuario",
              fechaCreacion: new Date().toISOString(),
            });
            setRol("usuario");
          } else {
            setRol("usuario"); // Fallback temporal para otros
          }
        } else {
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
    <AuthContext.Provider value={{ usuario, rol, cargando, registrar, iniciarSesion, iniciarSesionGoogle, cerrarSesion }}>
      {!cargando && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
