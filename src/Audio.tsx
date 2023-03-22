import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import { doc } from 'firebase/firestore'
import { useEffect, useRef } from 'react'
import { useDocument } from 'react-firebase-hooks/firestore'
import { Navigate } from 'react-router-dom'
import { firestore } from './firebase/init'

const AudioPage = () => {
  const dataRef = doc(firestore, 'status/data')
  const [value] = useDocument(dataRef)

  const canvasContainer = useRef<HTMLDivElement>(null)
  const canvasElement = useRef<HTMLCanvasElement>(null)
  const drawLoop = useRef<number | undefined>(undefined)
  const audioContext = useRef<AudioContext | undefined>(undefined)
  const analyser = useRef<AnalyserNode | undefined>(undefined)
  const previousData = useRef<number[]>([])

  // Initial render
  useEffect(() => {
    const loadMicrophone = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })

      audioContext.current = new AudioContext()
      const source = audioContext.current.createMediaStreamSource(stream)

      // Gain node
      const gain = audioContext.current.createGain()
      gain.gain.value = 0.3

      // Create analyser
      analyser.current = audioContext.current.createAnalyser()
      analyser.current.fftSize = 1024

      // Connect the nodes
      source.connect(gain)
      gain.connect(analyser.current)
    }

    loadMicrophone()
    drawLoop.current = requestAnimationFrame(draw)

    return () => {
      if (drawLoop.current) {
        cancelAnimationFrame(drawLoop.current)
      }
    }
  }, [])

  const draw = () => {
    const canvas = canvasElement.current
    const ctx = canvas?.getContext('2d')

    if (!analyser.current || !ctx || !canvas) {
      drawLoop.current = requestAnimationFrame(draw)
      return
    }

    canvas.width = canvasContainer.current?.clientWidth || 100
    canvas.height = canvasContainer.current?.clientHeight || 100

    const canvasVerticalMiddle = canvas.height / 2

    const bufferLength = analyser.current.frequencyBinCount / 8
    const barWidth = canvas.width / bufferLength

    const dataArray = new Uint8Array(bufferLength)
    analyser.current.getByteFrequencyData(dataArray)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0.2, '#ec4747')
    gradient.addColorStop(0.5, 'rgb(0, 205, 253)')
    gradient.addColorStop(0.8, '#ec4747')
    ctx.fillStyle = gradient

    // Draw a full height bar to debug the gradient
    // ctx.fillStyle = gradient
    // ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < bufferLength; i++) {
      const normalizedSize = dataArray[i] / 255
      let barHeight = normalizedSize * canvasVerticalMiddle

      // Draw line with dots in both ends

      // Top part of the line
      ctx.beginPath()
      ctx.moveTo(i * barWidth, canvasVerticalMiddle)
      ctx.lineTo(i * barWidth, canvasVerticalMiddle - barHeight)
      ctx.lineWidth = 1
      ctx.strokeStyle = gradient
      ctx.stroke()

      // Bottom part
      ctx.beginPath()
      ctx.moveTo(i * barWidth, canvasVerticalMiddle)
      ctx.lineTo(i * barWidth, canvasVerticalMiddle + barHeight)
      ctx.lineWidth = 1
      ctx.strokeStyle = gradient
      ctx.stroke()

      // Draw a dot in the middle of the line in both ends
      ctx.beginPath()
      ctx.arc(i * barWidth, canvasVerticalMiddle - barHeight, barWidth / 3, 0, 2 * Math.PI)
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.beginPath()
      ctx.arc(i * barWidth, canvasVerticalMiddle + barHeight, barWidth / 3, 0, 2 * Math.PI)
      ctx.fillStyle = gradient
      ctx.fill()
    }

    drawLoop.current = requestAnimationFrame(draw)
  }

  if (value?.data()?.audioMode == false) {
    return <Navigate to="/" />
  }

  return (
    <Flex direction="column" w="100vw">
      <Box w="100vw" h="85vh" ref={canvasContainer}>
        <canvas
          id="canvas-element"
          ref={canvasElement}
          width="100"
          height="100"
          style={{
            position: 'relative',
            top: 0,
            left: 0,
          }}
        />
      </Box>
      <Flex flexDirection="column" h="15vh" p="6" bg="gray.900" justify="space-between">
        <Text color="gray.400">Viimeisin tunnistettu:</Text>
        <Heading size="3xl">{value?.data()?.ttsLine || '...'}</Heading>
      </Flex>
    </Flex>
  )
}

export { AudioPage as Audio }
