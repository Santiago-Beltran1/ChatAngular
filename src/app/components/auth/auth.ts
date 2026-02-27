import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {

  autenticando = false;
  mensajeError="";
  auth = false;

  //inyección de dependencias servicios y rutas de navegación
  private AuthService = inject(AuthService)
  private router = inject(Router)

  //Función que revisa la autenticación - asíncrona
  async IniciarSesionConGoogle(): Promise<void> {
    this.autenticando = true
    this.mensajeError = ""

    try {
      //Implementación del servicio
      console.log('Llamo a la función')
      const usuario = await this.AuthService.iniciarSesion()
      //Falta implementar el servicio

      //Vamos a simular un usuario ya creado
      /*let usuario = null
      usuario = await new Promise ((resolve) =>{
        setTimeout(()=>resolve({nombre: 'usuario de prueba'}), 1000)
      })*/

      if(usuario) {
        await this.router.navigate(['/chat'])
      } else {
        this.mensajeError = "Error al autenticar"
        console.log("Error al autenticar en try")
      }
    } catch (error: any) {
      //validación de algunos posibles errores 
      if(error.code === "auth/popup-closed-by-user"){
        console.error('Error: Cerraste la ventana de emergencia')
      } if(error.code === "auth/popup-blocked"){
        console.error("El navegador bloqueo la ventana de emergencia")
      }
      else if(error.code == 'auth/network-request-failed'){
        console.error("Problemas con la conexión a internet")
      }
    }finally{
      this.autenticando = false
    }
  }

  // verificar que si el usuario ya esta autenticado se redirecciona al chat de una vez*/
  ngOnInit(): void{
    this.AuthService.estaAutenticado$.subscribe( autenticado =>{
      if(autenticado){
        this.router.navigate(['/chat'])
      }
    });
  }
}
