import { inject, Injectable } from '@angular/core';
import { MensajeChat } from '../../models/chat';
import { AuthService } from './auth';
import { FirebaseService } from './firebase';
import { BehaviorSubject } from 'rxjs';

// Vamos a generar un mock del servicio gemini
const GeminiServiceMock = {
  convertirHistorialGemini: (Historial: MensajeChat[])=> Historial,
  EnviarMensaje: async(contenido: string, Historial: any)=> 'Respuesta desde el servicio de gemini de tipo Mock, esta respuesta siempre va a ser la misma'
}

@Injectable({
  providedIn: 'root'
})

export class ChatService {
  private authService = inject(AuthService)

  private FirebaseService = inject(FirebaseService)

  private mensajeSubject = new BehaviorSubject<MensajeChat[]>([]);

  public mensaje$ = this.mensajeSubject.asObservable();

  private CargandoHistorial = false;

  private AsistenteRespondiendo = new BehaviorSubject<boolean>(false);

  private AsistenteRespondiendo$ = this.AsistenteRespondiendo.asObservable();

  async InicializarChat(usuarioId: string): Promise<void>{
    if(!this.CargandoHistorial){
      return;
    }

    this.CargandoHistorial = true;
    try {
      this.FirebaseService.obtenerMensajesUsuario(usuarioId).subscribe({
        next: (mensajes)=>{
          // Actualizando BehaviorSubject
          this.mensajeSubject.next(mensajes)
          this.CargandoHistorial = false;
        },
        error: (error) =>{
          console.error("error al cargar el historial", error)
          this.CargandoHistorial = false
          // Cargar el BehaviorSubject
        }
      });
    }catch(error){
      console.error("Error al cargar el historial:", error);
      this.CargandoHistorial = false;
      this.mensajeSubject.next([]);
      throw error;
    }
  }

  async enviarMensaje( contenidoMensaje: string): Promise<void>{
    const usuarioActual = this.authService.obtenerUsuario()

    if(!usuarioActual){
      console.error('No hay un usuario autenticado');
      throw Error;
    }

    if(!contenidoMensaje.trim()){
      return;
    }

    const mensajeUsuario: MensajeChat={
      usuarioId: usuarioActual.uid,
      contenido: contenidoMensaje.trim(),
      fechaEnvio: new Date(),
      estado: 'Enviado',
      tipo: 'Usuario',
    }
    try{
      const mensajeDelUsuario = this.mensajeSubject.value;
      const nuevoMensajeEncontrado = [...mensajeDelUsuario, mensajeUsuario];
      this.mensajeSubject.next(nuevoMensajeEncontrado)
      
      try{
        await this.FirebaseService.guardarMensaje(mensajeUsuario);
      }catch(firestoreError){
        console.error('No se pudo guardar el mensaje del usuario', firestoreError)

      }

      this.AsistenteRespondiendo.next(true)

      const mensajesActuales = this.mensajeSubject.value;

      const historialParaGemini = GeminiServiceMock.convertirHistorialGemini(
        mensajesActuales.slice(-6)
      );

      const respuestaDelAsistente = await GeminiServiceMock.EnviarMensaje(
        contenidoMensaje,
        historialParaGemini
      )

      // Configurar los mensajes del asistente

      const mensajeAsistente:MensajeChat={
        usuarioId: usuarioActual.uid,
        contenido: respuestaDelAsistente,
        fechaEnvio: new Date(),
        estado: 'Enviado',
        tipo: 'Asistente',
      };
      
      const mensajesActualizados = this.mensajeSubject.value

      const nuevoMensajeEncontradoAsis = [...mensajesActualizados, mensajeAsistente];
      this.mensajeSubject.next(nuevoMensajeEncontradoAsis);

      try{
        await this.FirebaseService.guardarMensaje(mensajeAsistente)
      }catch(firestoreError){
        console.error('Error al guardar el mensaje del asistente')
      }

    } catch (error){
      console.error('Error al procesar el mensaje', error)

      // Generar una instancia del objeto en caso de que haya un error
      const mensajeError:MensajeChat={
        usuarioId: usuarioActual.uid,
        contenido: 'Lo sentimos, no se pudo procesar el mensaje',
        fechaEnvio: new Date(),
        estado: 'Error',
        tipo: 'Asistente',
      };

      try{
        await this.FirebaseService.guardarMensaje(mensajeError);
      } catch(saveError) {
        console.error('Error al guardar el mensaje de error', saveError);
        const mensajesActual = this.mensajeSubject.value;
        this.mensajeSubject.next([...mensajesActual, mensajeError]);
      }
      throw error;
    } finally{
      this.AsistenteRespondiendo.next(false)
    }
  }
  limpiarChat(): void{
    this.mensajeSubject.next([])
  }

  obtenerMensajes(): MensajeChat[]{
    return this.mensajeSubject.value
  }
} // Él de mi derecha es RE GAY ->>>>>>>>>>>>>>>>>>>
