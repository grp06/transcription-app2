import React, { useState, useEffect } from 'react'
import io from 'socket.io-client'
import RecordRTC from 'recordrtc'

const socket = io('http://127.0.0.1:5001')

const App = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [recorder, setRecorder] = useState(null)

  useEffect(() => {
    socket.on('transcription', (transcription) => {
      console.log('🚀 ~ socket.on ~ transcription:', transcription)
      setTranscription(transcription.text)
    })

    return () => {
      socket.off('transcription')
    }
  }, [])

  const startRecording = () => {
    console.log('starting recording')
    setIsRecording(true)
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const options = {
        type: 'audio',
        mimeType: 'audio/mp3',
        numberOfAudioChannels: 1,
        recorderType: RecordRTC.StereoAudioRecorder,
        checkForInactiveTracks: true,
        timeSlice: 5000,
        ondataavailable: (blob) => {
          socket.emit('audio', { buffer: blob })
        },
      }

      const recordRTC = new RecordRTC(stream, options)
      setRecorder(recordRTC)
      recordRTC.startRecording()
    })
  }

  const stopRecording = () => {
    setIsRecording(false)
    recorder.stopRecording(() => {
      socket.off('transcription')
      recorder.clearRecordedData()
      setRecorder(null)
    })
  }

  socket.on('connect', () => {
    console.log('connected to socket server')
  })

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <div>{transcription}</div>
    </div>
  )
}

export default App
