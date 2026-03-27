import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface PeticionGemini {
  contents: ContentGemini[];
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
  safetySettings?: SafetySettings[];
}

interface ContentGemini {
  role: 'user' | 'model';
  parts: PartGemini[];
}

interface PartGemini {
  text: string;
}

interface SafetySettings {
  category: string;
  threshold: string;
}

interface RespuestaGemini {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

@Injectable({
  providedIn: "root"
})
export class GeminiService {
  private http = inject(HttpClient);

  private apiURL = environment.gemini.apiURL;
  private apiKey = environment.gemini.apikey;

  enviarMensaje(mensaje: string, historialPrevio: ContentGemini[] = []): Observable<string> {
    if (!this.apiKey || this.apiKey === 'Tu_api_key_de_gemini') {
      console.error('Error: la API Key no está bien configurada');
      return throwError(() => new Error('API de Gemini no configurada correctamente'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const mensajeSistema: ContentGemini = {
      role: 'user',
      parts: [{
        text: 'Eres un asistente virtual útil y amigable. Responde siempre en español de manera concisa. Eres especialista en programación de software y preguntas generales. Mantén un tono profesional pero cercano.'
      }]
    };

    const respuestaSistema: ContentGemini = {
      role: 'model',
      parts: [{
        text: 'Entendido. Responderé en español de forma clara y útil, especialmente sobre programación.'
      }]
    };

    const contenido: ContentGemini[] = [
      mensajeSistema,
      respuestaSistema,
      ...historialPrevio,
      {
        role: 'user',
        parts: [{ text: mensaje }]
      }
    ];

    const configuracionesSeguridad: SafetySettings[] = [
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

    const cuerpoPeticion: PeticionGemini = {
      contents: contenido,
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7
      },
      safetySettings: configuracionesSeguridad
    };

    const urlCompleta = `${this.apiURL}?key=${this.apiKey}`;
    console.log("apikey", this.apiKey)

    console.log('📤 Enviando a Gemini:', cuerpoPeticion);
    console.log('🌐 URL:', urlCompleta);

    return this.http.post<RespuestaGemini>(urlCompleta, cuerpoPeticion, { headers }).pipe(
      map(respuesta => {
        console.log('✅ Respuesta Gemini:', respuesta);

        if (respuesta.candidates && respuesta.candidates.length > 0) {
          const candidate = respuesta.candidates[0];

          if (candidate.content.parts && candidate.content.parts.length > 0) {
            let contenidoRespuesta = candidate.content.parts[0].text;

            if (candidate.finishReason === "MAX_TOKENS") {
              contenidoRespuesta += "\n\n[Nota: respuesta truncada por el límite de tokens. Puedes pedirme que continúe.]";
            }

            return contenidoRespuesta;
          } else {
            throw new Error('La respuesta no contiene texto válido');
          }
        } else {
          throw new Error('La respuesta no contiene candidates válidos');
        }
      }),
      catchError(error => {
        console.error("❌ Error completo al comunicarse con Gemini:", error);
        console.error("❌ Body del error:", error?.error);

        let mensajeError = 'Error al conectarse con Gemini';

        if (error.status === 400) {
          mensajeError = "Petición inválida a Gemini, verifica estructura, roles o parámetros";
        } else if (error.status === 403) {
          mensajeError = "Clave API no válida o sin permisos";
        } else if (error.status === 404) {
          mensajeError = "Endpoint de Gemini no encontrado";
        } else if (error.status === 429) {
          mensajeError = "Has excedido el límite de peticiones a Gemini";
        } else if (error.status === 500) {
          mensajeError = "Error interno del servidor de Gemini";
        }

        return throwError(() => new Error(mensajeError));
      })
    );
  }

  convertirHistorialGemini(mensajes: any[]): ContentGemini[] {
    const historialConvertido: ContentGemini[] = mensajes.map(msg => ({
      role: msg.tipo === 'Usuario' ? 'user' : 'model',
      parts: [{ text: msg.contenido }]
    }));

    const ultimosMensajes = historialConvertido.slice(-8);

    if (ultimosMensajes.length > 0 && ultimosMensajes[0].role === 'model') {
      return ultimosMensajes.slice(1);
    }

    return ultimosMensajes;
  }

  verificarConfiguracion(): boolean {
    return !!(
      this.apiKey &&
      this.apiKey !== "Tu_api_key_de_gemini" &&
      this.apiURL
    );
  }
}