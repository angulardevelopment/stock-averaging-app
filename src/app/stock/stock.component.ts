import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as XLSX from 'xlsx';
import { CommonService } from '../common.service';
import linkifyHtml from 'linkify-html';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css'],
})
export class StockComponent implements OnInit {
  @ViewChild("myDiv") divView: ElementRef;

  firstBuyPrice;
  firstShare;
  totalFirstPrice;
  secondBuyPrice;
  secondShare;
  totalSecondPrice;
  averagePrice;
  totalShares;
  totalAmount;
  form: FormGroup;
  file;
  arrayBuffer;
  totalValue = '0';
  finalJson = {};
  counter = 0;
  allData = [];
  constructor(private fb: FormBuilder, private comm: CommonService) {

    this.comm.showNav = false;

  }

  ngOnInit() {
    this.form = this.fb.group({
      numVal1: '',
      numVal2: '',
    });
  }
  ngAfterViewInit() {
    // console.log(getUrls(this.divView.nativeElement.innerHTML));

    const options = { defaultProtocol: 'https' , target:"_blank"};
    this.divView.nativeElement.innerHTML = linkifyHtml(this.divView.nativeElement.innerHTML, options);


  }
  getFirstTotal() {
    this.totalFirstPrice = this.firstBuyPrice * this.firstShare;
  }

  getSecondTotal() {
    this.totalSecondPrice = this.secondBuyPrice * this.secondShare;
    const avg = (this.totalFirstPrice + this.totalSecondPrice) /
      (this.firstShare + this.secondShare);
    this.averagePrice = avg.toFixed(2);

    this.totalShares = this.firstShare + this.secondShare;
    this.totalAmount = this.totalSecondPrice + this.totalFirstPrice;
  }


  priceChangePercent(numVal1, numVal2) {
    this.totalValue = (((numVal2 - numVal1) / numVal1) * 100).toFixed(2);


  }

  submit(nums) {
    this.priceChangePercent(nums.numVal1, nums.numVal2);
  }


  addfile(event) {
    this.finalJson = {};
    this.file = event.target.files[0];
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(this.file);
    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i)
        arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join('');
      var workbook = XLSX.read(bstr, { type: 'binary' });
      var first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[first_sheet_name];
      const val = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      var arraylist = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      this.allData = val;

      this.getMaxElem(val, 'VOLUME', 'call');
      const callVolume = this.getFinalSum(val, 'VOLUME', 'call');
      const callOI = this.getFinalSum(val, 'OI', 'call');

      const highOicall = this.getMaxElem(val, 'OI', 'call');
      this.getMaxElem(val, 'CHNG IN OI', 'call');

      this.getMaxElem(val, 'VOLUME_1', 'put');
      const highOiput = this.getMaxElem(val, 'OI_1', 'put');
      this.getMaxElem(val, 'CHNG IN OI_1', 'put');
      const putVolume = this.getFinalSum(val, 'VOLUME_1', 'put');
      const putOi = this.getFinalSum(val, 'OI_1', 'put');


      const f = this.finalData(callVolume, putVolume);
      const f3 = this.finalData2(callOI, putOi);

      const f2 = this.safeStrike(highOicall, highOiput);


    };
  }

  checkNumber(val) {
    return isNaN(val) ? 0 : val;
  }

  getMaxElem(arr, key, type) {
    arr.sort((a, b) =>
      this.checkNumber(a[key]) < this.checkNumber(b[key])
        ? 1
        : this.checkNumber(a[key]) > this.checkNumber(b[key])
          ? -1
          : 0
    );
    let aerf = type == 'put' ? arr[0]['LTP_1'] : arr[0]['LTP'];
    let aerf2 = type == 'put' ? arr[1]['LTP_1'] : arr[1]['LTP'];

    let aerf3 = type == 'put' ? arr[2]['LTP_1'] : arr[2]['LTP'];

    let aerf4 = type == 'put' ? arr[0]['OI_1'] : arr[0]['OI'];
    let aerf5 = type == 'put' ? arr[1]['OI_1'] : arr[1]['OI'];

    let aerf6 = type == 'put' ? arr[2]['OI_1'] : arr[2]['OI'];

    let abc = `Top ${key} STRIKE ${arr[0]['STRIKE PRICE']} First highest ${type} LTP ${aerf} OI data ${aerf4}`;
    let abc2 = `Top ${key} STRIKE', ${arr[1]['STRIKE PRICE']} Second highest ${type} LTP ${aerf2} OI data ${aerf5}`;
    let abc3 = `Top ${key} STRIKE', ${arr[2]['STRIKE PRICE']} Third highest ${type} LTP ${aerf3} OI data ${aerf6}`;

    const d = { key1: abc, key2: abc2, key3: abc3 };
    this.finalJson[this.counter] = d;
    this.counter++;
    // console.log(abc);
    // console.log(abc2);
    // console.log(abc3);
    // console.log(arr.slice(0, 3));
    return arr[0]['STRIKE PRICE'];
  }

  getFinalSum(arr, key, type) {
    const result = arr.reduce(
      (sum, cur) => sum + this.checkNumber(cur[key]),
      0
    );
    // console.log(`${result} total ${key} ${type}`);
    return result;
  }

  finalData(call, put) {
    let ratio = (parseInt(put) / parseInt(call)).toFixed(2);
    this.finalJson['PCR volume'] = ratio;
  }

  finalData2(call, put) {
    let ratio = (parseInt(put) / parseInt(call)).toFixed(2);
    this.finalJson['PCR OI'] = ratio;
  }

  safeStrike(highcall, highputoi) {
    const safe = (highcall + highputoi) / 2;
    this.finalJson['Safe strike'] = safe;
  }
}
