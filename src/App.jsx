import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import RecordRTC from 'recordrtc'

const socket = io('http://127.0.0.1:5001')

const App = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [recorder, setRecorder] = useState(null)
  const [totalAudioDuration, setTotalAudioDuration] = useState(0)
  const [topic, setTopic] = useState('')
  const [question, setQuestion] = useState('')
  const [claim, setClaim] = useState('')
  const [factRating, setFactRating] = useState(-1)
  const [news, setNews] = useState(0)
  const [imgur, setImgur] = useState(0)

  useEffect(() => {
    socket.on('topic', (topic) => {
      setTopic(topic)
    })

    socket.on('claim', (currentClaim) => {
      setClaim(currentClaim)
    })

    socket.on('question', (question) => {
      setQuestion(question)
    })

    socket.on('fact_rating', (fact_rating) => {
      setFactRating(fact_rating)
    })

    socket.on('imgur', (imgur) => {
      setImgur(imgur)
    })

    socket.on('news_obj', (news_obj) => {
      console.log('🚀 ~ socket.on ~ news_obj:', news_obj)
      setNews(news_obj)
    })

    return () => {
      socket.off('topic')
      socket.off('claim')
      socket.off('fact_rating')
      socket.off('news_obj')
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
      socket.off('topic')
      socket.off('claim')
      socket.off('fact_rating')
      socket.off('news_obj')
      recorder.clearRecordedData()
      setRecorder(null)
    })
  }

  return (
    <div>
      <div className="ratings-container">
        <div className={`prompt-box topic ${!topic && 'hidden'}`}>
          Topic: <span>{topic}</span>
        </div>

        <div className={`prompt-box question ${!question && 'hidden'}`}>
          Q: <span>{question}</span>
        </div>
        <div
          className={`prompt-box fact-check ${factRating === -1 && 'hidden'}`}
        >
          <div>Claim: {claim}</div>
          <div>Bullshit %: {factRating}</div>
        </div>

        <div className={`prompt-box from-the-news ${!news && 'hidden'}`}>
          <a href={news.url}>{news.headline}</a>
          <img src={news.urlToImage} />
        </div>

        <div className={`prompt-box imgur ${!imgur && 'hidden'}`}>
          <img src={imgur} />
        </div>
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
    </div>
  )
}

export default App
