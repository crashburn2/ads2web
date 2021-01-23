import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-http',
  templateUrl: './http.component.html',
  styleUrls: ['./http.component.scss']
})
export class HttpComponent implements OnInit {

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }

  async app2(): Promise<void> {
    console.log("app2 in angu")
    const data2 = await this.http.get("/foo2",
      {
        responseType: "text"
      }).toPromise()
    console.log(data2)
  }

}
