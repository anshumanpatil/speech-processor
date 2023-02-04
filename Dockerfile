FROM debian:bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    pocketsphinx \
    libportaudio2 \
    python3 \
    python3-pip \
    python3-pyaudio \
    nano
 
RUN pip install --upgrade pip setuptools wheel
RUN pip install pocketsphinx
RUN pip install SpeechRecognition


# sudo apt-get update -y
# sudo apt-get upgrade -y
# apt-get -y install pocketsphinx
# apt-get install libportaudio2 -y
# apt-get install python3
# apt-get install python3-pip
# pip install --upgrade pip setuptools wheel
# pip install pocketsphinx
# pip install SpeechRecognition
# apt-get install python3-pyaudio
# apt-get install nano

ENTRYPOINT ["tail", "-f", "/dev/null"]
# docker build -t speech-processor .
# docker run -p 8080:8080 speech-processor