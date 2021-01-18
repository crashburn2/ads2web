import { Component, OnInit } from '@angular/core';
import { Hero } from '../hero';
import { HEROES } from '../mock-heroes';

@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  styleUrls: ['./heroes.component.scss']
})
export class HeroesComponent implements OnInit {

  heroes = HEROES;  // Warum muss diese Variable nicht initialisiert werden mit einer default variable?
  hero: Hero = {
    id: 1,
    name: 'Windfurz'
  };
  selectedHero: Hero = {
    id: 1,
    name: 'Windfurz'
  };
  name1: string = `${this.hero.name} ${this.hero.id}`;
  //selectedHero: Hero; Warum geht das nicht???????????????????????????

  //___________________
  // Ab Hier Funktionen
  //___________________

  onSelect(hero: Hero): void {
    this.selectedHero = hero
    console.log(this.selectedHero)
  }

  constructor() { }

  ngOnInit(): void {
  }












}
