import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface PeticionGemini{
 contents: contentGemini[]; // Vamos a cambiar por otra interfaz 
 generationConfig?: {
  maxOutputTokens?: Number;
  temperatura?: Number;
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
  candidate:{
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
  }
}
