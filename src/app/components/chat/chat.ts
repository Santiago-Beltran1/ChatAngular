import { Component, ViewChild, ElementRef, contentChild, inject } from '@angular/core';
import { MensajeChat } from '../../../models/chat';
import { FormsModule } from '@angular/forms';  
import { AuthService } from '../../services/auth';
import { ChatService } from '../../services/chat';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  private authService = inject(AuthService)
  private chatService = inject(ChatService)
  private router = inject(Router)

  // Referenciar los contenedores
  @ViewChild('messagesContainer') messagesContainer! : ElementRef

  usuario: User | null = null;

  manejoErrorImagen(){
    console.log('Error al cargar la imagen del usuario');
  }
  mensajes: MensajeChat[] = []
  cargandoHistorial = false
  asistenteEscribiendo = false
  asistenteEnviando = false
  mensajeTexto=""
  enviandoMensaje= false
  mensajeError = "";
  private suscripciones : Subscription[] = []

  private async verificarAutenticacion(): Promise<void>{
    // A la variable usuario le voy a asignar el servicio de auth y la función de obtener usuario
    this.usuario = this.authService.obtenerUsuario()
    if(!this.usuario){
      await this.router.navigate(['/auth'])
      throw new Error('usuario no autenticado')
    }
  }

  private async inicializarChat(): Promise<void>{
    if(!this.usuario){
      return;
    }

    this.cargandoHistorial = true;
    try{
      await this.chatService.InicializarChat(this.usuario.uid)
    }catch(error){
      console.error('No se ha podido inicializar el historial del chat')
    }
  }

  private debeHacerScroll = true;
  cerrarSesion(){}


  
  private scrollHaciaAbajo():void{
    try{
      const container = this.messagesContainer?.nativeElement
      if(container){
        container.scrollTop = container.scrollHeight
      }
    }catch(error){
      console.error('❌Error al hacer scroll')
    }
  }

  ngAfterViewChecked():void{
    if(this.debeHacerScroll){
      this.scrollHaciaAbajo();
      this.debeHacerScroll=false
    }
  }

  trackByMensaje(index: number, mensaje: MensajeChat){}

  formatearMensajeAsistente(contenido: string){
    return contenido
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
  }


  formatearHora(fecha: Date): String{
    return fecha.toLocaleDateString('es-ES',{
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  enviarMensaje(){}

  ngOnInit(){

  }
}
  