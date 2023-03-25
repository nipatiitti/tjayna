import { Box, Button, Center, Text } from '@chakra-ui/react'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-webgl'
import { DetailedHTMLProps, HTMLAttributes, useEffect, useRef, useState } from 'react'

import { doc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'
import { Navigate } from 'react-router-dom'
import { firestore } from './firebase/init'
import { Data } from './types/data'

const isUserMediaSupported = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

const minusOneOrOne = () => (Math.random() > 0.5 ? 1 : -1)
const addFakeError = (calibrated: boolean) => (calibrated ? 0 : Math.floor(Math.random() * 30) * minusOneOrOne())

const predictionBBOXToPercentage = (
  prediction: cocoSsd.DetectedObject,
  video: HTMLVideoElement,
  calibrated: boolean
) => {
  const sourceSize = { width: video.videoWidth, height: video.videoHeight }
  const { width, height } = video.getBoundingClientRect()
  const [x, y, w, h] = prediction.bbox

  return {
    left: (x / sourceSize.width) * width + addFakeError(calibrated),
    top: (y / sourceSize.height) * height + addFakeError(calibrated),
    width: (w / sourceSize.width) * width + addFakeError(calibrated),
    height: (h / sourceSize.height) * height + addFakeError(calibrated),
  }
}

export const App = () => {
  const videoTag = useRef<HTMLVideoElement>(null)
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [predictions, setPredictions] = useState<cocoSsd.DetectedObject[]>([])

  const [value] = useDocument(doc(firestore, 'status/data'))
  const [previousValue, setPreviousValue] = useState<Data | undefined>(value?.data() as Data | undefined)

  const startVideo = async () => {
    // @ts-ignore
    const permission = await navigator.permissions.query({ name: 'camera' })
    if (permission.state === 'denied') {
      alert('Kameraa ei sallittu')
      return
    }

    if (videoTag.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraEnabled(true)
      videoTag.current.srcObject = stream
      videoTag.current.addEventListener('loadeddata', predictWebcam)
    }
  }

  const predictWebcam = async () => {
    if (!model || !videoTag.current?.srcObject) return

    const newPredictions = await model.detect(videoTag.current)
    setPredictions(newPredictions.filter((prediction) => prediction.score > 0.66 && prediction.class === 'person'))
    window.requestAnimationFrame(predictWebcam)
  }

  useEffect(() => {
    const loadModel = async () => {
      const model = await cocoSsd.load()
      setModel(model)
    }

    loadModel()
  }, [])

  useEffect(() => {
    if (cameraEnabled) return
    if (!model) return

    console.log('Starting video')
    startVideo()
  }, [videoTag, model])

  useEffect(() => {
    const data = value?.data() as Data | undefined
    if (!data) return

    if (previousValue?.color === 'red' && data.color === 'green') {
      const audio = new Audio('/correct.wav')
      audio.play()
    }

    setPreviousValue(data)
  }, [value])

  const borderColor = value?.data()?.color ?? 'red'
  const calibrated = value?.data()?.calibrated ?? true

  const baseOverlayStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: 2,
    transition: '0.2s all ease-in-out',
    background: 'rgba(0, 0, 0, 0)',
  } as DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>['style']

  if (value?.data()?.audioMode == true) {
    return <Navigate to="/audio" />
  }

  if (!model)
    return (
      <Center p="8">
        <Text>Odota, lataamme AI mallia... Tässä saattaa mennä hetki</Text>
      </Center>
    )

  return isUserMediaSupported() ? (
    <Center w="100vw" height="100vh" bg="black" overflow="hidden">
      <Box
        border="5px solid"
        borderColor={borderColor}
        pos="relative"
        willChange="border"
        transition="0.2s all ease-in-out"
      >
        <video autoPlay muted ref={videoTag} style={{ width: '100vw', height: 'auto', objectFit: 'contain' }} />
        {predictions.map((prediction, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              ...predictionBBOXToPercentage(prediction, videoTag.current!, calibrated),
              background: calibrated ? 'rgba(0, 255, 0, 0.048)' : 'rgba(255, 0, 0, 0.048)',
              border: calibrated ? '2px dashed #6bcffd' : '2px dashed #ff0000',
              filter: calibrated ? 'blur(0px)' : 'blur(5px)',
              borderRadius: '4px',
              zIndex: 1,
            }}
          />
        ))}
        <div
          style={
            borderColor === 'green'
              ? {
                  ...baseOverlayStyle,
                  background: 'rgba(0, 255, 0, 0.432)',
                }
              : baseOverlayStyle
          }
        />
      </Box>
      {!cameraEnabled && (
        <Center pos="absolute" top="8" w="full">
          <Button variant="solid" colorScheme="pink" onClick={startVideo}>
            Käynnistä kamera
          </Button>
        </Center>
      )}
    </Center>
  ) : (
    <Center p="8">
      <Text>Käytät selainta, joka ei tue verkkokameraa tai selaimesi on liian vanha. Kokeile uudempaa selainta.</Text>
    </Center>
  )
}
