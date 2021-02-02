import { Injectable } from '@angular/core';
import { Hero } from './hero';
import { Observable, of } from 'rxjs';
import { MessageService } from './message.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';

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
    console.log("Init Hero Service heroes Array: ", this.heroes);
    this.messageService.add("Init Hero Service heroes Array");
  }

  /** GET heroes from the server */
  getHeroes(): Observable<Hero[]> {
    return this.http.get<Hero[]>(this.heroesUrl)
      .pipe(
        tap(_ => console.log('fetched heroes')),
        catchError(this.handleError<Hero[]>('getHeroes', []))
      );
  }

  getHero(id: number | undefined): Observable<Hero | undefined> {
    //const url = `${this.heroesUrl}/${id}`;
    const url = `/detail/${id}`
    this.getHeroes().subscribe(heroes => this.heroes = heroes);

    // TODO: send the message _after_ fetching the hero
    if (id) {
      this.messageService.add(`HeroService: fetched hero id=${id}`);
    }
    var pickedHero: Hero | undefined = this.heroes.find(hero => hero.id === id);

    console.log("Ein Held wurde geklickt")
    console.log("id:", id)
    console.log(pickedHero)
    console.log(this.heroes)
    return of(this.heroes.find(hero => hero.id === id));
    
    return this.http.get<Hero>(url).pipe(
      tap(_ => this.log(`fetched hero id =${id}`)),
      catchError(this.handleError<Hero>(`getHero id=${id}`))
      );

  }
  /**
 * Handle Http operation that failed.
 * Let the app continue.
 * @param operation - name of the operation that failed
 * @param result - optional value to return as the observable result
 */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
