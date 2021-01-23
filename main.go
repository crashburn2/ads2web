package main

//package http

import (
	"fmt"
	"log"

	"example.com/http"
	"github.com/gofiber/fiber/v2"
)

func main() {
	fiber := fiber.New()

	fiber.Get("/foo", func(c *fiber.Ctx) error {
		fmt.Print("Go1")
		return c.SendString("Mach mal was")
	})

	fmt.Println("Hello, World!")
	fmt.Println(http.Hello("Crash"))

	log.Fatal(fiber.Listen(":3000"))
}
