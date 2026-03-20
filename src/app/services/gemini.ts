import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface PeticionGemini{
 contents: contentGemini[]; // Vamos a cambiar por otra interfaz 
 generationConfig?: {
  maxOutputTokens?: Number;
  temperature?: Number;
 } 
 safetySettings?: safetySettings[]; // Vamos a cambiar por otra interfaz
}

interface contentGemini{
  role: 'User' | 'model';
  parts: partGemini[]; // Vamos a cambiar por otra interfaz
}

interface partGemini{
  text: string;
}

interface safetySettings{
  category: string;
  threshold: string;
}

interface RespuestaGemini{
  candidates:{
    content:{
      parts:{
        text:string;
      }[];
    };
    finishReason: string
  }[];
  usageMetaData?:{
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number
  }
}

@Injectable({
  providedIn: "root"
})
export class GeminiService {
  // Inyecciones de dependencias
  private http = inject(HttpClient)

  // variables que llevan la URL
  private apiURL = environment.gemini.apiURL
  private apiKey = environment.gemini.apikey

  enviarMensaje(mensaje: string, historialPrevio: contentGemini[]=[]): Observable<string>{
    // Verificar si la url esta bien verificada
    if(!this.apiKey || this.apiKey == 'Tu_api_key_de_gemini'){
      console.error('Error la api Key no esta bien configuarada')
      return throwError(()=> new Error('Api de gemini no configurada correctamente'))
    }

    const headers = new HttpHeaders({
      'content-type': 'application/json'
    })

    // Vamos a enviar un mensaje al contenido del sistema
    const mensajeSistema: contentGemini={
      role: 'User',
      parts: [{
        text: 'Eres un asistente virtual útil y amigable, responde siempre en español de manera concisa eres especialista en preguntas generales y sobretodo en programación de software. Manten un tono profesional pero cercano'}]
    }

    const respuestaSistema: contentGemini={
      role: 'model',
      parts:[{
        text: 'Entendido, soy tu asistente virtual especializado en programación de software, te contestare en español ¿En qué puedo ayudarte?'
      }]
    }

    const contenido: contentGemini[] = [
      mensajeSistema,
      respuestaSistema,
      // Traer el historial previo
      ...historialPrevio,
      {
        role:'User',
        parts:[{text:mensaje}]
      }
    ];

    const configuracionesSeguridad: safetySettings[]=[
      {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ];

    const cuerpoPeticion: PeticionGemini={
      contents: contenido,
      generationConfig:{
        maxOutputTokens:800,
        temperature:0.7
      },
      safetySettings: configuracionesSeguridad
    };

    // Vamos a generar la url completa
    const urlCompleta = `${this.apiURL}?key=${this.apiKey}`

    // Hacer la petición a HTTP de conectarnos a la api de Gemini
    return this.http.post<RespuestaGemini>(urlCompleta, cuerpoPeticion, {headers})
    .pipe(
      map( respuesta => {
        // Vamos a revisar que la respuesta tenga un formato correcto
        if(respuesta.candidates && respuesta.candidates.length>0){
          const candidate = respuesta.candidates[0];
          if(candidate.content.parts && candidate.content.parts.length>0){
            let contenidoRespuesta = candidate.content.parts[0].text;

            // Validación por si la respuesta es erronea por el limite de tokens
            if(candidate.finishReason === "MAX_TOKENS"){
              contenidoRespuesta += "\n\n[nota: r\Respuesta truncada por el límite de tokens, puedes pedirme que continue de nuevo]"
            }

            return contenidoRespuesta;
          }else{
            throw new Error('Respuesta no contiene un formato válido')
          }
        }else{
          throw new Error('Respuesta no contiene un formato esperado')
        }
      }),
      catchError(error =>{
        console.log("Error al comunicarse con gemini")
        let mensajeError = 'Error al conectarse con gemini'

        if(error.status === 400){
          mensajeError = "Petición inválida a Gemini, verifique la configuración" 
        }else if(error.status === 403){
          mensajeError = "Error clave de api no válida o sin permisos"
        }else if(error.status === 429){
          mensajeError = "Has excedido el limite de peticiones a gemini, Intenta más tarde"
        }else if(error.status === 500){
          mensajeError = "Error con el servidor de gemini"
        }
        return throwError(() => new Error(mensajeError));
      })
    )
  }

  // Función para convertir al formato de Gemini
  convertirHistorialGemini(mensaje: any[]): contentGemini[]{
    const historialConvertido: contentGemini[] = mensaje.map(msg => (
      {
      role: (msg.tipo === 'Usuario' ? 'user' : 'model') as 'User' | 'model',
      parts: [{text:msg.contenido}]
      }
    ));

    if(historialConvertido.length>8){
      const ultimosMensajes =historialConvertido.slice(-8)

      if(ultimosMensajes.length>0 && ultimosMensajes[0].role === 'model'){
        return ultimosMensajes.slice(1);
      }
      return ultimosMensajes;
    }
    return historialConvertido;
  }

  verificarConfiguracion(): boolean{
    const configuracionValida = !!(this.apiKey && this.apiKey !==
      "Tu_api_key_de_gemini" && this.apiURL);
      return configuracionValida;
  }

}
