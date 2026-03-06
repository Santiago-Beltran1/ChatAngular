import { Component, ViewChild, ElementRef, contentChild, inject, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
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
export class Chat implements OnInit, OnDestroy, AfterViewChecked {
  private authService = inject(AuthService)
  private chatService = inject(ChatService)
  private router = inject(Router)

  // Referenciar los contenedores
  @ViewChild('messagesContainer') messagesContainer! : ElementRef
  @ViewChild('mensajeInput') mensajeInput! : ElementRef

  usuario: User | null = null;
  mensajes: MensajeChat[] = []
  cargandoHistorial = false
  asistenteEscribiendo = false
  asistenteEnviando = false
  mensajeTexto=""
  enviandoMensaje= false
  mensajeError = "";
  private suscripciones : Subscription[] = []
  private debeHacerScroll : boolean = false;
  

  private async verificarAutenticacion(): Promise<void>{
    console.log('Ingreso a verificación autenticación')
    // A la variable usuario le voy a asignar el servicio de auth y la función de obtener usuario
    this.usuario = this.authService.obtenerUsuario()

    if(!this.usuario){
      await this.router.navigate(['/auth'])
      throw new Error('usuario no autenticado')
    }
  }

  private async inicializarChat(): Promise<void>{
    console.log('Ingreso a Inicializar Chat')
    if(!this.usuario){
      return;
    }

    this.cargandoHistorial = true;
    try{
      console.log('Antes del await')
      await this.chatService.InicializarChat(this.usuario.uid)
    }catch(error){
      console.error('No se ha podido inicializar el historial del chat')
      throw Error;
    } finally {
      this.cargandoHistorial = false
    }
  }

  private configurarSuscripciones(): void{
    const subMensajes = this.chatService.mensaje$.subscribe( mensajes=>{
      this.mensajes = mensajes,
      this.debeHacerScroll = true;
    });

    const subMensajesAsis = this.chatService.AsistenteRespondiendo$.subscribe( respondiendo =>{
      this.asistenteEscribiendo = respondiendo;
      if(respondiendo){
        this.debeHacerScroll = true
      }
    });

      this.suscripciones.push(subMensajes, subMensajesAsis)
  }

  async enviarMensaje(): Promise<void>{
    if(!this.mensajeTexto.trim()){
      return;
    }

    this.mensajeError = "";
    this.enviandoMensaje = true;

    // Es guardando el mensaje en la variable texto
    const texto = this.mensajeTexto.trim();
    // Limpia el input
    this.mensajeTexto = "";

    try{
      await this.chatService.enviarMensaje(texto)
      this.enfocarInput();
    } catch (error: any){
      console.error('Error al enviar el mensaje')

      this.mensajeError = error.message || 'Error al enviar el mensaje'
      this.mensajeTexto = texto;
    } finally {
      this.enviandoMensaje = false;
    }
  }


  manejarTeclaPresionada(evento: KeyboardEvent){
    if(evento.key === "Enter" && !evento.shiftKey){
      evento.preventDefault();
      this.enviarMensaje();
    }
  }

  async cerrarSesion(): Promise<void>{
    try{
      this.chatService.limpiarChat();

      await this.authService.cerrarSesion();
      await this.router.navigate(['/auth']);
    }catch (error) {
      console.error('Error al cerrar sesión desde el componente')
      this.mensajeError = 'Error al cerrar la sesión'
      throw Error;
    }
  }

  
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

  AfterViewChecked():void{
    if(this.debeHacerScroll){
      this.scrollHaciaAbajo();
      this.debeHacerScroll=false
    }
  }

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



  async ngOnInit(): Promise<void>{
    try {
      console.log('Ingreso al try de OnInit')
      await this.verificarAutenticacion();
      await this.inicializarChat();
      this.configurarSuscripciones();
    } catch (error){
      console.error('Error al inicializar el chat OnInit')
      this.mensajeError = 'Error al cargar el chat intenta recargar la página'
      throw error;
    }
  }

  ngOnDestroy():void{
    this.suscripciones.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewChecked(): void{
    if(this.debeHacerScroll){
      this.scrollHaciaAbajo();
      this.debeHacerScroll = false
    }
  }

  manejoErrorImagen(evento: any): void{
    evento.target.src = 'https://img.freepik.com/vector-gratis/graphic-design-vector-illustration_24908-54512.jpg?semt=ais_hybrid&w=740&q=80'
  }

  trackByMensaje(index: number, mensaje: MensajeChat): string | number {
    return mensaje.id || `${mensaje.tipo}-${mensaje.fechaEnvio.getTime()}`;
  }


  private enfocarInput():void{
    setTimeout(() => {
      this.mensajeInput.nativeElement.focus();
    }, 100);

  }
}
  