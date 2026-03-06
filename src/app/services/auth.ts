import { Injectable, inject } from '@angular/core';
import { Usuario } from '../../models/usuario';
import { map } from 'rxjs';
import { GoogleAuthProvider } from 'firebase/auth';
import { signInWithPopup, signOut, } from 'firebase/auth';
import {Auth, User , user} from '@angular/fire/auth'

@Injectable({
  providedIn: "root"
})
export class AuthService {
  private auth = inject(Auth)

  //variable de tipo observable
  usuario$ = user(this.auth)

  //variable observarbe que devuelve true o false si el usuario esta autenticado
  estaAutenticado$ = this.usuario$.pipe(
    map(usuario => !!usuario)
  )

  //función asíncrona que permite el inicio de sesión
  async iniciarSesion(): Promise<Usuario | null>{
    try{
      console.log('Inicio el servicio función iniciar sesión')
      const provedoor = new GoogleAuthProvider

      //Controladores
      provedoor.addScope('email')
      provedoor.addScope('profile')

      console.log('antes')
      const resultado = await signInWithPopup(this.auth, provedoor);
      console.log('después')
      const usuarioFirebase = resultado.user;

      if(usuarioFirebase){
        const usuario : Usuario ={
          uid: usuarioFirebase.uid,
          nombre: usuarioFirebase.displayName || "Usuario sin nombre",
          email: usuarioFirebase.email || '',
          fotoUrl: usuarioFirebase.photoURL || undefined,
          fechaCreacion: new Date,
          ultimaConexion: new Date,
        }
        return usuario;
      }
      return null;
    }catch(error){
      console.error('❌❌Error en la autenticación')
      throw error
    }
  }

  obtenerUsuario(): User | null{
    return this.auth.currentUser
  }

  // CerrarSesion
  async cerrarSesion():Promise<void>{
    try{
      await signOut(this.auth)
    } catch (error) {
      console.error('Error cerrando sesión', error)
      throw  error;
    }
  }


}
