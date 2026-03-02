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

  private AsistenteRespondiendo = new BehaviorSubject<Boolean>(false);

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
          console.log("error al cargar el historial", error)
          this.CargandoHistorial = false
          // Cargar el BehaviorSubject
        }
      });
    }catch(error){
      console.log("Error inesperado:", error);
      this.CargandoHistorial = false;
    }

  }
}
