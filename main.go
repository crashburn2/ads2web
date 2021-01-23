package main

//package http

import (
	"fmt"
	"log"

	//"example.com/http"
	"github.com/gofiber/fiber/v2"
)

type Hero struct {
	id   int
	name string
}

func main() {

	app := fiber.New()
	heroes := fiber.New()

	var a [20]Hero
	a[0].id = 0
	a[0].name = "Johnny"

	app.Get("/foo", func(c *fiber.Ctx) error {
		fmt.Print("Go Sendet jetzt einen String an /foo")
		return c.SendString("Von go gesendeter String")
	})

	heroes.Get("/api/heroes", func(c *fiber.Ctx) error {
		fmt.Print("\nGo Sendet jetzt Helden an /api/heroes\n")
		fmt.Print("", a[0].name)
		//return c.SendString("Hier könnte ihr Held stehen")
		return c.JSON(a)
	})

	//log.Fatal(app.Listen(":3000"))
	log.Fatal(heroes.Listen(":3000"))

}
