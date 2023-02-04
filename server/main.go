package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type HTTPResponseObject map[string]interface{}

func main() {
	router := echo.New()
	router.Use(middleware.Logger())
	router.Use(middleware.Recover())
	router.Static("/", "www")
	router.POST("/upload", upload)
	router.Logger.Fatal(router.Start(":8080"))
}

func upload(c echo.Context) error {
	uploadFileName, err := filepath.Abs("www/uploads")
	if err != nil {
		log.Fatal(err)
	}
	tmStamp := strconv.FormatInt(time.Now().UnixNano()/int64(time.Millisecond), 16)
	uploadFileName += "/" + tmStamp + ".wav"
	url := "http://localhost:8080/uploads/" + tmStamp + ".wav"
	file, err := c.FormFile("audio")
	if err != nil {
		return err
	}
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
	return c.JSON(http.StatusOK, responseObject)
}
