import { Component, Input, OnInit } from '@angular/core';
import { Hero } from '../hero';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { HeroService } from '../hero.service';

@Component({
  selector: 'app-hero-detail',
  templateUrl: './hero-detail.component.html',
  styleUrls: ['./hero-detail.component.scss']
})
export class HeroDetailComponent implements OnInit {
  hero: Hero | undefined;
  heroId: number | undefined;
  constructor(
    private route: ActivatedRoute,
    private heroService: HeroService,
    private location: Location
  ) { }

  getHero(): void {
    const ids = this.route.snapshot.paramMap.getAll('id');
    const id = +ids[0];
    //const id = +this.route.snapshot.paramMap.get('id');
    console.log("Hero Id wird eingelesen")
    if (id) {
      console.log("Hero ID erkannt")
      this.heroService.getHero(id)
        .subscribe(hero => this.hero = hero);
    } else {
      console.log("keine Hero ID")
    }
  }

  ngOnInit(): void {
    this.getHero();
  }
}