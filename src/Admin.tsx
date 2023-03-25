import {
  Button,
  Card,
  Center,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react'
import { doc, updateDoc } from 'firebase/firestore'
import { useDocument } from 'react-firebase-hooks/firestore'
import { firestore } from './firebase/init'

export const Admin = () => {
  const dataRef = doc(firestore, 'status/data')
  const ttsLinesRef = doc(firestore, 'status/ttsLines')

  const [data] = useDocument(dataRef)
  const [ttsLines] = useDocument(ttsLinesRef)

  const toggleColor = async () => {
    await updateDoc(dataRef, {
      color: 'green',
    })

    setTimeout(() => {
      updateDoc(dataRef, {
        color: 'red',
      })
    }, 1000)
  }

  const addTTSLine: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const { ttsLine } = Object.fromEntries(formData.entries()) as { ttsLine: string }

    updateDoc(ttsLinesRef, {
      lines: [...(ttsLines?.data()?.lines ?? []), ttsLine],
    })
  }

  return (
    <VStack spacing="8" p="4">
      <Heading>Teekkarijayna admin paneeli</Heading>
      <VStack w="full" p="8" border="1px" borderRadius="md" borderColor="blue.400" spacing="8">
        <HStack w="full" wrap="wrap">
          <Flex direction="column">
            <Button colorScheme="green" onClick={toggleColor}>
              Oikea liike!
            </Button>
            <Text>
              Tämän hetkinen väri: <span style={{ color: data?.data()?.color ?? 'red' }}>{data?.data()?.color}</span>
            </Text>
          </Flex>
          <Text>
            Tästä napista painamalla <br />
            Välähtää kamera vihreänä <br />
          </Text>
        </HStack>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="audio-mode" mb="0">
            Kalibroitu:
          </FormLabel>
          <Switch
            id="calibrated"
            isChecked={data?.data()?.calibrated || false}
            onChange={(e) =>
              updateDoc(dataRef, {
                calibrated: e.target.checked,
              })
            }
          />
        </FormControl>
      </VStack>
      <VStack w="full" p="8" border="1px" borderRadius="md" borderColor="green.400" spacing="8" wrap="wrap">
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="audio-mode" mb="0">
            Audio mode päälle:
          </FormLabel>
          <Switch
            id="audio-mode"
            isChecked={data?.data()?.audioMode || false}
            onChange={(e) =>
              updateDoc(dataRef, {
                audioMode: e.target.checked,
              })
            }
          />
        </FormControl>
        <Button
          w="full"
          onClick={() =>
            updateDoc(dataRef, {
              ttsLine: '',
            })
          }
        >
          Tyhjennä tunnistus
        </Button>
        <VStack alignItems="flex-start" w="full">
          {ttsLines?.data()?.lines.map((line: string, index: number) => (
            <Card key={index} px="4" py="2" w="full" variant="outline">
              <Center justifyContent="flex-start">
                <Editable
                  flex="1"
                  value={line}
                  onChange={(newValue) =>
                    updateDoc(ttsLinesRef, {
                      lines: (ttsLines?.data()?.lines ?? []).map((line: string, i: number) =>
                        i === index ? newValue : line
                      ),
                    })
                  }
                >
                  <EditablePreview w="full" />
                  <EditableInput w="full" />
                </Editable>
                <Button
                  colorScheme="green"
                  mr="2"
                  onClick={() =>
                    updateDoc(dataRef, {
                      ttsLine: line,
                    })
                  }
                >
                  {/* Play button arrow */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="feather feather-play"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  colorScheme="orange"
                  onClick={() =>
                    updateDoc(ttsLinesRef, {
                      lines: (ttsLines?.data()?.lines ?? []).filter((line: string, i: number) => i !== index),
                    })
                  }
                >
                  Poista
                </Button>
              </Center>
            </Card>
          ))}
        </VStack>
        <form onSubmit={addTTSLine} style={{ width: '100%' }} name="tts-form">
          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="add-tts-line" minWidth="max-content">
              Lisää uusi
            </FormLabel>
            <Input id="add-tts-line" name="ttsLine" />
          </FormControl>
        </form>
      </VStack>
    </VStack>
  )
}
