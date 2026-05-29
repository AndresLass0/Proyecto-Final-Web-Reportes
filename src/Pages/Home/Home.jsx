import React, { useState } from 'react';

const Home = () => {

    const [Correo, setCorreo] = useState(null);
    const [Password, setPassword] = useState(null);

    async function peticion() {

        let isAdmin = false;
        let isUser = false;

        if (!Correo || !Password) {
            alert("Todos los campos son obligatorios");
            return;
        }

        const q = query(collection(db, "Usuarios"), where("Correo", "==", Correo));
        const querySnapshot = await getDocs(q);


        if (!querySnapshot.empty) {

            const user = querySnapshot.docs[0];


            if (user.data().Password === Password) {
                isUser = true;
            }
        }

        const r = query(collection(db, "Administradores"), where("Correo", "==", Correo));
        const rSnapshot = await getDocs(r);

        if (!rSnapshot.empty) {

            const admin = rSnapshot.docs[0];

            if (admin.data().Password === Password) {
                isAdmin = true;
            }
        }


        if (!isAdmin && !isUser) {
            alert("Correo o contraseña incorrectos");
        }

        if (isAdmin) {
            alert("Bienvenido admin");
        }

        if (isUser) {
            alert("Bienvenido usuario");
        }

    }

    return (
        <>
            <input type="text" placeholder='Correo' onChange={(e) => setCorreo(e.target.value)} />
            <input type="text" placeholder='Password' onChange={(e) => setPassword(e.target.value)} />
            <button onClick={peticion}>Confirmar</button>
        </>

    )
}

export default Home