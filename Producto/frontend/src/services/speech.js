/**
 * Web Speech API wrapper
 */

export const initSpeechRecognition = (options = {}) => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    console.error('Web Speech API no soportado en este navegador')
    return null
  }

  const recognition = new SpeechRecognition()

  recognition.continuous = options.continuous || false
  recognition.interimResults = options.interimResults || true
  recognition.language = options.language || 'es-CL'

  return recognition
}

export const startListening = (recognition, onResult, onError) => {
  if (!recognition) return

  recognition.onresult = (event) => {
    let interimTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript

      if (event.results[i].isFinal) {
        onResult(transcript)
      } else {
        interimTranscript += transcript
      }
    }
  }

  recognition.onerror = (event) => {
    onError(event.error)
  }

  recognition.start()
}

export const stopListening = (recognition) => {
  if (recognition) {
    recognition.stop()
  }
}

export default {
  initSpeechRecognition,
  startListening,
  stopListening,
}
