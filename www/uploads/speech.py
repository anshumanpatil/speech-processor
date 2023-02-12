
# !/usr/bin/env python3

import speech_recognition as sr
from os import path
import sys

from kafka import KafkaConsumer, KafkaProducer
import sys
import json
global_id_var = []
bootstrap_servers = ['localhost:9092']
topicName = 'speech-translator-receiver'

topicResultName = 'speech-translator-stt'
producer = KafkaProducer(bootstrap_servers = bootstrap_servers)
producer = KafkaProducer()

consumer = KafkaConsumer (topicName, group_id = 'group1',bootstrap_servers = bootstrap_servers, auto_offset_reset = 'earliest')
    

def speech_rec(message):
    json_object = json.loads(message)
    print(json_object)
    print("\n\n")
    global_id_var.append(json_object["id"])
    print(global_id_var)
    print(json_object["name"])

    AUDIO_FILE = path.join(path.dirname(path.realpath(__file__)), json_object["name"]   )
    r = sr.Recognizer()
    with sr.AudioFile(AUDIO_FILE) as source:
        audio = r.record(source)
    try:
        sp = r.recognize_google(audio)
        print("Google Speech Recognition thinks you said " + r.recognize_google(audio))
        return sp
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand audio")
        return "Google Speech Recognition could not understand audio"
    except sr.RequestError as e:
        print("Could not request results from Google Speech Recognition service; {0}".format(e))
        return e

try:
    for message in consumer:
        # print ("%s:%d:%d: key=%s value=%s" % (message.topic, message.partition,message.offset, message.key,message.value))
        spVal = speech_rec(message.value)
        print(type(spVal))
        if(isinstance(spVal, str)):
            ack = producer.send(topicResultName, str.encode(spVal))

except KeyboardInterrupt:
    sys.exit()


