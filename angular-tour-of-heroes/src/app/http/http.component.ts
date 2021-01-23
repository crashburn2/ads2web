import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-http',
  templateUrl: './http.component.html',
  styleUrls: ['./http.component.scss']
})
export class HttpComponent implements OnInit {
  appgo: any = "";
  goInput: any = "";

  constructor(private http: HttpClient) { }

  ngOnInit(): void { }

  async app(): Promise<any> {
    console.log("angu1")
    const data = await this.http.get("/foo",  //Variable data
      {
        responseType: "text"

      }).toPromise(this.appgo)
    console.log(data)
    this.goInput = data;
  }

}
