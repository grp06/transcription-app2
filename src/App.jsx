import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import RecordRTC from 'recordrtc'

const socket = io('http://127.0.0.1:5001')

const App = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [recorder, setRecorder] = useState(null)
  const [totalAudioDuration, setTotalAudioDuration] = useState(0)
  const [topic, setTopic] = useState('')
  const [question, setQuestion] = useState('')

  useEffect(() => {
    console.log('Setting up socket event listeners')
    socket.on('transcription', (transcription) => {
      console.log('received transcription')
      setTranscription(transcription.text)
    })

    socket.on('topic', (topic) => {
      console.log('topic received:', topic) // Update this line
      setTopic(topic)
    })

    socket.on('question', (question) => {
      console.log('question received:', question) // Update this line
      setQuestion(question)
    })

    return () => {
      console.log('Removing socket event listeners')
      socket.off('transcription')
      socket.off('topic')
      socket.off('question')
    }
  }, [])

  const startRecording = () => {
    setIsRecording(true)
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const options = {
        type: 'audio',
        mimeType: 'audio/mp3',
        numberOfAudioChannels: 1,
        recorderType: RecordRTC.StereoAudioRecorder,
        checkForInactiveTracks: true,
        timeSlice: 10000,
        ondataavailable: (blob) => {
          const overlapDuration = 1000
          const startTime = totalAudioDuration - overlapDuration
          const endTime = startTime + options.timeSlice

          setTotalAudioDuration(
            totalAudioDuration + options.timeSlice - overlapDuration,
          )

          socket.emit('audio', {
            buffer: blob,
            start_time: startTime,
            end_time: endTime,
          })
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
      socket.off('topic')
      recorder.clearRecordedData()
      setRecorder(null)
    })
  }

  return (
    <div>
      <div className="ratings-container">
        <ul>
          <li>
            Topic: <span>{topic}</span>
          </li>
          <li>
            Q: <span>{question}</span>
          </li>
        </ul>
      </div>
      {!isRecording && (
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>
      )}
      {isRecording && (
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      )}
      <div className="transcription-container">{transcription}</div>
    </div>
  )
}

export default App
