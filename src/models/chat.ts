export interface MensajeChat{
    id: string,
    contenido:  string,
    usuarioId: string,
    fechaEnvio: Date,
    estado: 'Enviado' | 'Enviando' | 'Error' | 'Temporal'
    tipo: 'Usuario' | 'Asistente'
}

export interface ConversacionChat{
    id: string,
    usuarioId: string,
    mensajes: MensajeChat[],
    ultimaActividad: Date,
    fechaCreacion: Date,
    titulo: string,
}