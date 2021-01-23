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
		fmt.Print("Go1")
		return c.SendString("Von go gesendeter String")
	})

	fmt.Println("Hello, World!")
	fmt.Println(http.Hello("Crash"))

	log.Fatal(app.Listen(":3000"))
}
