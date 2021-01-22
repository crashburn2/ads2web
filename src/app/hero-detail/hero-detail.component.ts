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
  @Input() hero: Hero | undefined;
  constructor(
    private route: ActivatedRoute,
    private heroService: HeroService,
    private location: Location
  ) { }

  getHero(): void {
    if (!this.route.snapshot.paramMap) {
      const id = +this.route.snapshot.paramMap.get('id');
      this.heroService.getHero(id)
        .subscribe(hero => this.hero = hero);
    }
  }

  ngOnInit(): void {
    this.getHero();
  }

}
