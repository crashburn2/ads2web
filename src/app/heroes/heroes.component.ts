import { Component, OnInit } from '@angular/core';
import { Hero } from '../hero';
import { HeroService } from '../hero.service';
import { MessageService } from '../message.service';

@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  styleUrls: ['./heroes.component.scss']
})
export class HeroesComponent implements OnInit {

  heroes: Hero[] | undefined;
  selectedHero: Hero | undefined;

  onSelect(hero: Hero): void {

    this.messageService.add(`HeroesComponent: Selected hero id=${hero.id}`);
    this.selectedHero = hero
    console.log(this.selectedHero)
  }

  constructor(
    private heroService: HeroService,
    private messageService: MessageService
  ) { }

  getHeroes(test: boolean): void {
    if (test) {
      this.heroService.getHeroes().subscribe(heroes => this.heroes = heroes);
    }
  }

  ngOnInit(): void {
    this.getHeroes(true);
    if (!this.heroes) {
      console.log("Fehler: heroes Empty")
      return
    }
  }












}
