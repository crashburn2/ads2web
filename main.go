package main

import (
	"fmt"
	"log"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

const (
	count = 20
)

type Hero struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

func main() {

	app := fiber.New()
	a := make([]Hero, count)
	for i := 0; i < count; i++ {
		a[i].Id = i + 1
		a[i].Name = ("Held" + strconv.Itoa(i))
	}

	app.Get("/foo", func(c *fiber.Ctx) error {
		fmt.Print("Go Sendet jetzt einen String an /foo")
		return c.SendString("Von go gesendeter String")
	})

	app.Get("/api/heroes", func(c *fiber.Ctx) error {
		return c.JSON(a)
	})

	log.Fatal(app.Listen(":3000"))

	Hello

}
