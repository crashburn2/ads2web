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

  heroes: Hero[] = [];
  hero: Hero = {
    id: 1,
    name: 'Windfurz'
  };
  selectedHero: Hero = {
    id: 1,
    name: 'Windfurz'
  };
  name1: string = `${this.hero.name} ${this.hero.id}`;
  //selectedHero: Hero; //Warum geht das nicht???????????????????????????

  //___________________
  // Ab Hier Funktionen
  //___________________

  onSelect(hero: Hero): void {
    this.messageService.add('HeroesComponent: Selected hero id=${hero.id}')
    this.selectedHero = hero
    console.log(this.selectedHero)
  }

  constructor(
    private heroService: HeroService,
    private messageService: MessageService
  ) { }

  getHeroes(): void {
    this.heroService.getHeroes().subscribe(heroes => this.heroes = heroes);
  }

  ngOnInit(): void {
    this.getHeroes();
  }












}
