package types

type Hero struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Elements string `json:"element"`
	Fliegen  bool   `json:"kannFliegen"`
	Magie    int    `json:"magie"`
}
