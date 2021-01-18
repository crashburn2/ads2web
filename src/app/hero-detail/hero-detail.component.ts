import { Component, OnInit , Input} from '@angular/core';
import{Hero} from '../hero'

@Component({
  selector: 'app-hero-detail',
  templateUrl: './hero-detail.component.html',
  styleUrls: ['./hero-detail.component.scss']
})
export class HeroDetailComponent implements OnInit {
  @Input() hero : Hero = {  //Warum kann ich hier kein element erzeugen, ohne es zu initialisieren
    id: 1,
    name: 'Windfurz'
  };
  constructor() { }


  ngOnInit(): void {
  }

}
