import { Injectable } from '@angular/core';
import { Hero } from './hero';
import { Observable, of } from 'rxjs';
import { MessageService } from './message.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HeroService {

  heroes: Hero[] = new Array();

  constructor(
    private messageService: MessageService,
    private http: HttpClient) { }

  private heroesUrl = 'api/heroes'
  private log(message: string) {
    this.messageService.add(`HeroService: ${message}`)
  }



  ngOnInit(): void {
    this.getHeroes().subscribe(heroes => this.heroes = heroes);
    console.log("Init Hero Service heroes Array: ",this.heroes)
  }

  getHeroes(): Observable<Hero[]> {
    // TODO: send the message _after_ fetching the heroes
    this.messageService.add('HeroService: fetched heroes');


    return this.http.get<Hero[]>(this.heroesUrl)
  }
  getHero(id: number | undefined): Observable<Hero | undefined> {
    this.getHeroes().subscribe(heroes => this.heroes = heroes);

    // TODO: send the message _after_ fetching the hero
    if (id) {
      this.messageService.add(`HeroService: fetched hero id=${id}`);
    }
    var pickedHero : Hero | undefined = this.heroes.find(hero => hero.id === id);

    console.log("Ein Held wurde geklickt")
    console.log("id:",id)
    console.log(pickedHero)
    console.log(this.heroes)
    return of(this.heroes.find(hero => hero.id === id));
  }
}
//(method) Array<Hero>.find(predicate: (value: Hero, index: number, obj: Hero[]) => unknown, thisArg?: any): Hero | undefined