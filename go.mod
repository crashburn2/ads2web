module main.go

go 1.15

replace "example.com/greetings" => ..\TourOfHeros\Data.go

require (
	github.com/gofiber/fiber/v2 v2.3.3
)
