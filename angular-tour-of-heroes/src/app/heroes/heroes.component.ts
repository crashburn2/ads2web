import { Component, OnInit } from '@angular/core';
import { Hero } from '../hero';
import { HeroService } from '../hero.service';

@Component({
  selector: 'app-heroes',
  templateUrl: './heroes.component.html',
  styleUrls: ['./heroes.component.scss']
})
export class HeroesComponent implements OnInit {

  heroes: Hero[] | undefined;

  subscribeToHeroes(): void {
    const heroObservable = this.heroService.getHeroes();
    heroObservable.subscribe(heroes => this.heroes = heroes)
  }

  constructor(
    private heroService: HeroService) {
    this.subscribeToHeroes();
  }

  async getHeroes(): Promise<Hero[] | undefined> {
    var privateHeroes: Hero[] | undefined

    return new Promise(resolve => {
      const heroObservable = this.heroService.getHeroes();
    heroObservable.subscribe(heroes => resolve(heroes))});
  }

  async ngOnInit(): Promise<void> {
    await this.getHeroes();
    if (!this.heroes) {
      console.log("Fehler: heroes Empty")
      return
    }
  }
}