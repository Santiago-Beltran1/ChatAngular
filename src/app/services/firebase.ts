import { Injectable, Query, inject } from '@angular/core';
import { Firestore, 
  Timestamp, 
  collection, 
  query, 
  where,
  onSnapshot, 
  DocumentData, 
  QuerySnapshot} from '@angular/fire/firestore';
import { ConversacionChat, MensajeChat } from '../../models/chat';
import { addDoc } from 'firebase/firestore';
import { Observable, timestamp } from 'rxjs';

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

  //Filtrar que los mensajes que se muestran sean los mensajes del usuario autenticado
  obtenerMensajesUsuario(usuarioId: string): Observable<MensajeChat[]>{
    return new Observable ( observer =>{
      const consulta = query(
        collection(this.firestore, 'mensajes'),
        where('usuarioId', "==", usuarioId)
      )
      // Configurar el listener para que funcione en tiempo real snapshot
      const unSuscribe = onSnapshot(
        consulta, 
        (snapshot: QuerySnapshot<DocumentData>)=>{
          const mensajes : MensajeChat[] = snapshot.docs.map( doc =>{
            const data = doc.data();
            return{
              id: doc.id,
              usuarioId: data['usuarioId'],
              contenido: data['contenido'],
              estado: data['estado'],
              tipo: data['tipo'],
              // Recordemos que firebase guarda TIMESTAMP y angular trabaja con DATE
              fechaEnvio: data['fechaEnvio'].toDate()
            } as MensajeChat;
          });

          
          // ordenar los mensajes desde el más reciente al más antiguo
          mensajes.sort((a,b)=>a.fechaEnvio.getTime() - b.fechaEnvio.getTime())
          observer.next(mensajes);
        },
        error => {
          console.error('error al escuchar los mensajes')
          observer.error(error);
        }
      );
      // Se retorna una suscripción al usuario
      return ()=>{
        unSuscribe
      }
    });
    // Gestionar el obtener id de usuario por medio de un mensaje
  }

  async guardarConversacion(conversacion: ConversacionChat): Promise<void>{
    try{
      const coleccionConversaciones = collection(this.firestore, 'conversaciones');
      // Las conversaciones para enviarlas a firestore 
      const conversacionGuardar = {
        ...conversacion,
        fechaCreacion : Timestamp.fromDate(conversacion.fechaCreacion),
        ultimaActividad : Timestamp.fromDate(conversacion.ultimaActividad),
        // Conversación de la fechaEnvio del MensajeChat
        mensajes : conversacion.mensajes.map(mensaje => ({
          ...mensaje, 
          fechaEnvio: Timestamp.fromDate(mensaje.fechaEnvio)
        }))
      };
      await addDoc(coleccionConversaciones, conversacionGuardar);
    }catch(error){
      console.error('Error al guardar la conversación', error)
      throw error;
    }
  }

}

