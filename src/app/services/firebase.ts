import { Injectable, inject } from '@angular/core';
import { Firestore, Timestamp, collection } from '@angular/fire/firestore';
import { MensajeChat } from '../../models/chat';
import { addDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: "root"
})
export class FirebaseService {
  private firestore = inject(Firestore)
  
  // Función para guardar el mensaje
  async guardarMensaje(mensaje: MensajeChat): Promise<void>{
    try{
      // Revisar si viene sin userId
      if(!mensaje.usuarioId){
        //Devuelvo que el mensaje debe tener un usuairo Id
        throw new Error('Usuario Id es requerido');
      } else if(!mensaje.contenido){
        throw new Error('El contenido es requerido');
      } else if(!mensaje.tipo){
        throw new Error('El tipo es requerido');
      } 

      const coleccionMensajes = collection(this.firestore, 'Mensajes')
      // Preparar el mensaje respecto a las fechas
      const mensajeGuardar={
        usuarioId : mensaje.usuarioId,
        contenido : mensaje.contenido,
        tipo : mensaje.tipo,
        estado : mensaje.estado,
        // Fecha es de tipo timestamp y necesito pasarla a date
        fechaEnvio : Timestamp.fromDate(mensaje.fechaEnvio)
      };

      // Añadir el mensaje a la colección, generar un documento de la colección
      const docRef = await addDoc(coleccionMensajes, mensajeGuardar)
    }catch(error: any){
      console.error('❌❌ Error al guardar el mensaje en Firestore')
      console.error('❌❌ Error details',{
        mensaje : error.message,
        code : error.code,
        stack : error.stack
      })
    }
  }

  obtenerMensajesUsuario(userId: int): Observable${
    //Filtrar que los mensajes que se muestran sean los mensajes del usuario autenticado
  }
}

