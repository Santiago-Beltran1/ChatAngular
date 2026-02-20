import { Component } from '@angular/core';
import { MensajeChat } from '../../../models/chat';
import { FormsModule } from '@angular/forms';  

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  nombre:string="Santiago Beltran"
  email:string="santiago@gmail.com"
  manejoErrorImagen(){
    console.log('Error al cargar la imagen del usuario');
  }
  mensajes: MensajeChat[] = []
  cargandoHistorial = false
  asistenteEscribiendo = true
  asistenteEnviando = false
  mensajeTexto=""
  enviandoMensaje=""
  cerrarSesion(){}

  trackByMensaje(index: number, mensaje: MensajeChat){}

  formatearMensajeAsistente(mensaje:string){}

  enviarMensaje(){}

  ngOnInit(){
    this.mensajes = this.generarMensajeDemo();
  }

  private generarMensajeDemo():MensajeChat[]{
  const ahora =new Date();

  return [
    {
      id:'id1',
      contenido:'Hola eres el asistente?',
      tipo: 'Usuario',
      fechaEnvio: new Date(ahora.getTime()),
      estado: 'Enviado',
      usuarioId: 'u1'
    },{
      id:'id2',
      contenido:'Hola soy tu asistente',
      tipo: 'Asistente',
      fechaEnvio: new Date(ahora.getTime()),
      estado: 'Enviado',
      usuarioId: 'a1'
    },
    {
      id:'id1',
      contenido:'Me puedes ayudar con mi problema?',
      tipo: 'Usuario',
      fechaEnvio: new Date(ahora.getTime()),
      estado: 'Enviado',
      usuarioId: 'u1'
    },{
      id:'id2',
      contenido:'Claro dime lo qué te sucede',
      tipo: 'Asistente',
      fechaEnvio: new Date(ahora.getTime()),
      estado: 'Enviado',
      usuarioId: 'a1'
    },{
      id:'id1',
      contenido:'Mandame emojis de pizza',
      tipo: 'Usuario',
      fechaEnvio: new Date(ahora.getTime()),
      estado: 'Enviado',
      usuarioId: 'u1'
    },{
      id:'id2',
      contenido:'🍕🍕🍕🍕',
      tipo: 'Asistente',
      fechaEnvio: new Date(ahora.getTime()),
      estado: 'Enviado',
      usuarioId: 'a1'
    }
  ]
  }
}


