package main

//package http

import (
	"fmt"
	"log"

	"example.com/http"
	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	app.Get("/foo", func(c *fiber.Ctx) error {
		fmt.Print("Go Sendet jetzt einen String an /foo")
		return c.SendString("Von go gesendeter String")
	})


	log.Fatal(app.Listen(":3000"))
	fmt.Println("Listen on 3000/foo

}
