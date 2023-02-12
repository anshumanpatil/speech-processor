package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/confluentinc/confluent-kafka-go/kafka"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type HTTPResponseObject map[string]interface{}

type FileMessage struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Path           string `json:"path"`
	InputLanguage  string `json:"input_language"`
	OutputLanguage string `json:"output_language"`
}

func main() {
	router := echo.New()
	router.Use(middleware.Logger())
	router.Use(middleware.Recover())
	router.Static("/", "www")
	router.POST("/upload", upload)
	router.Logger.Fatal(router.Start(":8081"))
}

func upload(c echo.Context) error {
	uploadPath, err := filepath.Abs("www/uploads")
	uploadFileName := ""

	if err != nil {
		log.Fatal(err)
	}

	file, err := c.FormFile("audio")
	if err != nil {
		return err
	}
	uploadFileName = uploadPath + "/" + file.Filename
	url := "http://localhost:8080/uploads/" + file.Filename

	fmt.Println("file", file.Filename)
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	// Destination
	dst, err := os.Create(uploadFileName)
	if err != nil {
		return err
	}
	defer dst.Close()

	// Copy
	if _, err = io.Copy(dst, src); err != nil {
		return err
	}
	responseObject := HTTPResponseObject{
		"name": uploadFileName,
		"url":  url,
	}

	fm := FileMessage{
		Name:          file.Filename,
		Path:          uploadFileName,
		InputLanguage: "en",
	}
	msg, err := json.Marshal(&fm)
	if err != nil {
		return err
	}
	producemsg(msg)
	return c.JSON(http.StatusOK, responseObject)
}

func producemsg(msg []byte) {
	m := kafka.ConfigMap{}
	m["bootstrap.servers"] = "localhost:9092"

	topic := "speech-translator-receiver"
	p, err := kafka.NewProducer(&m)

	if err != nil {
		fmt.Printf("Failed to create producer: %s", err)
		os.Exit(1)
	}
	p.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
		Key:            []byte("value"),
		Value:          msg,
	}, nil)
	// Wait for all messages to be delivered
	p.Flush(100)
	p.Close()
}
